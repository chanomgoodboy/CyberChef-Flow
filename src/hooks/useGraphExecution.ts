import { useEffect, useCallback, useRef } from 'react';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { useExecutionStore, type NodeResult } from '@/store/executionStore';
import { getWorkerBridge } from '@/worker';
import type {
  SerializedGraphNode,
  SerializedGraphEdge,
  SerializedNodeResult,
} from '@/worker/protocol';
import type { DishData } from '@/adapter/types';
import { useCribStore } from '@/store/cribStore';
import type { MagicHintSuggestion } from '@/engine/MagicEngine';
import { createNodeId } from '@/utils/id';
import { computeFileHash, type ArtifactFile } from '@/components/Nodes/ArtifactNode';
import { getMeta } from '@/adapter/OperationRegistry';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Convert a worker `SerializedNodeResult` into the store `NodeResult`
 * shape expected by the execution store.
 */
function toStoreResult(r: SerializedNodeResult): NodeResult {
  return {
    output: r.output,
    displayValue: r.displayValue,
    dataUrl: r.dataUrl,
    isHtml: r.isHtml,
    isTerminal: r.isTerminal,
    duration: r.duration,
    error: r.error,
    status: r.status,
    forkResults: r.forkResults,
    files: r.files,
  };
}

/**
 * When a backend operation produces extracted files, create or update
 * an artifact node connected to the source operation node.
 * Files are deduplicated by content hash.
 */
function handleArtifactFiles(
  nodeId: string,
  rawFiles: { name: string; size: number; data: string }[],
) {
  const { nodes, edges, addNodeToChain, updateNodeData } =
    useGraphStore.getState();

  const now = Date.now();

  // Filter out files with no actual data content (backend may report
  // extractions that only exist on disk without sending the data back).
  const withData = rawFiles.filter((f) => f.data && f.data.length > 0);
  if (withData.length === 0) return;

  // Stamp each incoming file with hash, timestamp, and default folder
  const incoming: ArtifactFile[] = withData.map((f) => ({
    ...f,
    hash: computeFileHash(f.data),
    addedAt: now,
    folder: '/',
  }));

  // Look for an existing artifact node connected from nodeId
  const outEdges = edges.filter((e) => e.source === nodeId);
  let artifactNodeId: string | undefined;
  for (const e of outEdges) {
    const target = nodes.find((n) => n.id === e.target);
    if (target?.type === 'artifact') {
      artifactNodeId = target.id;
      break;
    }
  }

  if (artifactNodeId) {
    // Dedup against existing files
    const existing = nodes.find((n) => n.id === artifactNodeId);
    const existingFiles = (existing?.data?.files as ArtifactFile[]) ?? [];
    const existingHashes = new Set(existingFiles.map((f) => f.hash));
    const newFiles = incoming.filter((f) => !existingHashes.has(f.hash));
    if (newFiles.length === 0) return; // all duplicates
    updateNodeData(artifactNodeId, {
      files: [...existingFiles, ...newFiles],
      newFileCount: newFiles.length,
      lastUpdated: now,
    });
  } else {
    // Create a new artifact node as a side branch
    const newNode = {
      id: createNodeId(),
      type: 'artifact' as const,
      position: { x: 0, y: 0 }, // addNodeToChain will reposition
      data: {
        files: incoming,
        sourceNodeId: nodeId,
        newFileCount: incoming.length,
        lastUpdated: now,
      },
    };
    addNodeToChain(newNode, { afterNodeId: nodeId, branch: true });
  }
}

/**
 * Strip React Flow internals from nodes for worker transfer.
 */
function serializeNodes(
  nodes: { id: string; type?: string; data: Record<string, unknown> }[],
): SerializedGraphNode[] {
  return nodes.map((n) => ({
    id: n.id,
    type: n.type,
    data: n.data ?? {},
  }));
}

/**
 * Strip React Flow internals from edges for worker transfer.
 */
function serializeEdges(
  edges: { id: string; source: string; target: string }[],
): SerializedGraphEdge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
  }));
}

/* ------------------------------------------------------------------ */
/*  Auto-magic on leaf nodes (via worker)                              */
/* ------------------------------------------------------------------ */

