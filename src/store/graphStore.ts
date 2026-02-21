import { create } from 'zustand';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';

import { createEdgeId, createNodeId } from '@/utils/id';
import {
  serializeGraph,
  deserializeGraph,
} from '@/utils/graphSerializer';
import {
  type GraphSnapshot,
  type HistorySlice,
  pushSnapshot,
  cloneSnapshot,
  MAX_HISTORY,
  SNAPSHOT_DEBOUNCE_MS,
} from './historyMiddleware';

/* ------------------------------------------------------------------ */
/*  State interface                                                    */
/* ------------------------------------------------------------------ */

interface GraphState extends HistorySlice {
  /* React Flow core state */
  nodes: Node[];
  edges: Edge[];

  /* React Flow event handlers -- bind directly to <ReactFlow> */
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;

  /* Node CRUD */
  addNode: (node: Node) => void;
  addNodeToChain: (node: Node, options?: { position?: { x: number; y: number }; afterNodeId?: string; branch?: boolean }) => void;
  ensureInputNode: () => void;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  insertNodeOnEdge: (nodeId: string, edgeId: string) => void;
  bypassNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<Record<string, unknown>>) => void;

  /* Bulk setters */
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;

  /* Serialisation */
  toJSON: () => string;
  fromJSON: (json: string) => void;

  /* Undo / redo */
  captureSnapshot: () => void;
  undo: () => void;
  redo: () => void;
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

/** Timestamp of the last automatic snapshot (for debouncing). */
let lastSnapshotTime = 0;

