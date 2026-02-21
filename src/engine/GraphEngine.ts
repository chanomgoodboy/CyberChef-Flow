import Dish from '@cyberchef/Dish.mjs';
import { dishFromTransferable, dishToTransferable, dishToString, dishToImageDataUrl } from '../adapter/DishBridge';
import { OperationAdapter } from '../adapter/OperationAdapter';
import { resolveArgDefault } from '@/utils/argDefaults';
import { getMeta } from '@/adapter/OperationRegistry';
import type { DishData } from '../adapter/types';
import type {
  GraphNode,
  GraphEdge,
  NodeResult,
  ExecutionLevel,
  CycleError,
} from './types';
import { topologicalSort } from './TopologicalSort';
import { executeNode } from './NodeExecutor';

/**
 * Callback invoked as each node completes execution so the UI can
 * update incrementally.
 */
export type ProgressCallback = (nodeId: string, result: NodeResult) => void;

/**
 * Callback for deferred backend operation results that complete after
 * the main execution finishes.
 */
export type DeferredResultCallback = (nodeId: string, result: NodeResult) => void;

/**
 * Options for `execute()`.
 */
export interface ExecuteOptions {
  /**
   * If set, only re-execute this node and everything downstream of it.
   * All upstream results are assumed to be in `existingResults`.
   */
  changedNodeId?: string;

  /**
   * Previously computed results keyed by node id.  Used together with
   * `changedNodeId` for incremental execution.
   */
  existingResults?: Map<string, NodeResult>;

  /**
   * When set, backend operations (module === 'Backend') are fired off
   * without blocking the execution pipeline. Results are delivered via
   * this callback when they arrive.
   */
  onDeferredResult?: DeferredResultCallback;

  /**
   * Node IDs that should execute even if they are normally manual-only
   * (e.g. password crackers). Used by the "Run" button on individual nodes.
   */
  forceNodeIds?: Set<string>;
}

import { MANUAL_BACKEND_OPS } from './manualOps';
export { MANUAL_BACKEND_OPS };

/**
 * Core graph execution orchestrator.
 *
 * 1. Topologically sort the graph (Kahn's algorithm).
 * 2. Walk levels in order; within each level execute nodes in parallel.
 * 3. Collect the upstream Dish for each node by inspecting incoming edges.
 * 4. Delegate actual node execution to `NodeExecutor.executeNode`.
 *
 * Registers are session-wide: any Register node populates the shared
 * register array, and any downstream node can reference $Rn in its args.
 *
 * @param nodes       React Flow nodes.
 * @param edges       React Flow edges.
 * @param onProgress  Optional callback fired after each node finishes.
 * @param options     Optional incremental-execution settings.
 * @returns           A Map from node id to its NodeResult, or a CycleError.
 */