function triggerAutoMagic() {
  const { nodes, edges } = useGraphStore.getState();
  const { results, setMagicHint, clearMagicHints } =
    useExecutionStore.getState();

  // Find leaf nodes: no outgoing edges, not magic/Fork/Register, no HTML output
  const sourceSet = new Set(edges.map((e) => e.source));
  const leafNodes = nodes.filter(
    (n) =>
      !sourceSet.has(n.id) &&
      n.type !== 'magic' &&
      (n.data as any)?.outputType !== 'html' &&
      (n.data as any)?.operationName !== 'Fork' &&
      (n.data as any)?.operationName !== 'Register',
  );

  clearMagicHints();
  if (leafNodes.length === 0) return;

  // Collect leaf DishData for nodes with valid output
  const leaves: { nodeId: string; dishData: DishData }[] = [];
  for (const node of leafNodes) {
    const result = results.get(node.id);
    if (!result || result.status !== 'success' || !result.output) continue;
    leaves.push({ nodeId: node.id, dishData: result.output as DishData });
  }

  if (leaves.length === 0) return;

  const bridge = getWorkerBridge();
  bridge.analyzeMagic(leaves, {
    onHint: (nodeId, hint) => {
      setMagicHint(nodeId, hint);
    },
  });

  // Trigger crib analysis if secrets are configured
  const { entries } = useCribStore.getState();
  if (entries.length > 0) {
    const secrets = entries.slice(0, 6).map((e) => e.value);
    bridge.analyzeCribs(leaves, secrets, {
      onSuggestions: (nodeId, cribSuggestions) => {
        const current = useExecutionStore.getState().magicHints.get(nodeId);
        if (!current) return;

        // Deduplicate: skip crib suggestions whose recipe op+args already exist
        const existingKeys = new Set(
          current.suggestions.map(
            (s) => s.recipe.map((r) => r.op).join('+') + JSON.stringify(s.recipe.map((r) => r.args)),
          ),
        );
        const newSuggestions: MagicHintSuggestion[] = [];
        for (const cs of cribSuggestions) {
          const key = cs.recipe.map((r) => r.op).join('+') + JSON.stringify(cs.recipe.map((r) => r.args));
          if (!existingKeys.has(key)) {
            existingKeys.add(key);
            newSuggestions.push(cs);
          }
        }

        if (newSuggestions.length > 0) {
          const merged = [...current.suggestions, ...newSuggestions];
          merged.sort((a, b) => a.entropy - b.entropy);
          useExecutionStore.getState().setMagicHint(nodeId, {
            ...current,
            suggestions: merged,
          });
        }
      },
    });
  }
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const AUTO_RUN_DEBOUNCE_MS = 300;
const BACKEND_DEBOUNCE_MS = 1500;

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

/**
 * Watches the graph store for node/edge changes and, when `autoRun`
 * is enabled, re-executes the graph after a debounce.  Also exposes
 * imperative `runGraph` and `runFromNode` helpers.
 */
export function useGraphExecution() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Eagerly start the worker and sync initial cribs.
  useEffect(() => {
    const bridge = getWorkerBridge();

    // Sync current cribs to worker on startup
    const { entries } = useCribStore.getState();
    if (entries.length > 0) {
      bridge.syncCribs(entries.map((e) => e.value));
    }

    // Handle deferred backend operation results — update store when they arrive
    bridge.onNodeUpdate((nodeId, result) => {
      useExecutionStore.getState().setResult(nodeId, toStoreResult(result));
      if (result.files && result.files.length > 0) {
        handleArtifactFiles(nodeId, result.files);
      }
    });

    // Re-sync whenever crib store changes
    const unsub = useCribStore.subscribe((state, prev) => {
      if (state.entries !== prev.entries) {
        bridge.syncCribs(state.entries.map((e) => e.value));
      }
    });

    return unsub;
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Imperative execution helpers                                     */
  /* ---------------------------------------------------------------- */

  /**
   * Execute the entire graph from scratch.
   * Optionally accepts edge overrides (for filtered upstream execution).
   */
  const runGraph = useCallback((edgeOverrides?: any[]) => {
    // Cancel any pending auto-run timer to prevent stale re-triggers.
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const { nodes, edges: storeEdges } = useGraphStore.getState();
    const edges = edgeOverrides ?? storeEdges;
    const { setResult, setRunning, clearResults } =
      useExecutionStore.getState();

    if (nodes.length === 0) return;

    setRunning(true);
    clearResults();

    // Mark every operation/magic node as "running".
    for (const node of nodes) {
      if (node.type === 'operation' || node.type === 'magic') {
        setResult(node.id, {
          output: null,
          displayValue: '',
          duration: 0,
          status: 'running',
        });
      }
    }

    const bridge = getWorkerBridge();
    bridge.executeGraph(
      serializeNodes(nodes),
      serializeEdges(edges),
      {
        onProgress: (nodeId, result) => {
          setResult(nodeId, toStoreResult(result));
          if (result.files && result.files.length > 0) {
            handleArtifactFiles(nodeId, result.files);
          }
        },
        onComplete: () => {
          // All individual results were already set via onProgress.
          useExecutionStore.getState().setRunning(false);
          triggerAutoMagic();
        },
        onCycleError: (nodeIds) => {
          for (const nodeId of nodeIds) {
            setResult(nodeId, {
              output: null,
              displayValue: '',
              duration: 0,
              error: 'Graph contains a cycle',
              status: 'error',
            });
          }
          useExecutionStore.getState().setRunning(false);
        },
        onError: (message) => {
          for (const node of nodes) {
            if (node.type === 'operation') {
              setResult(node.id, {
                output: null,
                displayValue: '',
                duration: 0,
                error: message,
                status: 'error',
              });
            }
          }
          useExecutionStore.getState().setRunning(false);
        },
      },
    );
  }, []);

  /**
   * Execute the graph starting from a specific node (incremental).
   * Nodes upstream of `nodeId` are assumed to already have results.
   */
  const runFromNode = useCallback(
    (nodeId: string) => {
      // Cancel any pending auto-run timer to prevent stale re-triggers.
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const { nodes, edges } = useGraphStore.getState();
      const { setResult, setRunning, results: existingResults } =
        useExecutionStore.getState();

      setRunning(true);

      setResult(nodeId, {
        output: null,
        displayValue: '',
        duration: 0,
        status: 'running',
      });

      // Serialize existing results as entries for the worker
      const existingEntries: [string, SerializedNodeResult][] = [];
      for (const [id, r] of existingResults) {
        existingEntries.push([
          id,
          {
            nodeId: id,
            output: (r.output as DishData) ?? null,
            displayValue: r.displayValue,
            dataUrl: r.dataUrl,
            isHtml: r.isHtml,
            duration: r.duration,
            error: r.error,
            status: r.status,
            forkResults: r.forkResults,
          },
        ]);
      }

      const bridge = getWorkerBridge();
      bridge.executeGraph(
        serializeNodes(nodes),
        serializeEdges(edges),
        {
          onProgress: (nid, result) => {
            setResult(nid, toStoreResult(result));
            if (result.files && result.files.length > 0) {
              handleArtifactFiles(nid, result.files);
            }
          },
          onComplete: () => {
            // All individual results were already set via onProgress.
            useExecutionStore.getState().setRunning(false);
            triggerAutoMagic();
          },
          onCycleError: () => {
            setResult(nodeId, {
              output: null,
              displayValue: '',
              duration: 0,
              error: 'Graph contains a cycle',
              status: 'error',
            });
            useExecutionStore.getState().setRunning(false);
          },
          onError: (message) => {
            setResult(nodeId, {
              output: null,
              displayValue: '',
              duration: 0,
              error: message,
              status: 'error',
            });
            useExecutionStore.getState().setRunning(false);
          },
        },
        {
          changedNodeId: nodeId,
          existingResults: existingEntries,
        },
      );
    },
    [],
  );

  /* ---------------------------------------------------------------- */
  /*  Auto-run watcher                                                 */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const unsubscribe = useGraphStore.subscribe(
      (state, prevState) => {
        const autoRun = useExecutionStore.getState().autoRun;
        if (!autoRun) return;

        const edgesChanged = state.edges !== prevState.edges;

        // Find which nodes had meaningful changes (data changed, not just selection/position).
        const changedNodeIds: string[] = [];
        let structureChanged = false; // node added/removed or edges changed

        if (state.nodes !== prevState.nodes) {
          if (state.nodes.length !== prevState.nodes.length) {
            structureChanged = true;
            // Find new node IDs
            const prevIds = new Set(prevState.nodes.map((n) => n.id));
            for (const n of state.nodes) {
              if (!prevIds.has(n.id)) changedNodeIds.push(n.id);
            }
          } else {
            const prevMap = new Map(prevState.nodes.map((n) => [n.id, n]));
            for (const n of state.nodes) {
              const prev = prevMap.get(n.id);
              if (!prev) {
                structureChanged = true;
                changedNodeIds.push(n.id);
              } else if (n.data !== prev.data && n.type !== 'note' && n.type !== 'artifact') {
                // Ignore visual-only changes (e.g. isMinimized toggle)
                const { isMinimized: _a, ...currData } = (n.data ?? {}) as Record<string, unknown>;
                const { isMinimized: _b, ...prevData } = (prev.data ?? {}) as Record<string, unknown>;
                const currJson = JSON.stringify(currData);
                const prevJson = JSON.stringify(prevData);
                if (currJson !== prevJson) {
                  changedNodeIds.push(n.id);
                }
              }
            }
          }
        }

        if (edgesChanged) structureChanged = true;

        if (changedNodeIds.length === 0 && !structureChanged) return;

        // When edges change, find the target nodes of added/removed edges —
        // those are the nodes whose inputs changed and need re-execution.
        if (edgesChanged && state.nodes.length === prevState.nodes.length) {
          const prevEdgeSet = new Set(prevState.edges.map((e) => `${e.source}->${e.target}`));
          const currEdgeSet = new Set(state.edges.map((e) => `${e.source}->${e.target}`));
          for (const e of state.edges) {
            const key = `${e.source}->${e.target}`;
            if (!prevEdgeSet.has(key)) changedNodeIds.push(e.target); // added edge
          }
          for (const e of prevState.edges) {
            const key = `${e.source}->${e.target}`;
            if (!currEdgeSet.has(key)) changedNodeIds.push(e.target); // removed edge
          }
        }

        // Use longer debounce for backend operations (heavyweight tools)
        const hasBackendNode = changedNodeIds.some((id) => {
          const node = state.nodes.find((n) => n.id === id);
          if (!node || node.type !== 'operation') return false;
          const opName = (node.data as any)?.operationName;
          return opName && getMeta(opName)?.module === 'Backend';
        });
        const debounce = hasBackendNode ? BACKEND_DEBOUNCE_MS : AUTO_RUN_DEBOUNCE_MS;

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          const { results } = useExecutionStore.getState();

          // If we have specific changed nodes and existing results,
          // run incrementally from the earliest affected node.
          if (changedNodeIds.length > 0 && results.size > 0) {
            runFromNode(changedNodeIds[0]);
            return;
          }

          // Otherwise full run (new graph, no prior results, etc.)
          runGraph();
        }, debounce);
      },
    );

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [runGraph, runFromNode]);

  /* ---------------------------------------------------------------- */
  /*  Re-execute when upstream source selection changes                  */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const unsubUI = useUIStore.subscribe(
      (state, prevState) => {
        if (state.selectedUpstreamSourceId === prevState.selectedUpstreamSourceId) return;
        if (!state.selectedUpstreamSourceId || !state.selectedNodeId) return;

        const { nodes, edges } = useGraphStore.getState();
        const selectedNodeId = state.selectedNodeId;
        const selectedRoot = state.selectedUpstreamSourceId;

        // Build backward adjacency
        const bwd = new Map<string, string[]>();
        for (const e of edges) {
          if (!bwd.has(e.target)) bwd.set(e.target, []);
          bwd.get(e.target)!.push(e.source);
        }

        // Find nodes on the path from selectedRoot to selectedNodeId
        const canReach = (start: string, target: string): boolean => {
          const visited = new Set<string>();
          const q = [start];
          while (q.length > 0) {
            const id = q.pop()!;
            if (id === target) return true;
            if (visited.has(id)) continue;
            visited.add(id);
            for (const s of bwd.get(id) ?? []) q.push(s);
          }
          return false;
        };

        // Filter edges: at merge points on the path to selectedNodeId,
        // keep only the edge from the direction leading to selectedRoot
        const pathNodes = new Set<string>();
        const pathQueue = [selectedNodeId];
        while (pathQueue.length > 0) {
          const id = pathQueue.pop()!;
          if (pathNodes.has(id)) continue;
          pathNodes.add(id);
          const sources = bwd.get(id) ?? [];
          if (sources.length > 1) {
            for (const s of sources) {
              if (s === selectedRoot || canReach(s, selectedRoot)) {
                pathQueue.push(s);
              }
            }
          } else {
            for (const s of sources) pathQueue.push(s);
          }
        }

        const filteredEdges = edges.filter((e) => {
          // For edges targeting a node on the path that has multiple inputs,
          // only keep edges from sources on the path
          if (pathNodes.has(e.target)) {
            const sources = bwd.get(e.target) ?? [];
            if (sources.length > 1) {
              return pathNodes.has(e.source);
            }
          }
          return true;
        });

        runGraph(filteredEdges);
      },
    );

    return () => unsubUI();
  }, [runGraph]);

  return { runGraph, runFromNode } as const;
}

