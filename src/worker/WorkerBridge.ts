/**
 * Main-thread singleton that manages the graph execution Web Worker.
 *
 * Provides a clean callback-based API so `useGraphExecution` never
 * touches `postMessage` / `onmessage` directly.
 */

import type {
  SerializedGraphNode,
  SerializedGraphEdge,
  SerializedNodeResult,
  MagicLeafInput,
  WorkerToMainMessage,
} from './protocol';
import type { MagicHint, MagicHintSuggestion } from '@/engine/MagicEngine';

/* ------------------------------------------------------------------ */
/*  Callback types                                                     */
/* ------------------------------------------------------------------ */

export interface ExecuteCallbacks {
  onProgress: (nodeId: string, result: SerializedNodeResult) => void;
  /** All individual results were already delivered via onProgress. */
  onComplete: () => void;
  onCycleError: (nodeIds: string[]) => void;
  onError: (message: string) => void;
}

export interface MagicCallbacks {
  onHint: (nodeId: string, hint: MagicHint) => void;
}

export interface CribCallbacks {
  onSuggestions: (nodeId: string, suggestions: MagicHintSuggestion[]) => void;
}

export type BackendStatusCallback = (
  status: 'disconnected' | 'connecting' | 'connected' | 'error',
  error?: string,
  tools?: { name: string; description?: string }[],
  wordlistRoot?: string,
) => void;

/* ------------------------------------------------------------------ */
/*  WorkerBridge                                                       */
/* ------------------------------------------------------------------ */

export class WorkerBridge {
  private worker: Worker;
  private nextId = 1;

  /** Maps executionId → callbacks for pending execute calls. */
  private executeCbs = new Map<number, ExecuteCallbacks>();

  /** Maps executionId → callbacks for pending magic calls. */
  private magicCbs = new Map<number, MagicCallbacks>();

  /** Maps executionId → callbacks for pending crib calls. */
  private cribCbs = new Map<number, CribCallbacks>();

  /** Maps requestId → resolve/reject for pending listDir calls. */
  private listDirCbs = new Map<string, {
    resolve: (result: { folders: string[]; files: { name: string; size: number }[] }) => void;
    reject: (error: Error) => void;
  }>();

  /** Maps requestId → resolve/reject for pending searchWordlists calls. */
  private searchCbs = new Map<string, {
    resolve: (results: { relPath: string; name: string; size: number }[]) => void;
    reject: (error: Error) => void;
  }>();

  /** The currently active execution id (auto-aborted on next execute). */
  private activeExecutionId: number | null = null;

  /** The currently active magic analysis id. */
  private activeMagicId: number | null = null;

  /** The currently active crib analysis id. */
  private activeCribId: number | null = null;

  /** Callback for backend status updates from the worker. */
  private backendStatusCb: BackendStatusCallback | null = null;

  /** Callback for deferred node updates (backend ops completing after execution). */
  private nodeUpdateCb: ((nodeId: string, result: SerializedNodeResult) => void) | null = null;

  constructor() {
    this.worker = new Worker(
      new URL('./graphWorker.ts', import.meta.url),
      { type: 'module' },
    );

    this.worker.onmessage = (e: MessageEvent<WorkerToMainMessage>) => {
      this.handleMessage(e.data);
    };

    this.worker.onerror = (e) => {
      console.error('[WorkerBridge] Worker error:', e);
    };
  }

  /* ---------------------------------------------------------------- */
  /*  Public API                                                       */
  /* ---------------------------------------------------------------- */

  /**
   * Execute the graph. Automatically aborts any in-flight execution.
   *
   * ArrayBuffers in node data are cloned before transfer so React
   * state retains valid references.
   */
  executeGraph(
    nodes: SerializedGraphNode[],
    edges: SerializedGraphEdge[],
    callbacks: ExecuteCallbacks,
    options?: {
      changedNodeId?: string;
      existingResults?: [string, SerializedNodeResult][];
      forceNodeIds?: string[];
    },
  ): number {
    // Abort previous execution and any in-flight magic/crib analysis
    // so the worker isn't running two async pipelines concurrently.
    if (this.activeExecutionId !== null) {
      this.abort(this.activeExecutionId);
    }
    if (this.activeMagicId !== null) {
      this.abort(this.activeMagicId);
    }
    if (this.activeCribId !== null) {
      this.abort(this.activeCribId);
    }

    const id = this.nextId++;
    this.activeExecutionId = id;
    this.executeCbs.set(id, callbacks);

    // Clone ArrayBuffers in node data so main-thread state isn't detached.
    const clonedNodes = nodes.map((n) => cloneNodeData(n));

    // Clone ArrayBuffers in existing results
    let existingResults = options?.existingResults;
    if (existingResults) {
      existingResults = existingResults.map(([nid, r]) => [
        nid,
        cloneResultBuffers(r),
      ]);
    }

    this.worker.postMessage({
      type: 'execute',
      executionId: id,
      nodes: clonedNodes,
      edges,
      changedNodeId: options?.changedNodeId,
      existingResults,
      forceNodeIds: options?.forceNodeIds,
    });

    return id;
  }