export const useGraphStore = create<GraphState>()((set, get) => ({
  /* -- initial state ------------------------------------------------ */
  nodes: [],
  edges: [],
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  /* -- React Flow handlers ------------------------------------------ */

  onNodesChange: (changes) => {
    set((state) => {
      const newNodes = applyNodeChanges(changes, state.nodes);
      // Clamp all nodes: cannot move above y=0 or left of x=0
      for (let i = 0; i < newNodes.length; i++) {
        const n = newNodes[i];
        const clamped = {
          x: Math.max(0, n.position.x),
          y: Math.max(0, n.position.y),
        };
        if (clamped.x !== n.position.x || clamped.y !== n.position.y) {
          newNodes[i] = { ...n, position: clamped };
        }
      }
      return { nodes: newNodes };
    });
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },

  onConnect: (connection) => {
    const edgeWithId: Edge = {
      ...connection,
      id: createEdgeId(),
      sourceHandle: connection.sourceHandle ?? null,
      targetHandle: connection.targetHandle ?? null,
    };
    get().captureSnapshot();
    set((state) => ({
      edges: addEdge(edgeWithId, state.edges),
    }));
  },

  /* -- Node CRUD ---------------------------------------------------- */

  addNode: (node) => {
    get().captureSnapshot();
    set((state) => ({
      nodes: [...state.nodes, node],
    }));
  },

  addNodeToChain: (node, options) => {
    const { nodes, edges } = get();
    get().captureSnapshot();

    const positionOverride = options?.position;
    const afterNodeId = options?.afterNodeId;
    const branch = options?.branch ?? false;

    // Determine the anchor node:
    // 1. If afterNodeId is provided, use that node
    // 2. Otherwise find the chain tail (node with no outgoing edges)
    let anchor: Node | undefined;
    if (afterNodeId) {
      anchor = nodes.find((n) => n.id === afterNodeId);
    }
    if (!anchor) {
      const sources = new Set(edges.map((e) => e.source));
      const tails = nodes.filter((n) => !sources.has(n.id));
      anchor = tails.length > 0 ? tails[tails.length - 1] : nodes[nodes.length - 1];
    }

    if (anchor) {
      // Position the new node — when branching, offset horizontally to avoid overlap
      if (positionOverride) {
        node.position = positionOverride;
      } else if (branch && edges.some((e) => e.source === anchor!.id)) {
        const branchCount = edges.filter((e) => e.source === anchor!.id).length;
        node.position = { x: anchor.position.x + branchCount * 220, y: anchor.position.y + 120 };
      } else {
        node.position = { x: anchor.position.x, y: anchor.position.y + 120 };
      }

      // Check if anchor already has an outgoing edge — if so, splice in between
      // (unless branch mode: just add a new branch edge without removing the existing one)
      const outgoingEdge = !branch ? edges.find((e) => e.source === anchor!.id) : undefined;
      let newEdges = edges;
      let updatedNodes = nodes;

      if (outgoingEdge) {
        // Remove the old edge, create two new edges: anchor→new, new→oldTarget
        newEdges = edges.filter((e) => e.id !== outgoingEdge.id);
        const edgeToNew: Edge = {
          id: createEdgeId(),
          source: anchor.id,
          target: node.id,
          sourceHandle: 'output',
          targetHandle: 'input',
        };
        const edgeToOldTarget: Edge = {
          id: createEdgeId(),
          source: node.id,
          target: outgoingEdge.target,
          sourceHandle: 'output',
          targetHandle: 'input',
        };
        newEdges = [...newEdges, edgeToNew, edgeToOldTarget];

        if (!positionOverride) {
          node.position = {
            x: anchor.position.x,
            y: anchor.position.y + 120,
          };
        }

        // Collect all downstream node IDs from the old target onward
        const downstreamIds = new Set<string>();
        const edgeLookup = new Map<string, string[]>();
        for (const e of edges) {
          if (!edgeLookup.has(e.source)) edgeLookup.set(e.source, []);
          edgeLookup.get(e.source)!.push(e.target);
        }
        const queue = [outgoingEdge.target];
        while (queue.length > 0) {
          const cur = queue.pop()!;
          if (downstreamIds.has(cur)) continue;
          downstreamIds.add(cur);
          const children = edgeLookup.get(cur);
          if (children) queue.push(...children);
        }

        // Shift all downstream nodes down by 160px
        updatedNodes = nodes.map((n) =>
          downstreamIds.has(n.id)
            ? { ...n, position: { x: n.position.x, y: n.position.y + 120 } }
            : n,
        );
      } else {
        // No outgoing edge — append at the end
        const edgeToNew: Edge = {
          id: createEdgeId(),
          source: anchor.id,
          target: node.id,
          sourceHandle: 'output',
          targetHandle: 'input',
        };
        newEdges = [...edges, edgeToNew];
      }

      set({ nodes: [...updatedNodes, node], edges: newEdges });
    } else {
      node.position = positionOverride ?? { x: 100, y: 100 };
      set({ nodes: [...nodes, node] });
    }
  },

  ensureInputNode: () => {
    const { nodes } = get();
    if (nodes.length === 0) {
      set({
        nodes: [
          {
            id: createNodeId(),
            type: 'input',
            position: { x: 3, y: 3 },
            data: { inputValue: '', inputType: 'text' },
          },
        ],
      });
    }
  },

  removeNode: (nodeId) => {
    get().captureSnapshot();
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId,
      ),
    }));
  },

  removeEdge: (edgeId) => {
    get().captureSnapshot();
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    }));
  },

  insertNodeOnEdge: (nodeId, edgeId) => {
    get().captureSnapshot();
    set((state) => {
      const edge = state.edges.find((e) => e.id === edgeId);
      if (!edge) return state;

      // Already connected — skip
      if (edge.source === nodeId || edge.target === nodeId) return state;

      // Remove old edge, add source→node and node→target
      const newEdges = state.edges.filter((e) => e.id !== edgeId);
      newEdges.push({
        id: createEdgeId(),
        source: edge.source,
        target: nodeId,
        sourceHandle: edge.sourceHandle ?? 'output',
        targetHandle: 'input',
      });
      newEdges.push({
        id: createEdgeId(),
        source: nodeId,
        target: edge.target,
        sourceHandle: 'output',
        targetHandle: edge.targetHandle ?? 'input',
      });

      // Remove any pre-existing edges that connected to/from this node
      // to avoid creating duplicate connections
      const filtered = newEdges.filter(
        (e) =>
          e.id === newEdges[newEdges.length - 1].id ||
          e.id === newEdges[newEdges.length - 2].id ||
          (e.target !== nodeId && e.source !== nodeId),
      );

      return { edges: filtered };
    });
  },

  bypassNode: (nodeId) => {
    get().captureSnapshot();
    set((state) => {
      const incoming = state.edges.filter((e) => e.target === nodeId);
      const outgoing = state.edges.filter((e) => e.source === nodeId);

      // Connect each source directly to each target
      const bridgeEdges: Edge[] = [];
      for (const inc of incoming) {
        for (const out of outgoing) {
          bridgeEdges.push({
            id: createEdgeId(),
            source: inc.source,
            target: out.target,
            sourceHandle: inc.sourceHandle ?? 'output',
            targetHandle: out.targetHandle ?? 'input',
          });
        }
      }

      // Remove all edges touching this node, add bridge edges
      const kept = state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId,
      );

      return { edges: [...kept, ...bridgeEdges] };
    });
  },

  updateNodeData: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n,
      ),
    }));
  },

  /* -- Bulk setters ------------------------------------------------- */

  setNodes: (nodes) => {
    get().captureSnapshot();
    set({ nodes });
  },

  setEdges: (edges) => {
    get().captureSnapshot();
    set({ edges });
  },

  /* -- Serialisation ------------------------------------------------ */

  toJSON: () => {
    const { nodes, edges } = get();
    return serializeGraph(nodes, edges);
  },

  fromJSON: (json) => {
    const { nodes, edges } = deserializeGraph(json);
    get().captureSnapshot();
    set({ nodes, edges });
  },

  /* -- Undo / redo -------------------------------------------------- */

  captureSnapshot: () => {
    const now = Date.now();
    if (now - lastSnapshotTime < SNAPSHOT_DEBOUNCE_MS) return;
    lastSnapshotTime = now;

    const { nodes, edges, past } = get();
    const snapshot: GraphSnapshot = cloneSnapshot({ nodes, edges });
    const newPast = pushSnapshot(past, snapshot);
    set({
      past: newPast,
      future: [],
      canUndo: newPast.length > 0,
      canRedo: false,
    });
  },

  undo: () => {
    const { past, nodes, edges } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);
    const currentSnapshot: GraphSnapshot = cloneSnapshot({ nodes, edges });

    set((state) => ({
      nodes: previous.nodes,
      edges: previous.edges,
      past: newPast,
      future: [currentSnapshot, ...state.future].slice(0, MAX_HISTORY),
      canUndo: newPast.length > 0,
      canRedo: true,
    }));
  },

  redo: () => {
    const { future, nodes, edges } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);
    const currentSnapshot: GraphSnapshot = cloneSnapshot({ nodes, edges });

    set((state) => ({
      nodes: next.nodes,
      edges: next.edges,
      past: [...state.past, currentSnapshot].slice(-MAX_HISTORY),
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0,
    }));
  },
}));