/**
 * Standalone function to re-execute the graph from a specific node.
 * Can be called from any component without the hook.
 */
export function executeFromNode(nodeId: string) {
  const { nodes, edges } = useGraphStore.getState();
  const { setResult, setRunning, results: existingResults } =
    useExecutionStore.getState();

  setRunning(true);
  setResult(nodeId, {
    output: null,
    displayValue: '',
    duration: 0,
    status: 'running',
  });

  const existingEntries: [string, SerializedNodeResult][] = [];
  for (const [id, r] of existingResults) {
    existingEntries.push([
      id,
      {
        nodeId: id,
        output: (r.output as DishData) ?? null,
        displayValue: r.displayValue,
        dataUrl: r.dataUrl,
        isHtml: r.isHtml,
        duration: r.duration,
        error: r.error,
        status: r.status,
        forkResults: r.forkResults,
      },
    ]);
  }

  const bridge = getWorkerBridge();
  bridge.executeGraph(
    serializeNodes(nodes),
    serializeEdges(edges),
    {
      onProgress: (nid, result) => {
        useExecutionStore.getState().setResult(nid, toStoreResult(result));
        if (result.files && result.files.length > 0) {
          handleArtifactFiles(nid, result.files);
        }
      },
      onComplete: () => {
        useExecutionStore.getState().setRunning(false);
        triggerAutoMagic();
      },
      onCycleError: () => {
        useExecutionStore.getState().setResult(nodeId, {
          output: null,
          displayValue: '',
          duration: 0,
          error: 'Graph contains a cycle',
          status: 'error',
        });
        useExecutionStore.getState().setRunning(false);
      },
      onError: (message) => {
        useExecutionStore.getState().setResult(nodeId, {
          output: null,
          displayValue: '',
          duration: 0,
          error: message,
          status: 'error',
        });
        useExecutionStore.getState().setRunning(false);
      },
    },
    {
      changedNodeId: nodeId,
      existingResults: existingEntries,
    },
  );
}