  /**
   * Run magic analysis on leaf node outputs.
   * Automatically aborts any in-flight magic analysis.
   */
  analyzeMagic(leaves: MagicLeafInput[], callbacks: MagicCallbacks): number {
    // Abort previous magic
    if (this.activeMagicId !== null) {
      this.abort(this.activeMagicId);
    }

    const id = this.nextId++;
    this.activeMagicId = id;
    this.magicCbs.set(id, callbacks);

    // Clone ArrayBuffers in leaf DishData
    const clonedLeaves = leaves.map((l) => ({
      nodeId: l.nodeId,
      dishData: {
        ...l.dishData,
        value:
          l.dishData.value instanceof ArrayBuffer
            ? l.dishData.value.slice(0)
            : l.dishData.value,
      },
    }));

    this.worker.postMessage({
      type: 'magic-analyze',
      executionId: id,
      leaves: clonedLeaves,
    });

    return id;
  }

  /**
   * Run crib analysis on leaf node outputs with known secrets.
   * Automatically aborts any in-flight crib analysis.
   */
  analyzeCribs(
    leaves: MagicLeafInput[],
    secrets: string[],
    callbacks: CribCallbacks,
  ): number {
    // Abort previous crib analysis
    if (this.activeCribId !== null) {
      this.abort(this.activeCribId);
    }

    const id = this.nextId++;
    this.activeCribId = id;
    this.cribCbs.set(id, callbacks);

    // Clone ArrayBuffers in leaf DishData
    const clonedLeaves = leaves.map((l) => ({
      nodeId: l.nodeId,
      dishData: {
        ...l.dishData,
        value:
          l.dishData.value instanceof ArrayBuffer
            ? l.dishData.value.slice(0)
            : l.dishData.value,
      },
    }));

    this.worker.postMessage({
      type: 'crib-analyze',
      executionId: id,
      leaves: clonedLeaves,
      secrets,
    });

    return id;
  }

  /**
   * Sync crib/secret values to the worker so operations like
   * Cipher Identifier can access them during graph execution.
   */
  syncCribs(secrets: string[]) {
    this.worker.postMessage({ type: 'sync-cribs', secrets });
  }

  /** Sync backend settings (url, enabled) to the worker. */
  syncBackendSettings(url: string, enabled: boolean) {
    this.worker.postMessage({ type: 'sync-backend-settings', url, enabled });
  }

  /** Send terminal size to the backend so PTYs match the xterm.js display. */
  resizeBackendTerminal(cols: number, rows: number) {
    this.worker.postMessage({ type: 'terminal-resize', cols, rows });
  }

  /** List files/folders in a directory on the backend's wordlist root. */
  listDir(relativePath: string): Promise<{ folders: string[]; files: { name: string; size: number }[] }> {
    return new Promise((resolve, reject) => {
      const requestId = String(this.nextId++);
      this.listDirCbs.set(requestId, { resolve, reject });
      this.worker.postMessage({ type: 'list-dir', requestId, path: relativePath });
    });
  }

  /** Search wordlists recursively by filename across all subdirectories. */
  searchWordlists(query: string): Promise<{ relPath: string; name: string; size: number }[]> {
    return new Promise((resolve, reject) => {
      const requestId = String(this.nextId++);
      this.searchCbs.set(requestId, { resolve, reject });
      this.worker.postMessage({ type: 'search-wordlists', requestId, query });
    });
  }

  /** Register a callback for backend status updates from the worker. */
  onBackendStatus(cb: BackendStatusCallback) {
    this.backendStatusCb = cb;
  }

  /** Register a callback for deferred node updates (backend ops). */
  onNodeUpdate(cb: (nodeId: string, result: SerializedNodeResult) => void) {
    this.nodeUpdateCb = cb;
  }

