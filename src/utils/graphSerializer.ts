import type { Node, Edge } from '@xyflow/react';

const STORAGE_PREFIX = 'cyberweb_graph_';

/* ------------------------------------------------------------------ */
/*  Core serialisation                                                 */
/* ------------------------------------------------------------------ */

export interface SerializedGraph {
  version: 1;
  nodes: Node[];
  edges: Edge[];
  savedAt: string;
}

/**
 * Serialise the current graph (nodes + edges) to a JSON string.
 */
export function serializeGraph(nodes: Node[], edges: Edge[]): string {
  const payload: SerializedGraph = {
    version: 1,
    nodes,
    edges,
    savedAt: new Date().toISOString(),
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Deserialise a JSON string back into nodes and edges.
 * Throws if the JSON is malformed or missing required fields.
 */
export function deserializeGraph(json: string): { nodes: Node[]; edges: Edge[] } {
  const parsed = JSON.parse(json) as SerializedGraph;
  if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new Error('Invalid graph format: missing nodes or edges array');
  }
  return { nodes: parsed.nodes, edges: parsed.edges };
}

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                               */
/* ------------------------------------------------------------------ */

/**
 * Persist a graph under the given name in localStorage.
 */
export function saveToLocalStorage(
  name: string,
  nodes: Node[],
  edges: Edge[],
): void {
  const json = serializeGraph(nodes, edges);
  localStorage.setItem(`${STORAGE_PREFIX}${name}`, json);
}

/**
 * Load a previously saved graph from localStorage, or `null` if the
 * key does not exist.
 */
export function loadFromLocalStorage(
  name: string,
): { nodes: Node[]; edges: Edge[] } | null {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${name}`);
  if (!raw) return null;
  try {
    return deserializeGraph(raw);
  } catch {
    return null;
  }
}

/**
 * Return an array of all graph names saved in localStorage.
 */
export function listSavedGraphs(): string[] {
  const names: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      names.push(key.slice(STORAGE_PREFIX.length));
    }
  }
  return names.sort();
}

/**
 * Delete a saved graph from localStorage.
 */
export function deleteSavedGraph(name: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${name}`);
}

/* ------------------------------------------------------------------ */
/*  File export / download                                             */
/* ------------------------------------------------------------------ */

/**
 * Return a Blob containing the serialised graph JSON, suitable for
 * creating an object URL or sending over the network.
 */
export function exportGraphFile(nodes: Node[], edges: Edge[]): Blob {
  const json = serializeGraph(nodes, edges);
  return new Blob([json], { type: 'application/json' });
}

/**
 * Trigger a browser download of the graph as a `.json` file.
 */
export function downloadGraph(
  name: string,
  nodes: Node[],
  edges: Edge[],
): void {
  const blob = exportGraphFile(nodes, edges);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${name}.cyberweb.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
