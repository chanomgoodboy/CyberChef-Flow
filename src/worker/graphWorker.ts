/// <reference lib="webworker" />

/**
 * Graph execution Web Worker.
 *
 * Owns the entire engine pipeline (GraphEngine, NodeExecutor,
 * OperationAdapter, MagicEngine).  The main thread communicates via
 * the message protocol defined in `./protocol.ts`.
 *
 * IMPORTANT: All async handlers are serialized through `taskQueue` so
 * that at most one engine.execute() or magic analysis runs at a time.
 * Without this, two interleaved executions corrupt shared CyberChef
 * module state and cause hangs.  Both handlers check `abortedIds` at
 * each yield point so aborted tasks exit quickly.
 */

// Polyfills must be first — CyberChef deps need Buffer/process/global.
import '../polyfills';

// CyberChef operations expect these on `self` in worker environments.
// In original CyberChef they're set by ChefWorker.js; we stub them here.
(self as any).sendStatusMessage = (_msg: string) => { /* no-op */ };
(self as any).setOption = (_opt: string, _val: any) => { /* no-op */ };
(self as any).docURL = self.location?.origin ?? '';

import { execute } from '../engine/GraphEngine';
import { quickMagicFast } from '../engine/MagicEngine';
import { setClueCache } from '../custom-ops/_lib/cipherIdentifier';
import * as BackendClient from './BackendClient';

import type {
  MainToWorkerMessage,
  WorkerToMainMessage,
  ExecuteMessage,
  MagicAnalyzeMessage,
  CribAnalyzeMessage,
  SerializedNodeResult,
} from './protocol';
import type { MagicHintSuggestion } from '@/engine/MagicEngine';

/* ------------------------------------------------------------------ */
/*  Abort tracking                                                     */
/* ------------------------------------------------------------------ */

const abortedIds = new Set<number>();

/* ------------------------------------------------------------------ */
/*  Task queue — serializes all async work                             */
/* ------------------------------------------------------------------ */

let taskQueue: Promise<void> = Promise.resolve();

/**
 * Enqueue an async task so it runs only after all previous tasks
 * have finished.  This prevents two engine.execute() calls from
 * interleaving.
 */
