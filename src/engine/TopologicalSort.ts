import type { GraphNode, GraphEdge, ExecutionLevel, CycleError } from './types';

/**
 * Perform a topological sort of the graph using Kahn's algorithm.
 *
 * Returns an array of ExecutionLevel objects.  Each level contains a
 * set of node ids whose dependencies are fully satisfied by earlier
 * levels, meaning they can be executed in parallel within the level.
 *
 * If the graph contains a cycle the function returns a CycleError
 * instead, listing the node ids that participate in the cycle.
 *
 * @param nodes  React Flow nodes.
 * @param edges  React Flow edges.
 * @returns      Either an ordered array of ExecutionLevels or a CycleError.
 */
export function topologicalSort(
  nodes: GraphNode[],
  edges: GraphEdge[],
): ExecutionLevel[] | CycleError {
  // Build adjacency and in-degree structures.
  const nodeIds = new Set(nodes.map((n) => n.id));
  const inDegree = new Map<string, number>();
  const successors = new Map<string, string[]>();

  for (const id of nodeIds) {
    inDegree.set(id, 0);
    successors.set(id, []);
  }

  for (const edge of edges) {
    // Only consider edges whose endpoints are both present.
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;

    successors.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  // Seed the queue with all zero-in-degree nodes (sources).
  let currentLevel: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) currentLevel.push(id);
  }

  const levels: ExecutionLevel[] = [];
  let processed = 0;

  while (currentLevel.length > 0) {
    levels.push({ level: levels.length, nodeIds: currentLevel });
    processed += currentLevel.length;

    const nextLevel: string[] = [];

    for (const id of currentLevel) {
      for (const succ of successors.get(id) ?? []) {
        const newDeg = (inDegree.get(succ) ?? 1) - 1;
        inDegree.set(succ, newDeg);
        if (newDeg === 0) {
          nextLevel.push(succ);
        }
      }
    }

    currentLevel = nextLevel;
  }

  // If we did not process every node, there is at least one cycle.
  if (processed < nodeIds.size) {
    const cycleNodeIds = [...nodeIds].filter(
      (id) => (inDegree.get(id) ?? 0) > 0,
    );
    return { type: 'cycle', nodeIds: cycleNodeIds };
  }

  return levels;
}