export async function execute(
  nodes: GraphNode[],
  edges: GraphEdge[],
  onProgress?: ProgressCallback,
  options?: ExecuteOptions,
): Promise<Map<string, NodeResult> | CycleError> {
  // ------------------------------------------------------------------
  // 1. Topological sort
  // ------------------------------------------------------------------
  const sorted = topologicalSort(nodes, edges);

  if ('type' in sorted && sorted.type === 'cycle') {
    return sorted as CycleError;
  }

  const levels = sorted as ExecutionLevel[];

  // ------------------------------------------------------------------
  // 2. Build helper look-ups
  // ------------------------------------------------------------------
  const nodeMap = new Map<string, GraphNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Incoming edges per target node.
  const incomingEdges = new Map<string, GraphEdge[]>();
  // Outgoing edges per source node.
  const outgoingEdges = new Map<string, GraphEdge[]>();
  for (const edge of edges) {
    const inList = incomingEdges.get(edge.target) ?? [];
    inList.push(edge);
    incomingEdges.set(edge.target, inList);

    const outList = outgoingEdges.get(edge.source) ?? [];
    outList.push(edge);
    outgoingEdges.set(edge.source, outList);
  }

  // ------------------------------------------------------------------
  // 3. Determine which nodes need (re-)execution
  // ------------------------------------------------------------------
  const results = new Map<string, NodeResult>(
    options?.existingResults ?? [],
  );

  let needsExecution: Set<string>;

  if (options?.changedNodeId) {
    // Incremental mode: re-execute the changed node and all its
    // downstream dependants.
    needsExecution = collectDownstream(
      options.changedNodeId,
      nodes,
      edges,
    );
    // Always include Register nodes so $Rn references resolve
    // even when the changed node is downstream of a Register.
    for (const n of nodes) {
      if (n.type === 'operation' && n.data?.operationName === 'Register') {
        needsExecution.add(n.id);
      }
    }
    // If any node in needsExecution is inside a Fork's downstream chain,
    // the Fork must also re-execute so per-piece processing works correctly.
    // Without this, the chain node receives the Fork's merged output
    // instead of individual forked pieces.
    for (const n of nodes) {
      if (
        n.type === 'operation' &&
        n.data?.operationName === 'Fork' &&
        !needsExecution.has(n.id)
      ) {
        const { chain, mergeNode } = collectDownstreamChain(
          n.id, nodeMap, outgoingEdges,
        );
        const chainHasChanged = chain.some((c) => needsExecution.has(c.id)) ||
          (mergeNode != null && needsExecution.has(mergeNode.id));
        if (chainHasChanged) {
          needsExecution.add(n.id);
        }
      }
    }
  } else {
    // Full execution: run everything.
    needsExecution = new Set(nodes.map((n) => n.id));
  }

  // Nodes already executed as part of a Fork — skip in main loop.
  const forkHandled = new Set<string>();

  // ------------------------------------------------------------------
  // Session-wide registers: populated by Register nodes, consumed by
  // any downstream operation via $Rn references in args.
  // ------------------------------------------------------------------
  const registers: string[] = [];

  // ------------------------------------------------------------------
  // 4. Execute level by level
  //
  // Within each level, Register nodes run first (sequentially) so that
  // their captured values are available to all other nodes in the same
  // level. Non-register nodes then run in parallel.
  // ------------------------------------------------------------------
  for (const level of levels) {
    // Partition into register nodes and other nodes
    const registerIds: string[] = [];
    const otherIds: string[] = [];

    for (const nodeId of level.nodeIds) {
      if (!needsExecution.has(nodeId)) continue;
      if (forkHandled.has(nodeId)) continue;
      const node = nodeMap.get(nodeId);
      if (!node) continue;

      if (node.type === 'operation' && node.data?.operationName === 'Register') {
        registerIds.push(nodeId);
      } else {
        otherIds.push(nodeId);
      }
    }

    // Phase 1: Execute all Register nodes first (sequentially)
    for (const nodeId of registerIds) {
      const node = nodeMap.get(nodeId)!;
      markRunning(nodeId, results, onProgress);
      await handleRegister(node, incomingEdges, results, registers, onProgress);
    }

    // Phase 2: Execute everything else (in parallel)
    const promises: Promise<void>[] = [];

    for (const nodeId of otherIds) {
      const node = nodeMap.get(nodeId)!;
      markRunning(nodeId, results, onProgress);

      promises.push(
        (async () => {
          // Fork operation
          if (
            node.type === 'operation' &&
            node.data?.operationName === 'Fork'
          ) {
            await handleFork(
              node,
              nodeMap,
              outgoingEdges,
              incomingEdges,
              results,
              forkHandled,
              registers,
              onProgress,
            );
            return;
          }

          // Merge without a Fork — pass input through unchanged
          if (
            node.type === 'operation' &&
            node.data?.operationName === 'Merge'
          ) {
            const upDish = resolveUpstreamDish(nodeId, incomingEdges, results);
            const passStr = upDish ? await Promise.resolve(upDish.get(Dish.STRING)) : '';
            const passDish = new Dish(passStr, Dish.STRING);
            const passData = await dishToTransferable(passDish);
            const r: NodeResult = {
              nodeId,
              output: passData,
              displayValue: passStr,
              duration: 0,
              status: 'success',
            };
            results.set(nodeId, r);
            onProgress?.(nodeId, r);
            return;
          }

          // Backend operations — fire-and-forget when onDeferredResult is set
          if (
            options?.onDeferredResult &&
            node.type === 'operation' &&
            node.data?.operationName
          ) {
            const meta = getMeta(node.data.operationName as string);
            if (meta?.module === 'Backend') {
              const opName = node.data.operationName as string;

              // Manual-only ops (crackers/bruteforce) — skip unless force-triggered
              if (
                MANUAL_BACKEND_OPS.has(opName) &&
                !options.forceNodeIds?.has(nodeId)
              ) {
                const readyResult: NodeResult = {
                  nodeId,
                  output: null,
                  displayValue: '\u25B6 Ready \u2014 click to run',
                  isTerminal: true,
                  duration: 0,
                  status: 'idle',
                };
                results.set(nodeId, readyResult);
                onProgress?.(nodeId, readyResult);
                return;
              }

              const upDish = resolveUpstreamDish(nodeId, incomingEdges, results);
              // Show "loading" status immediately — don't block the level
              const loadingResult: NodeResult = {
                nodeId,
                output: null,
                displayValue: 'Waiting for backend...',
                isTerminal: true,
                duration: 0,
                status: 'running',
              };
              results.set(nodeId, loadingResult);
              onProgress?.(nodeId, loadingResult);
              // Fire the actual execution in the background
              const deferredCb = options.onDeferredResult;
              // Stream callback — sends incremental stdout updates as the
              // command runs, so the user sees output in real-time.
              const streamCb = (accumulated: string) => {
                deferredCb(nodeId, {
                  nodeId,
                  output: null,
                  displayValue: accumulated,
                  isTerminal: true,
                  duration: 0,
                  status: 'running',
                });
              };
              executeNode(node, upDish, streamCb).then(
                (r) => deferredCb(nodeId, { ...r, isTerminal: true }),
                (err) => deferredCb(nodeId, {
                  nodeId,
                  output: null,
                  displayValue: '',
                  isTerminal: true,
                  duration: 0,
                  error: err?.message ?? String(err),
                  status: 'error',
                }),
              );
              return;
            }
          }

          // Normal execution path — resolve $Rn in args if registers exist
          if (registers.length > 0 && node.type === 'operation') {
            await executeWithRegisters(node, incomingEdges, results, registers, onProgress);
            return;
          }

          const upstreamDish = resolveUpstreamDish(nodeId, incomingEdges, results);
          const result = await executeNode(node, upstreamDish);
          results.set(nodeId, result);
          onProgress?.(nodeId, result);
        })(),
      );
    }

    // Await the entire level before proceeding to the next.
    await Promise.all(promises);
  }

  return results;
}

