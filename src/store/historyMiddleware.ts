/**
 * Undo / redo history helpers.
 *
 * Rather than implementing Zustand middleware (which would add
 * indirection), we expose plain helper types and logic that the
 * graphStore integrates directly.  The graphStore owns the `past` and
 * `future` stacks and calls `captureSnapshot` before mutations.
 *
 * This file is kept as a standalone module so the snapshotting logic
 * is easy to test in isolation.
 */

import type { Node, Edge } from '@xyflow/react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface GraphSnapshot {
  nodes: Node[];
  edges: Edge[];
}

export interface HistorySlice {
  past: GraphSnapshot[];
  future: GraphSnapshot[];
  canUndo: boolean;
  canRedo: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Maximum number of snapshots kept in the undo stack. */
export const MAX_HISTORY = 50;

/** Minimum interval (ms) between automatic snapshots to avoid noise. */
export const SNAPSHOT_DEBOUNCE_MS = 300;

/* ------------------------------------------------------------------ */
/*  Pure helpers                                                       */
/* ------------------------------------------------------------------ */

/**
 * Push a snapshot onto the `past` stack, enforcing the max-history
 * limit.  Returns the new past array (does not mutate the input).
 */
export function pushSnapshot(
  past: GraphSnapshot[],
  snapshot: GraphSnapshot,
): GraphSnapshot[] {
  const next = [...past, snapshot];
  if (next.length > MAX_HISTORY) {
    return next.slice(next.length - MAX_HISTORY);
  }
  return next;
}

/**
 * Deep-clone a snapshot so later mutations to the live nodes/edges
 * arrays do not corrupt the history.
 */
export function cloneSnapshot(snapshot: GraphSnapshot): GraphSnapshot {
  return {
    nodes: snapshot.nodes.map((n) => ({ ...n, data: { ...n.data }, position: { ...n.position } })),
    edges: snapshot.edges.map((e) => ({ ...e })),
  };
}
