import { useCallback } from 'react';
import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';
import { useGraphStore } from '@/store/graphStore';

/* ------------------------------------------------------------------ */
/*  Layout constants                                                   */
/* ------------------------------------------------------------------ */

/** Read the --node-width CSS variable and return its pixel value. */
function getNodeWidth(): number {
  if (typeof document === 'undefined') return 180;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--node-width')
    .trim();
  const px = parseFloat(raw);
  return Number.isFinite(px) ? px : 180;
}

/** Default height assumed for every node when computing layout. */
const NODE_HEIGHT = 80;

/** Direction of the layout: TB = top-to-bottom. */
const DIRECTION: 'TB' | 'LR' = 'TB';

/** Vertical separation between node rows. */
const RANK_SEP = 80;

/** Horizontal separation between nodes in the same rank. */
const NODE_SEP = 40;

/* ------------------------------------------------------------------ */
/*  Pure layout function                                               */
/* ------------------------------------------------------------------ */

/**
 * Run dagre layout on the given nodes and edges, returning a new
 * array of nodes with updated positions.  The input arrays are
 * **not** mutated.
 */
export function computeLayout(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = DIRECTION,
): Node[] {
  const nodeWidth = getNodeWidth();
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    ranksep: RANK_SEP,
    nodesep: NODE_SEP,
  });

  for (const node of nodes) {
    g.setNode(node.id, { width: nodeWidth, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    // dagre returns the centre of the node; React Flow uses the
    // top-left corner.
    return {
      ...node,
      position: {
        x: pos.x - nodeWidth / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

/**
 * Returns an `applyLayout` callback that reads the current graph from
 * the store, computes an optimal dagre layout, and writes the updated
 * node positions back.
 */
export function useAutoLayout() {
  const applyLayout = useCallback((direction: 'TB' | 'LR' = DIRECTION) => {
    const { nodes, edges } = useGraphStore.getState();
    if (nodes.length === 0) return;

    const laid = computeLayout(nodes, edges, direction);

    // We use the raw `set` on the store's internal API so we only
    // trigger a single render and a single undo snapshot.
    useGraphStore.getState().captureSnapshot();
    useGraphStore.setState({ nodes: laid });
  }, []);

  return { applyLayout } as const;
}