// ====================================================================
// Helpers
// ====================================================================

function markRunning(
  nodeId: string,
  results: Map<string, NodeResult>,
  onProgress?: ProgressCallback,
): void {
  const r: NodeResult = { nodeId, output: null, displayValue: '', duration: 0, status: 'running' };
  results.set(nodeId, r);
  onProgress?.(nodeId, r);
}

// ====================================================================
// Register handling
// ====================================================================

/**
 * Handle a Register operation node:
 * 1. Extract regex capture groups from input.
 * 2. Append them to the session-wide registers array.
 * 3. Pass input through unchanged.
 */
async function handleRegister(
  regNode: GraphNode,
  incomingEdges: Map<string, GraphEdge[]>,
  results: Map<string, NodeResult>,
  registers: string[],
  onProgress?: ProgressCallback,
): Promise<void> {
  const start = performance.now();
  const regId = regNode.id;

  try {
    // Get upstream input
    const upstreamDish = resolveUpstreamDish(regId, incomingEdges, results);
    if (!upstreamDish) {
      throw new Error('Register has no upstream input.');
    }

    const input: string = await Promise.resolve(upstreamDish.get(Dish.STRING));

    // Parse Register args
    const argsRecord = (regNode.data?.args as Record<string, any>) ?? {};
    const argValues = Object.values(argsRecord);
    const meta = getMeta('Register');
    const resolvedArgs = (meta?.args ?? []).map((arg, i) => {
      if (i < argValues.length && argValues[i] !== undefined && argValues[i] !== null) {
        return argValues[i];
      }
      return resolveArgDefault(arg);
    });

    const extractorStr = resolvedArgs[0] ?? '([\\s\\S]*)';
    const caseInsensitive = resolvedArgs[1] ?? true;
    const multiline = resolvedArgs[2] ?? false;
    const dotAll = resolvedArgs[3] ?? false;

    let flags = '';
    if (caseInsensitive) flags += 'i';
    if (multiline) flags += 'm';
    if (dotAll) flags += 's';

    const extractor = new RegExp(extractorStr, flags);
    const match = input.match(extractor);
    const captured = match ? match.slice(1) : [];

    // Track where these registers start in the global array
    const startIndex = registers.length;

    // Append to session-wide registers
    for (const val of captured) {
      registers.push(val ?? '');
    }

    // Pass input through unchanged
    const outputData = await dishToTransferable(upstreamDish);
    const regDisplay = captured.length > 0
      ? captured.map((r, i) => `$R${startIndex + i}=${r}`).join(', ')
      : 'No matches';

    const result: NodeResult = {
      nodeId: regId,
      output: outputData,
      displayValue: regDisplay,
      duration: performance.now() - start,
      status: 'success',
    };
    results.set(regId, result);
    onProgress?.(regId, result);
  } catch (err: any) {
    const errorResult: NodeResult = {
      nodeId: regId,
      output: null,
      displayValue: '',
      duration: performance.now() - start,
      error: err?.message ?? String(err),
      status: 'error',
    };
    results.set(regId, errorResult);
    onProgress?.(regId, errorResult);
  }
}