  /** Abort an execution, magic, or crib analysis by id. */
  abort(id: number) {
    this.executeCbs.delete(id);
    this.magicCbs.delete(id);
    this.cribCbs.delete(id);
    if (this.activeExecutionId === id) this.activeExecutionId = null;
    if (this.activeMagicId === id) this.activeMagicId = null;
    if (this.activeCribId === id) this.activeCribId = null;
    this.worker.postMessage({ type: 'abort', executionId: id });
  }

  /** Terminate the worker entirely. */
  destroy() {
    this.worker.terminate();
    this.executeCbs.clear();
    this.magicCbs.clear();
    this.cribCbs.clear();
  }

  /* ---------------------------------------------------------------- */
  /*  Message handler                                                  */
  /* ---------------------------------------------------------------- */

  private handleMessage(msg: WorkerToMainMessage) {
    switch (msg.type) {
      case 'ready':
        // Worker modules loaded — nothing to do.
        break;

      case 'progress': {
        const cbs = this.executeCbs.get(msg.executionId);
        cbs?.onProgress(msg.nodeId, msg.result);
        break;
      }

      case 'complete': {
        const cbs = this.executeCbs.get(msg.executionId);
        this.executeCbs.delete(msg.executionId);
        if (this.activeExecutionId === msg.executionId) {
          this.activeExecutionId = null;
        }
        cbs?.onComplete();
        break;
      }

      case 'cycle-error': {
        const cbs = this.executeCbs.get(msg.executionId);
        this.executeCbs.delete(msg.executionId);
        if (this.activeExecutionId === msg.executionId) {
          this.activeExecutionId = null;
        }
        cbs?.onCycleError(msg.nodeIds);
        break;
      }

      case 'error': {
        const cbs = this.executeCbs.get(msg.executionId);
        this.executeCbs.delete(msg.executionId);
        if (this.activeExecutionId === msg.executionId) {
          this.activeExecutionId = null;
        }
        cbs?.onError(msg.message);
        break;
      }

      case 'magic-result': {
        const cbs = this.magicCbs.get(msg.executionId);
        cbs?.onHint(msg.nodeId, msg.hint);
        break;
      }

      case 'crib-result': {
        const cbs = this.cribCbs.get(msg.executionId);
        cbs?.onSuggestions(msg.nodeId, msg.suggestions);
        break;
      }

      case 'backend-status': {
        this.backendStatusCb?.(msg.status, msg.error, msg.tools, msg.wordlistRoot);
        break;
      }

      case 'node-update': {
        this.nodeUpdateCb?.(msg.nodeId, msg.result);
        break;
      }

      case 'list-dir-result': {
        const cbs = this.listDirCbs.get(msg.requestId);
        if (cbs) {
          this.listDirCbs.delete(msg.requestId);
          if (msg.error) {
            cbs.reject(new Error(msg.error));
          } else {
            cbs.resolve({ folders: msg.folders, files: msg.files });
          }
        }
        break;
      }

      case 'search-wordlists-result': {
        const cbs = this.searchCbs.get(msg.requestId);
        if (cbs) {
          this.searchCbs.delete(msg.requestId);
          if (msg.error) {
            cbs.reject(new Error(msg.error));
          } else {
            cbs.resolve(msg.results);
          }
        }
        break;
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Singleton                                                          */
/* ------------------------------------------------------------------ */

let instance: WorkerBridge | null = null;

export function getWorkerBridge(): WorkerBridge {
  if (!instance) {
    instance = new WorkerBridge();
  }
  return instance;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Deep-clone any ArrayBuffers lurking in a node's data so they survive transfer. */
function cloneNodeData(n: SerializedGraphNode): SerializedGraphNode {
  const data = { ...n.data };

  // Input nodes may have inputRaw: ArrayBuffer
  if (data.inputRaw instanceof ArrayBuffer) {
    data.inputRaw = (data.inputRaw as ArrayBuffer).slice(0);
  }

  return { ...n, data };
}

/** Clone ArrayBuffer in a result's output so it survives transfer. */
function cloneResultBuffers(r: SerializedNodeResult): SerializedNodeResult {
  if (r.output && r.output.value instanceof ArrayBuffer) {
    return {
      ...r,
      output: { ...r.output, value: r.output.value.slice(0) },
    };
  }
  return r;
}