function enqueue(fn: () => Promise<void>) {
  taskQueue = taskQueue.then(fn, fn);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Post a typed message to the main thread, optionally with transferables. */
function post(msg: WorkerToMainMessage, transfer?: Transferable[]) {
  if (transfer && transfer.length > 0) {
    postMessage(msg, transfer);
  } else {
    postMessage(msg);
  }
}

/**
 * Collect ArrayBuffer transferables from a serialized node result.
 * This enables zero-copy transfer of large buffers back to main thread.
 */
function collectTransferables(result: SerializedNodeResult): Transferable[] {
  const transfers: Transferable[] = [];
  if (
    result.output &&
    result.output.value instanceof ArrayBuffer &&
    result.output.value.byteLength > 0
  ) {
    transfers.push(result.output.value);
  }
  return transfers;
}

/* ------------------------------------------------------------------ */
/*  Execute handler                                                    */
/* ------------------------------------------------------------------ */

async function handleExecute(msg: ExecuteMessage) {
  const { executionId, nodes: serializedNodes, edges: serializedEdges } = msg;

  if (abortedIds.has(executionId)) {
    abortedIds.delete(executionId);
    return;
  }

  try {
    // Reconstitute nodes with a dummy position so they satisfy the
    // Node<GraphNodeData> type expected by the engine.  The engine
    // never reads `position`.
    const nodes = serializedNodes.map((n) => ({
      ...n,
      position: { x: 0, y: 0 },
    }));

    const edges = serializedEdges.map((e) => ({
      ...e,
    }));

    // Build execution options
    const options: Parameters<typeof execute>[3] = {};
    if (msg.changedNodeId) {
      options.changedNodeId = msg.changedNodeId;
    }
    if (msg.existingResults) {
      options.existingResults = new Map(
        msg.existingResults.map(([id, r]) => [
          id,
          { ...r },
        ]),
      );
    }
    if (msg.forceNodeIds && msg.forceNodeIds.length > 0) {
      options.forceNodeIds = new Set(msg.forceNodeIds);
    }

    // Backend operations run in the background — their results are
    // posted via `node-update` independently of the execution lifecycle.
    options.onDeferredResult = (nodeId, result) => {
      const clone = { ...result };
      if (
        clone.output &&
        (clone.output as any).value instanceof ArrayBuffer
      ) {
        clone.output = {
          ...(clone.output as any),
          value: ((clone.output as any).value as ArrayBuffer).slice(0),
        };
      }
      const transfers: Transferable[] = [];
      if (clone.output && (clone.output as any).value instanceof ArrayBuffer) {
        transfers.push((clone.output as any).value);
      }
      post(
        { type: 'node-update', nodeId, result: clone as any },
        transfers,
      );
    };

    // Progress callback — posts incremental results to main thread.
    // Throws on abort so the engine exits immediately instead of
    // running remaining nodes to completion.
    const onProgress = (nodeId: string, result: SerializedNodeResult) => {
      if (abortedIds.has(executionId)) {
        throw new DOMException('Execution aborted', 'AbortError');
      }
      // Clone the result's ArrayBuffer before transferring so the
      // engine can keep using its copy for downstream nodes.
      const clone: SerializedNodeResult = { ...result };
      if (
        clone.output &&
        clone.output.value instanceof ArrayBuffer
      ) {
        clone.output = {
          ...clone.output,
          value: clone.output.value.slice(0),
        };
      }
      const transfers = collectTransferables(clone);
      post(
        { type: 'progress', executionId, nodeId, result: clone },
        transfers,
      );
    };

    const resultOrError = await execute(
      nodes as any,
      edges as any,
      onProgress as any,
      options,
    );

    if (abortedIds.has(executionId)) {
      abortedIds.delete(executionId);
      return;
    }

    // Cycle error
    if (resultOrError && 'type' in resultOrError && resultOrError.type === 'cycle') {
      post({
        type: 'cycle-error',
        executionId,
        nodeIds: resultOrError.nodeIds,
      });
      return;
    }

    // Success — all individual results were already sent via progress
    // callbacks, so `complete` is just a "done" signal.
    post({ type: 'complete', executionId, results: [] });
  } catch (err: any) {
    // AbortError is expected when we throw from onProgress — just clean up.
    if (err?.name === 'AbortError' || abortedIds.has(executionId)) {
      abortedIds.delete(executionId);
      return;
    }
    post({
      type: 'error',
      executionId,
      message: err?.message ?? String(err),
    });
  }
}

/* ------------------------------------------------------------------ */
/*  Magic analysis handler                                             */
/* ------------------------------------------------------------------ */

async function handleMagicAnalyze(msg: MagicAnalyzeMessage) {
  const { executionId, leaves } = msg;

  // Early exit if already aborted (e.g. a new execution was queued
  // while this was waiting in the task queue).
  if (abortedIds.has(executionId)) {
    abortedIds.delete(executionId);
    return;
  }

  // We dynamically import Dish inside the handler so the top-level
  // worker load isn't blocked by it.
  const { default: Dish } = await import('@cyberchef/Dish.mjs');

  for (const leaf of leaves) {
    if (abortedIds.has(executionId)) break;

    try {
      // Reconstruct Dish from DishData, then get ArrayBuffer for magic
      const dish = new Dish(leaf.dishData.value, leaf.dishData.type);
      const buf: ArrayBuffer = await Promise.resolve(
        dish.get(Dish.ARRAY_BUFFER),
      );

      if (buf.byteLength < 2) continue;

      // Fast analysis: sync-only (entropy, file type, language, signatures).
      // Does NOT run speculativeExecution so it never blocks the queue.
      const hint = quickMagicFast(buf);

      if (abortedIds.has(executionId)) break;

      post({
        type: 'magic-result',
        executionId,
        nodeId: leaf.nodeId,
        hint,
      });
    } catch {
      // Silently skip nodes whose output can't be analysed
    }
  }

  abortedIds.delete(executionId);
}

/* ------------------------------------------------------------------ */
/*  Crib analysis handler                                              */
/* ------------------------------------------------------------------ */

/** Returns true if >=70% of characters are printable ASCII. */
function isMostlyPrintable(s: string): boolean {
  if (s.length === 0) return false;
  let printable = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if ((c >= 0x20 && c <= 0x7e) || c === 0x09 || c === 0x0a || c === 0x0d) printable++;
  }
  return printable / s.length >= 0.7;
}