// ====================================================================
// Execute operation with register substitution
// ====================================================================

/**
 * Execute an operation node, resolving $Rn references in its args
 * against the session-wide registers without mutating the original node.
 */
async function executeWithRegisters(
  node: GraphNode,
  incomingEdges: Map<string, GraphEdge[]>,
  results: Map<string, NodeResult>,
  registers: string[],
  onProgress?: ProgressCallback,
): Promise<void> {
  const start = performance.now();
  const nodeId = node.id;

  try {
    const opName = node.data?.operationName as string;
    if (!opName) throw new Error('Operation node is missing operationName.');

    const upstreamDish = resolveUpstreamDish(nodeId, incomingEdges, results);
    if (!upstreamDish) throw new Error(`Operation "${opName}" has no upstream input.`);

    const adapter = await OperationAdapter.create(opName);

    // Resolve args with register substitution (no mutation of original)
    const argsRecord = (node.data?.args as Record<string, any>) ?? {};
    const argValues = Object.values(argsRecord).map((val) => applyRegisters(val, registers));
    const outputDish = await adapter.execute(upstreamDish, argValues);
    const dataUrl = await dishToImageDataUrl(outputDish);
    const displayValue = dataUrl ? '' : await dishToString(outputDish);
    const outputData = await dishToTransferable(outputDish);
    const isHtml = outputDish.type === Dish.HTML;

    const result: NodeResult = {
      nodeId,
      output: outputData,
      displayValue,
      dataUrl: dataUrl ?? undefined,
      isHtml: isHtml || undefined,
      duration: performance.now() - start,
      status: 'success',
    };
    results.set(nodeId, result);
    onProgress?.(nodeId, result);
  } catch (err: any) {
    const result: NodeResult = {
      nodeId,
      output: null,
      displayValue: '',
      duration: performance.now() - start,
      error: err?.message ?? String(err),
      status: 'error',
    };
    results.set(nodeId, result);
    onProgress?.(nodeId, result);
  }
}

/**
 * Apply register substitution to an arg value.
 * Handles strings, toggleString objects ({string, option}), and passes
 * other types through unchanged.
 */
function applyRegisters(val: any, registers: string[]): any {
  if (typeof val === 'string') {
    return replaceRegisters(val, registers);
  }
  if (typeof val === 'object' && val !== null && 'string' in val) {
    return { ...val, string: replaceRegisters(val.string, registers) };
  }
  return val;
}

