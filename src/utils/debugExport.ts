/**
 * Debug Export — compact LLM-friendly dump of graph state.
 * One line per node, minimal tokens.
 */

import type { Node, Edge } from '@xyflow/react';
import type { NodeResult } from '@/store/executionStore';

const MAX = 200;
const t = (s: string) => (s.length <= MAX ? s : s.slice(0, MAX) + `…(${s.length})`);

function topoSort(nodes: Node[], edges: Edge[]): string[] {
  const adj = new Map<string, string[]>();
  const deg = new Map<string, number>();
  for (const n of nodes) { adj.set(n.id, []); deg.set(n.id, 0); }
  for (const e of edges) {
    adj.get(e.source)?.push(e.target);
    deg.set(e.target, (deg.get(e.target) ?? 0) + 1);
  }
  const q: string[] = [];
  for (const [id, d] of deg) if (d === 0) q.push(id);
  const out: string[] = [];
  while (q.length) {
    const id = q.shift()!;
    out.push(id);
    for (const nx of adj.get(id) ?? []) {
      const d = (deg.get(nx) ?? 1) - 1;
      deg.set(nx, d);
      if (d === 0) q.push(nx);
    }
  }
  for (const n of nodes) if (!out.includes(n.id)) out.push(n.id);
  return out;
}

export function buildDebugDump(
  nodes: Node[],
  edges: Edge[],
  results: Map<string, NodeResult>,
): string {
  const order = topoSort(nodes, edges);
  const nm = new Map(nodes.map((n) => [n.id, n]));
  const parents = new Map<string, string[]>();
  for (const e of edges) {
    if (!parents.has(e.target)) parents.set(e.target, []);
    parents.get(e.target)!.push(e.source);
  }

  const lines: string[] = [];

  // Topology as chain
  if (edges.length) {
    const chains = edges.map((e) => `${label(nm.get(e.source))}→${label(nm.get(e.target))}`);
    lines.push(`Flow: ${chains.join(' | ')}`);
    lines.push('');
  }

  for (const id of order) {
    const n = nm.get(id);
    if (!n) continue;
    const d = (n.data ?? {}) as Record<string, unknown>;
    const r = results.get(id);
    const parts: string[] = [];

    if (n.type === 'input') {
      const v = (d.inputValue as string) ?? '';
      parts.push(`INPUT ${id}: ${t(JSON.stringify(v))}`);
    } else if (n.type === 'operation') {
      const op = (d.operationName as string) ?? '?';
      const args = d.args;
      const argsStr = args && Array.isArray(args) && args.length ? ` args=${JSON.stringify(args)}` : '';
      const src = parents.get(id);
      const from = src?.length ? ` from=[${src.join(',')}]` : '';
      parts.push(`OP ${id} "${op}"${argsStr}${from}`);
    } else if (n.type === 'note') {
      parts.push(`NOTE ${id}: ${t(JSON.stringify((d.text as string) ?? ''))}`);
      continue; // notes have no execution
    } else if (n.type === 'magic') {
      parts.push(`MAGIC ${id}`);
    } else {
      parts.push(`${(n.type ?? '?').toUpperCase()} ${id}`);
    }

    if (r) {
      const st = r.error ? `err="${r.error}"` : r.status;
      const dur = r.duration ? ` ${r.duration}ms` : '';
      const out = r.displayValue ? ` out=${t(JSON.stringify(r.displayValue))}` : '';
      const fork = r.forkResults?.length
        ? ` fork=${r.forkResults.length}pcs`
        : '';
      parts.push(`→ ${st}${dur}${out}${fork}`);
    }

    lines.push(parts.join(' '));
  }

  return lines.join('\n');
}

function label(n: Node | undefined): string {
  if (!n) return '?';
  const d = (n.data ?? {}) as Record<string, unknown>;
  if (n.type === 'operation') return (d.operationName as string) ?? n.id;
  if (n.type === 'input') return 'Input';
  if (n.type === 'magic') return 'Magic';
  return n.type ?? n.id;
}

export async function copyDebugDump(
  nodes: Node[],
  edges: Edge[],
  results: Map<string, NodeResult>,
): Promise<string> {
  const dump = buildDebugDump(nodes, edges, results);
  try {
    await navigator.clipboard.writeText(dump);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = dump;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  return dump;
}