/** Shannon entropy of a string. */
function shannonEntropy(s: string): number {
  if (s.length === 0) return 0;
  const freq = new Map<number, number>();
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    freq.set(c, (freq.get(c) ?? 0) + 1);
  }
  let entropy = 0;
  const len = s.length;
  for (const count of freq.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

async function handleCribAnalyze(msg: CribAnalyzeMessage) {
  const { executionId, leaves, secrets } = msg;

  // Cache secrets so CipherIdentifier can read them during graph execution
  setClueCache(secrets);

  if (abortedIds.has(executionId)) {
    abortedIds.delete(executionId);
    return;
  }

  const [{ default: Dish }, { OperationAdapter }, { getCribOps }] = await Promise.all([
    import('@cyberchef/Dish.mjs'),
    import('../adapter/OperationAdapter'),
    import('../engine/cribOps'),
  ]);

  const cribOps = getCribOps();

  for (const leaf of leaves) {
    if (abortedIds.has(executionId)) break;

    try {
      const dish = new Dish(leaf.dishData.value, leaf.dishData.type);
      const buf: ArrayBuffer = await Promise.resolve(dish.get(Dish.ARRAY_BUFFER));
      if (buf.byteLength < 2) continue;

      const suggestions: MagicHintSuggestion[] = [];

      for (const secret of secrets) {
        if (abortedIds.has(executionId)) break;

        for (const cribOp of cribOps) {
          if (abortedIds.has(executionId)) break;

          try {
            const adapter = await OperationAdapter.create(cribOp.op);
            const inputDish = new Dish(buf.slice(0), Dish.ARRAY_BUFFER);
            const args = cribOp.buildArgs(secret);
            const outputDish = await adapter.execute(inputDish, args);

            const outputBuf: ArrayBuffer = await Promise.resolve(
              outputDish.get(Dish.ARRAY_BUFFER),
            );
            if (outputBuf.byteLength === 0) continue;

            // Try to decode as text
            let text: string;
            try {
              text = new TextDecoder('utf-8', { fatal: true }).decode(outputBuf);
            } catch {
              continue;
            }

            if (!isMostlyPrintable(text)) continue;

            const entropy = shannonEntropy(text);
            if (entropy > 5.5) continue;

            const preview = text.slice(0, 100);
            const recipe = [{ op: cribOp.op, args }];

            // Deduplicate by recipe op name (keep lowest entropy)
            const existing = suggestions.find(
              (s) => s.recipe[0]?.op === cribOp.op && JSON.stringify(s.recipe[0]?.args) === JSON.stringify(args),
            );
            if (existing) {
              if (entropy < existing.entropy) {
                existing.entropy = entropy;
                existing.preview = preview;
              }
              continue;
            }

            suggestions.push({ recipe, preview, entropy });
          } catch {
            // Operation failed — skip silently
          }
        }
      }

      if (abortedIds.has(executionId)) break;

      if (suggestions.length > 0) {
        suggestions.sort((a, b) => a.entropy - b.entropy);
        const top = suggestions.slice(0, 8);

        post({
          type: 'crib-result',
          executionId,
          nodeId: leaf.nodeId,
          suggestions: top,
        });
      }
    } catch {
      // Silently skip nodes whose output can't be analysed
    }
  }

  abortedIds.delete(executionId);
}

/* ------------------------------------------------------------------ */
/*  Message dispatcher                                                 */
/* ------------------------------------------------------------------ */

self.onmessage = (e: MessageEvent<MainToWorkerMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case 'execute':
      enqueue(() => handleExecute(msg));
      break;

    case 'abort':
      abortedIds.add(msg.executionId);
      break;

    case 'magic-analyze':
      enqueue(() => handleMagicAnalyze(msg));
      break;

    case 'crib-analyze':
      enqueue(() => handleCribAnalyze(msg));
      break;

    case 'sync-cribs':
      setClueCache(msg.secrets);
      break;

    case 'sync-backend-settings':
      BackendClient.configure(msg.url, msg.enabled);
      break;

    case 'terminal-resize':
      BackendClient.resizeTerminal(msg.cols, msg.rows);
      break;

    case 'list-dir':
      BackendClient.listDir(msg.path)
        .then((result) => {
          post({
            type: 'list-dir-result',
            requestId: msg.requestId,
            folders: result.folders,
            files: result.files,
          });
        })
        .catch((err) => {
          post({
            type: 'list-dir-result',
            requestId: msg.requestId,
            folders: [],
            files: [],
            error: err?.message ?? String(err),
          });
        });
      break;

    case 'search-wordlists':
      BackendClient.searchWordlists(msg.query)
        .then((results) => {
          post({
            type: 'search-wordlists-result',
            requestId: msg.requestId,
            results,
          });
        })
        .catch((err) => {
          post({
            type: 'search-wordlists-result',
            requestId: msg.requestId,
            results: [],
            error: err?.message ?? String(err),
          });
        });
      break;
  }
};

// Wire backend status updates → main thread
BackendClient.setStatusCallback((status, error, tools, wordlistRoot) => {
  post({ type: 'backend-status', status, error, tools, wordlistRoot } as any);
});

// Signal readiness
post({ type: 'ready' });