/**
 * Replace $Rn references in a string with register values.
 */
function replaceRegisters(str: string, registers: string[]): string {
  return str.replace(/(\\*)\$R(\d{1,2})/g, (match, slashes, regNum) => {
    const index = parseInt(regNum, 10);
    if (index >= registers.length) return match;
    // Odd number of backslashes = escaped $R reference
    if (slashes.length % 2 !== 0) return match.slice(1);
    return slashes + registers[index];
  });
}

// ====================================================================
// Fork handling
// ====================================================================

/**
 * Execute a subchain of operation nodes, handling nested Fork nodes
 * recursively. When a Fork is encountered, the current dish is split,
 * the remaining chain is executed per-piece, and results are merged.
 */
async function executeSubChain(
  chain: GraphNode[],
  startIndex: number,
  inputDish: InstanceType<typeof Dish>,
  registers: string[],
  ignoreErrors: boolean,
  perNodeOutputs?: Map<string, string[]>,
): Promise<InstanceType<typeof Dish>> {
  let currentDish = inputDish;

  for (let i = startIndex; i < chain.length; i++) {
    const node = chain[i];
    const opName = node.data?.operationName as string;
    if (!opName) continue;

    if (opName === 'Fork') {
      // Nested fork: parse its delimiters, split, recurse, merge
      const forkArgs = (node.data?.args as Record<string, any>) ?? {};
      const forkArgValues = Object.values(forkArgs);
      const forkMeta = getMeta('Fork');
      const resolved = (forkMeta?.args ?? []).map((arg, idx) => {
        if (idx < forkArgValues.length && forkArgValues[idx] !== undefined && forkArgValues[idx] !== null) {
          return forkArgValues[idx];
        }
        return resolveArgDefault(arg);
      });
      const nestedSplit = parseEscapes(resolved[0] ?? '\\n');
      const nestedMerge = parseEscapes(resolved[1] ?? '\\n');

      const str: string = await Promise.resolve(currentDish.get(Dish.STRING));
      const subPieces = str.split(nestedSplit);
      const subOutputs: string[] = [];

      for (const sub of subPieces) {
        const subDish = new Dish(sub, Dish.STRING);
        const subResult = await executeSubChain(
          chain, i + 1, subDish, registers, ignoreErrors, perNodeOutputs,
        );
        subOutputs.push(await Promise.resolve(subResult.get(Dish.STRING)));
      }

      const merged = subOutputs.join(nestedMerge);
      currentDish = new Dish(merged, Dish.STRING);

      // Capture this fork node's output
      if (perNodeOutputs?.has(node.id)) {
        perNodeOutputs.get(node.id)!.push(merged);
      }

      // Remaining chain was already executed recursively — we're done
      return currentDish;
    }

    // Regular operation
    try {
      const adapter = await OperationAdapter.create(opName);
      const nodeArgs = (node.data?.args as Record<string, any>) ?? {};
      const resolvedArgValues = Object.values(nodeArgs).map(
        (v) => applyRegisters(v, registers),
      );
      currentDish = await adapter.execute(currentDish, resolvedArgValues);
    } catch (err: any) {
      if (!ignoreErrors) throw err;
    }

    // Capture this node's output for this piece
    if (perNodeOutputs?.has(node.id)) {
      const nodeOut: string = await Promise.resolve(currentDish.get(Dish.STRING));
      perNodeOutputs.get(node.id)!.push(nodeOut);
    }
  }

  return currentDish;
}

/**
 * Handle a Fork operation node:
 * 1. Split upstream input by split delimiter.
 * 2. Collect the downstream chain (Fork → ... → leaf).
 * 3. Execute the chain once per split piece.
 * 4. Merge final outputs with merge delimiter.
 */
