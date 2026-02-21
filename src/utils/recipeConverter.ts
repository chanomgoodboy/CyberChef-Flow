import type { Node, Edge } from '@xyflow/react';
import { createNodeId, createEdgeId } from './id';
import { getMeta } from '@/adapter/OperationRegistry';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface RecipeStep {
  op: string;
  args: any[];
}

/* ------------------------------------------------------------------ */
/*  Layout constants                                                   */
/* ------------------------------------------------------------------ */

const NODE_SPACING_Y = 160;
const NODE_X = 250;

/* ------------------------------------------------------------------ */
/*  Recipe -> Graph                                                    */
/* ------------------------------------------------------------------ */

/**
 * Convert a CyberChef-style recipe (array of `{op, args}`) into a
 * linear node graph:  InputNode -> Op1 -> Op2 -> ... -> OutputNode.
 *
 * Each operation node is placed vertically below the previous one so
 * the resulting graph reads top-to-bottom.
 */
export function recipeToGraph(recipe: RecipeStep[]): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // --- Input node ---
  const inputId = createNodeId();
  nodes.push({
    id: inputId,
    type: 'input',
    position: { x: NODE_X, y: 0 },
    data: { inputValue: '', inputType: 'text' },
  });

  let previousId = inputId;

  // --- Operation nodes ---
  recipe.forEach((step, index) => {
    const opId = createNodeId();
    const meta = getMeta(step.op);

    // Build arg values keyed by definition name so the node UI can
    // render proper controls.
    const argValues: Record<string, any> = {};
    if (meta) {
      meta.args.forEach((def, i) => {
        argValues[def.name] = step.args[i] ?? def.value;
      });
    }

    nodes.push({
      id: opId,
      type: 'operation',
      position: { x: NODE_X, y: (index + 1) * NODE_SPACING_Y },
      data: {
        operationName: step.op,
        args: argValues,
        inputType: meta?.inputType ?? 'string',
        outputType: meta?.outputType ?? 'string',
      },
    });

    edges.push({
      id: createEdgeId(),
      source: previousId,
      target: opId,
      sourceHandle: 'output',
      targetHandle: 'input',
    });

    previousId = opId;
  });

  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/*  Graph -> Recipe                                                    */
/* ------------------------------------------------------------------ */

/**
 * Walk the graph from source nodes (no incoming edges) to sinks,
 * collecting operation nodes along the longest linear path.
 * Returns a CyberChef-compatible recipe array.
 */
export function graphToRecipe(
  nodes: Node[],
  edges: Edge[],
): RecipeStep[] {
  // Build adjacency: source -> target[]
  const adj = new Map<string, string[]>();
  const incoming = new Map<string, number>();

  for (const node of nodes) {
    adj.set(node.id, []);
    incoming.set(node.id, 0);
  }
  for (const edge of edges) {
    adj.get(edge.source)?.push(edge.target);
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
  }

  // Find root nodes (zero incoming edges)
  const roots = nodes.filter((n) => (incoming.get(n.id) ?? 0) === 0);

  // DFS to find the longest path
  let longestPath: Node[] = [];

  function dfs(nodeId: string, path: Node[]): void {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    path.push(node);
    if (path.length > longestPath.length) {
      longestPath = [...path];
    }
    for (const next of adj.get(nodeId) ?? []) {
      dfs(next, path);
    }
    path.pop();
  }

  for (const root of roots) {
    dfs(root.id, []);
  }

  // Extract operation steps (skip input/output nodes)
  const recipe: RecipeStep[] = [];
  for (const node of longestPath) {
    if (node.type !== 'operation') continue;
    const data = node.data as Record<string, any>;
    const opName: string = data.operationName ?? data.label ?? '';
    const meta = getMeta(opName);

    // Reconstruct the positional args array from the named arg values
    const argValues = (data.args ?? {}) as Record<string, any>;
    const args: any[] = meta
      ? meta.args.map((def) => argValues[def.name] ?? def.value)
      : Object.values(argValues);

    recipe.push({ op: opName, args });
  }

  return recipe;
}