/**
 * Force-run a manual-only backend node (e.g. hashcat, john).
 * Re-executes from that node with forceNodeIds so the engine skips the
 * manual-only guard.
 */
export function forceRunNode(nodeId: string) {
  const { nodes, edges } = useGraphStore.getState();
  const { setResult, setRunning, results: existingResults } =
    useExecutionStore.getState();

  setRunning(true);
  setResult(nodeId, {
    output: null,
    displayValue: '',
    duration: 0,
    status: 'running',
  });

  const existingEntries: [string, SerializedNodeResult][] = [];
  for (const [id, r] of existingResults) {
    existingEntries.push([
      id,
      {
        nodeId: id,
        output: (r.output as DishData) ?? null,
        displayValue: r.displayValue,
        dataUrl: r.dataUrl,
        isHtml: r.isHtml,
        duration: r.duration,
        error: r.error,
        status: r.status,
        forkResults: r.forkResults,
      },
    ]);
  }

  const bridge = getWorkerBridge();
  bridge.executeGraph(
    serializeNodes(nodes),
    serializeEdges(edges),
    {
      onProgress: (nid, result) => {
        useExecutionStore.getState().setResult(nid, toStoreResult(result));
        if (result.files && result.files.length > 0) {
          handleArtifactFiles(nid, result.files);
        }
      },
      onComplete: () => {
        useExecutionStore.getState().setRunning(false);
        triggerAutoMagic();
      },
      onCycleError: () => {
        useExecutionStore.getState().setResult(nodeId, {
          output: null,
          displayValue: '',
          duration: 0,
          error: 'Graph contains a cycle',
          status: 'error',
        });
        useExecutionStore.getState().setRunning(false);
      },
      onError: (message) => {
        useExecutionStore.getState().setResult(nodeId, {
          output: null,
          displayValue: '',
          duration: 0,
          error: message,
          status: 'error',
        });
        useExecutionStore.getState().setRunning(false);
      },
    },
    {
      changedNodeId: nodeId,
      existingResults: existingEntries,
      forceNodeIds: [nodeId],
    },
  );
}