async function handleFork(
  forkNode: GraphNode,
  nodeMap: Map<string, GraphNode>,
  outgoingEdges: Map<string, GraphEdge[]>,
  incomingEdges: Map<string, GraphEdge[]>,
  results: Map<string, NodeResult>,
  forkHandled: Set<string>,
  registers: string[],
  onProgress?: ProgressCallback,
): Promise<void> {
  const start = performance.now();
  const forkId = forkNode.id;

  try {
    // Get upstream input
    const upstreamDish = resolveUpstreamDish(forkId, incomingEdges, results);
    if (!upstreamDish) {
      throw new Error('Fork has no upstream input.');
    }

    const inputStr: string = await Promise.resolve(upstreamDish.get(Dish.STRING));

    // Parse Fork args
    const argsRecord = (forkNode.data?.args as Record<string, any>) ?? {};
    const argValues = Object.values(argsRecord);
    const meta = getMeta('Fork');
    const resolvedArgs = (meta?.args ?? []).map((arg, i) => {
      if (i < argValues.length && argValues[i] !== undefined && argValues[i] !== null) {
        return argValues[i];
      }
      return resolveArgDefault(arg);
    });

    const splitDelim = resolvedArgs[0] ?? '\\n';
    const mergeDelim = resolvedArgs[1] ?? '\\n';
    const ignoreErrors = resolvedArgs[2] ?? false;

    // Parse escape sequences in delimiters
    const parsedSplit = parseEscapes(splitDelim);
    const parsedMerge = parseEscapes(mergeDelim);

    const pieces = inputStr.split(parsedSplit);

    // Collect downstream chain (linear path from Fork), stopping at Merge
    const { chain, mergeNode } = collectDownstreamChain(forkId, nodeMap, outgoingEdges);

    // Mark all chain nodes (and Merge if present) as fork-handled
    for (const chainNode of chain) {
      forkHandled.add(chainNode.id);
    }
    if (mergeNode) {
      forkHandled.add(mergeNode.id);
    }

    // Mark Fork as running
    const forkRunning: NodeResult = {
      nodeId: forkId,
      output: null,
      displayValue: `Forking ${pieces.length} pieces...`,
      duration: 0,
      status: 'running',
    };
    results.set(forkId, forkRunning);
    onProgress?.(forkId, forkRunning);

    // Mark chain nodes (and Merge) as running
    for (const chainNode of chain) {
      markRunning(chainNode.id, results, onProgress);
    }
    if (mergeNode) {
      markRunning(mergeNode.id, results, onProgress);
    }

    // perNodeOutputs[nodeId] = array of output strings, one per piece
    const perNodeOutputs = new Map<string, string[]>();
    for (const cn of chain) {
      perNodeOutputs.set(cn.id, []);
    }

    // Execute chain for each piece using the recursive subchain executor
    const finalOutputs: string[] = [];

    for (const piece of pieces) {
      const pieceDish = new Dish(piece, Dish.STRING);
      const resultDish = await executeSubChain(
        chain, 0, pieceDish, registers, ignoreErrors, perNodeOutputs,
      );
      const outputStr: string = await Promise.resolve(resultDish.get(Dish.STRING));
      finalOutputs.push(outputStr);
    }

    // Merge results
    const merged = finalOutputs.join(parsedMerge);
    const mergedDish = new Dish(merged, Dish.STRING);
    const mergedData = await dishToTransferable(mergedDish);
    const totalDuration = performance.now() - start;

    // Set Fork result — show merged output (as if Merge) + per-piece results
    const forkDataUrl = await dishToImageDataUrl(mergedDish);
    const forkResult: NodeResult = {
      nodeId: forkId,
      output: mergedData,
      displayValue: forkDataUrl ? '' : merged,
      dataUrl: forkDataUrl ?? undefined,
      forkResults: finalOutputs,
      duration: totalDuration,
      status: 'success',
    };
    results.set(forkId, forkResult);
    onProgress?.(forkId, forkResult);

    // Determine the "output" node — Merge if present, otherwise the last chain node
    const outputNode = mergeNode ?? (chain.length > 0 ? chain[chain.length - 1] : null);

    if (outputNode) {
      const dataUrl = await dishToImageDataUrl(mergedDish);
      const displayValue = dataUrl ? '' : merged;
      const outputResult: NodeResult = {
        nodeId: outputNode.id,
        output: mergedData,
        displayValue,
        dataUrl: dataUrl ?? undefined,
        forkResults: finalOutputs,
        duration: totalDuration,
        status: 'success',
      };
      results.set(outputNode.id, outputResult);
      onProgress?.(outputNode.id, outputResult);
    }

    // Set each chain node's result with its own per-piece outputs
    for (let i = 0; i < chain.length; i++) {
      const cn = chain[i];
      // Skip the last chain node when no Merge — already set as outputNode above
      if (!mergeNode && i === chain.length - 1) continue;

      const nodePieces = perNodeOutputs.get(cn.id) ?? finalOutputs;
      const nodeMerged = nodePieces.join(parsedMerge);
      const nodeDish = new Dish(nodeMerged, Dish.STRING);
      const nodeData = await dishToTransferable(nodeDish);
      const nodeResult: NodeResult = {
        nodeId: cn.id,
        output: nodeData,
        displayValue: nodeMerged,
        forkResults: nodePieces,
        duration: totalDuration,
        status: 'success',
      };
      results.set(cn.id, nodeResult);
      onProgress?.(cn.id, nodeResult);
    }
  } catch (err: any) {
    const errorResult: NodeResult = {
      nodeId: forkId,
      output: null,
      displayValue: '',
      duration: performance.now() - start,
      error: err?.message ?? String(err),
      status: 'error',
    };
    results.set(forkId, errorResult);
    onProgress?.(forkId, errorResult);
  }
}

