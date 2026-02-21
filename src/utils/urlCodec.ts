import type { Node, Edge } from '@xyflow/react';
import { getMeta } from '@/adapter/OperationRegistry';
import { createNodeId, createEdgeId } from '@/utils/id';

/* ------------------------------------------------------------------ */
/*  v2 compact format                                                  */
/*  [opDict[], nodes[], edges[]]                                       */
/*                                                                     */
/*  opDict: ["To Hex","To Base64",...]  (deduped operation names)      */
/*  node:   type-dependent tuple, node index = position in array       */
/*    input:     ["i", x, y, value?, inputFormat?]                     */
/*    operation: [opIdx, x, y, [nonDefaultArgs]?]                      */
/*    output:    ["o", x, y]  (legacy, decoded only)                    */
/*    note:      ["n", x, y, text]                                     */
/*  edge:   [srcIdx, tgtIdx]  (handles always output→input)            */
/* ------------------------------------------------------------------ */

export function graphToCompactV2(nodes: Node[], edges: Edge[]): any[] {
  const opNames: string[] = [];
  const opIdx = new Map<string, number>();
  for (const n of nodes) {
    if (n.type === 'operation') {
      const name = (n.data as any).operationName ?? '';
      if (!opIdx.has(name)) { opIdx.set(name, opNames.length); opNames.push(name); }
    }
  }

  const idToIdx = new Map<string, number>();
  nodes.forEach((n, i) => idToIdx.set(n.id, i));

  const cNodes = nodes.map((n) => {
    const x = Math.round(n.position.x);
    const y = Math.round(n.position.y);
    const d = n.data as Record<string, any>;

    if (n.type === 'input') {
      const val = d.inputValue ?? '';
      const fmt = d.inputType ?? 'text';
      if (fmt !== 'text') return ['i', x, y, val, fmt];
      if (val) return ['i', x, y, val];
      return ['i', x, y];
    }

    if (n.type === 'operation') {
      const name = d.operationName ?? '';
      const oi = opIdx.get(name) ?? 0;
      const meta = getMeta(name);
      const args = d.args ?? {};

      if (meta && meta.args.length > 0) {
        const pos = meta.args.map((def) => args[def.name] ?? def.value);
        while (pos.length > 0) {
          const last = pos[pos.length - 1];
          const def = meta.args[pos.length - 1].value;
          if (last === def || JSON.stringify(last) === JSON.stringify(def)) pos.pop();
          else break;
        }
        if (pos.length > 0) return [oi, x, y, pos];
      }
      return [oi, x, y];
    }

    if (n.type === 'note') return ['n', x, y, d.text ?? ''];
    return [n.type ?? 'd', x, y, d];
  });

  const cEdges = edges.map((e) => [idToIdx.get(e.source) ?? 0, idToIdx.get(e.target) ?? 0]);

  return [opNames, cNodes, cEdges];
}

export function compactV2ToGraph(data: any[]): { nodes: Node[]; edges: Edge[] } {
  const [opNames, cNodes, cEdges] = data;
  const nodeIds = (cNodes as any[]).map(() => createNodeId());

  const nodes: Node[] = (cNodes as any[]).map((cn: any[], i: number) => {
    const first = cn[0];

    if (first === 'i') {
      return {
        id: nodeIds[i], type: 'input',
        position: { x: cn[1], y: cn[2] },
        data: { inputValue: cn[3] ?? '', inputType: cn[4] ?? 'text' },
      };
    }
    if (first === 'o') {
      return {
        id: nodeIds[i], type: 'output',
        position: { x: cn[1], y: cn[2] },
        data: { viewMode: 'text' },
      };
    }
    if (first === 'n') {
      return {
        id: nodeIds[i], type: 'note',
        position: { x: cn[1], y: cn[2] },
        data: { text: cn[3] ?? '' },
      };
    }
    if (typeof first === 'number') {
      const opName = opNames[first] ?? '';
      const meta = getMeta(opName);
      const posArgs: any[] = cn[3] ?? [];
      const argValues: Record<string, any> = {};
      if (meta) {
        meta.args.forEach((def, j) => {
          argValues[def.name] = j < posArgs.length ? posArgs[j] : def.value;
        });
      }
      return {
        id: nodeIds[i], type: 'operation',
        position: { x: cn[1], y: cn[2] },
        data: {
          operationName: opName, args: argValues,
          inputType: meta?.inputType ?? 'string',
          outputType: meta?.outputType ?? 'string',
        },
      };
    }
    return { id: nodeIds[i], type: first, position: { x: cn[1], y: cn[2] }, data: cn[3] ?? {} };
  });

  const edges: Edge[] = (cEdges as number[][]).map((ce) => ({
    id: createEdgeId(),
    source: nodeIds[ce[0]], target: nodeIds[ce[1]],
    sourceHandle: 'output', targetHandle: 'input',
  }));

  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/*  v1 backward compat (2-element array and keyed object formats)      */
/* ------------------------------------------------------------------ */

const SHORT_TO_TYPE: Record<string, string> = { i: 'input', op: 'operation', o: 'output', n: 'note', d: 'default' };
const SHORT_TO_HANDLE: Record<string, string> = { o: 'output', i: 'input' };
const SHORT_TO_DATA_KEY: Record<string, string> = {
  op: 'operationName', v: 'inputValue', it: 'inputType',
  ot: 'outputType', a: 'args', vm: 'viewMode', t: 'text',
};

function expandData(d: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(d)) out[SHORT_TO_DATA_KEY[k] ?? k] = v;
  return out;
}

function compactV1ToGraph(compact: [any[], any[]]): { nodes: Node[]; edges: Edge[] } {
  const [cNodes, cEdges] = compact;
  let edgeIdx = 0;
  return {
    nodes: cNodes.map((cn: any) => ({
      id: cn[0], type: SHORT_TO_TYPE[cn[1]] ?? cn[1],
      position: { x: cn[2], y: cn[3] }, data: expandData(cn[4]),
    })),
    edges: cEdges.map((ce: any) => ({
      id: `e_${edgeIdx++}`, source: ce[0], target: ce[1],
      sourceHandle: SHORT_TO_HANDLE[ce[2]] ?? ce[2] ?? null,
      targetHandle: SHORT_TO_HANDLE[ce[3]] ?? ce[3] ?? null,
    })),
  };
}

function legacyKeyedToGraph(obj: any): { nodes: Node[]; edges: Edge[] } | null {
  if (!obj || !Array.isArray(obj.n)) return null;
  let edgeIdx = 0;
  return {
    nodes: obj.n.map((cn: any) => ({
      id: cn.i, type: cn.t, position: { x: cn.x, y: cn.y }, data: cn.d,
    })),
    edges: (obj.e ?? []).map((ce: any) => ({
      id: `e_${edgeIdx++}`, source: ce.s, target: ce.t,
      sourceHandle: ce.sh ?? null, targetHandle: ce.th ?? null,
    })),
  };
}

/** Detect format and decode any known compact representation */
export function decodeGraph(parsed: any): { nodes: Node[]; edges: Edge[] } | null {
  if (!Array.isArray(parsed)) return legacyKeyedToGraph(parsed);
  if (parsed.length === 3 && Array.isArray(parsed[0]) && (parsed[0].length === 0 || typeof parsed[0][0] === 'string'))
    return compactV2ToGraph(parsed);
  if (parsed.length === 2) return compactV1ToGraph(parsed as [any[], any[]]);
  return null;
}