/**
 * Collect the linear downstream chain of operation nodes from a starting
 * node. Follows single-output edges until a branch, leaf, or Merge is found.
 *
 * Returns `{ chain, mergeNode }`. If a Merge is found, `mergeNode` is set
 * and is NOT included in `chain` (it's handled specially by the fork handler).
 */
function collectDownstreamChain(
  startId: string,
  nodeMap: Map<string, GraphNode>,
  outgoingEdges: Map<string, GraphEdge[]>,
): { chain: GraphNode[]; mergeNode: GraphNode | null } {
  const chain: GraphNode[] = [];
  let mergeNode: GraphNode | null = null;
  let currentId = startId;

  while (true) {
    const outEdges = outgoingEdges.get(currentId) ?? [];
    if (outEdges.length !== 1) break; // branch or leaf

    const nextId = outEdges[0].target;
    const nextNode = nodeMap.get(nextId);
    if (!nextNode || nextNode.type !== 'operation') break;

    // Stop at Merge — it terminates the fork chain
    if (nextNode.data?.operationName === 'Merge') {
      mergeNode = nextNode;
      break;
    }

    chain.push(nextNode);
    currentId = nextId;
  }

  return { chain, mergeNode };
}

/**
 * Parse CyberChef-style escape sequences in delimiter strings.
 */
function parseEscapes(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/\\\\/g, '\\');
}

// ====================================================================
// Internal helpers
// ====================================================================

/**
 * Given a node id and the current results map, find the upstream Dish
 * by following incoming edges.
 */
function resolveUpstreamDish(
  nodeId: string,
  incomingEdges: Map<string, GraphEdge[]>,
  results: Map<string, NodeResult>,
): InstanceType<typeof Dish> | null {
  const incoming = incomingEdges.get(nodeId);
  if (!incoming || incoming.length === 0) return null;

  for (const edge of incoming) {
    const upstreamResult = results.get(edge.source);
    if (upstreamResult?.output) {
      const dishData = upstreamResult.output as DishData;
      return dishFromTransferable(dishData);
    }
  }

  return null;
}

/**
 * Collect the set of node ids that are downstream of (and including)
 * `startId` via a BFS over outgoing edges.
 */
function collectDownstream(
  startId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
): Set<string> {
  const successors = new Map<string, string[]>();
  for (const node of nodes) {
    successors.set(node.id, []);
  }
  for (const edge of edges) {
    successors.get(edge.source)?.push(edge.target);
  }

  const visited = new Set<string>();
  const queue = [startId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const succ of successors.get(current) ?? []) {
      if (!visited.has(succ)) {
        queue.push(succ);
      }
    }
  }

  return visited;
}
