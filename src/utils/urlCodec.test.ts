import { describe, it, expect } from 'vitest';
import { getAll, getMeta } from '@/adapter/OperationRegistry';
import { graphToCompactV2, compactV2ToGraph, decodeGraph } from './urlCodec';
import type { Node, Edge } from '@xyflow/react';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function makeInputNode(id: string, value = '', inputType = 'text', x = 250, y = 0): Node {
  return { id, type: 'input', position: { x, y }, data: { inputValue: value, inputType } };
}

function makeOpNode(id: string, opName: string, args: Record<string, any> = {}, x = 250, y = 160): Node {
  const meta = getMeta(opName);
  const fullArgs: Record<string, any> = {};
  if (meta) {
    for (const def of meta.args) fullArgs[def.name] = args[def.name] ?? def.value;
  }
  return {
    id, type: 'operation', position: { x, y },
    data: {
      operationName: opName, args: fullArgs,
      inputType: meta?.inputType ?? 'string',
      outputType: meta?.outputType ?? 'string',
    },
  };
}

function makeEdge(source: string, target: string): Edge {
  return { id: `e_${source}_${target}`, source, target, sourceHandle: 'output', targetHandle: 'input' };
}

/** Compare two graphs ignoring generated IDs */
function expectGraphEqual(
  actual: { nodes: Node[]; edges: Edge[] },
  expected: { nodes: Node[]; edges: Edge[] },
) {
  expect(actual.nodes.length).toBe(expected.nodes.length);
  for (let i = 0; i < expected.nodes.length; i++) {
    const a = actual.nodes[i];
    const e = expected.nodes[i];
    expect(a.type).toBe(e.type);
    expect(a.position).toEqual(e.position);
    // Compare data content (not reference)
    expect(a.data).toEqual(e.data);
  }

  expect(actual.edges.length).toBe(expected.edges.length);
  for (let i = 0; i < expected.edges.length; i++) {
    // Edges reference by index position since IDs change — check connectivity
    const aSourceIdx = actual.nodes.findIndex((n) => n.id === actual.edges[i].source);
    const aTargetIdx = actual.nodes.findIndex((n) => n.id === actual.edges[i].target);
    const eSourceIdx = expected.nodes.findIndex((n) => n.id === expected.edges[i].source);
    const eTargetIdx = expected.nodes.findIndex((n) => n.id === expected.edges[i].target);
    expect(aSourceIdx).toBe(eSourceIdx);
    expect(aTargetIdx).toBe(eTargetIdx);
  }
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe('urlCodec', () => {

  describe('graphToCompactV2 / compactV2ToGraph roundtrip', () => {

    it('roundtrips an empty input node', () => {
      const nodes = [makeInputNode('n1')];
      const edges: Edge[] = [];

      const compact = graphToCompactV2(nodes, edges);
      const result = compactV2ToGraph(compact);
      expectGraphEqual(result, { nodes, edges });
    });

    it('roundtrips input node with value', () => {
      const nodes = [makeInputNode('n1', 'hello world')];
      const edges: Edge[] = [];

      const compact = graphToCompactV2(nodes, edges);
      expect(compact[1][0]).toEqual(['i', 250, 0, 'hello world']);

      const result = compactV2ToGraph(compact);
      expectGraphEqual(result, { nodes, edges });
    });

    it('roundtrips input node with non-default format', () => {
      const nodes = [makeInputNode('n1', 'deadbeef', 'Hex')];
      const edges: Edge[] = [];

      const compact = graphToCompactV2(nodes, edges);
      expect(compact[1][0]).toEqual(['i', 250, 0, 'deadbeef', 'Hex']);

      const result = compactV2ToGraph(compact);
      expectGraphEqual(result, { nodes, edges });
    });

    it('roundtrips a simple linear chain', () => {
      const nodes = [
        makeInputNode('n1', 'test'),
        makeOpNode('n2', 'To Base64'),
      ];
      const edges = [makeEdge('n1', 'n2')];

      const compact = graphToCompactV2(nodes, edges);
      // opDict should contain "To Base64"
      expect(compact[0]).toEqual(['To Base64']);
      // edges should use numeric indices
      expect(compact[2]).toEqual([[0, 1]]);

      const result = compactV2ToGraph(compact);
      expectGraphEqual(result, { nodes, edges });
    });

    it('roundtrips multi-operation chain', () => {
      const nodes = [
        makeInputNode('n1', 'abc123'),
        makeOpNode('n2', 'To Hex', {}, 250, 160),
        makeOpNode('n3', 'To Base64', {}, 250, 320),
      ];
      const edges = [makeEdge('n1', 'n2'), makeEdge('n2', 'n3')];

      const compact = graphToCompactV2(nodes, edges);
      expect(compact[0]).toContain('To Hex');
      expect(compact[0]).toContain('To Base64');

      const result = compactV2ToGraph(compact);
      expectGraphEqual(result, { nodes, edges });
    });

    it('roundtrips multi-input graph', () => {
      const nodes = [
        makeInputNode('i1', 'hello', 'text', 100, 0),
        makeInputNode('i2', 'world', 'text', 400, 0),
        makeOpNode('op1', 'To Base64', {}, 250, 160),
      ];
      const edges = [makeEdge('i1', 'op1'), makeEdge('i2', 'op1')];

      const compact = graphToCompactV2(nodes, edges);
      const result = compactV2ToGraph(compact);
      expectGraphEqual(result, { nodes, edges });
    });

    it('decodes legacy output node', () => {
      // Output nodes are no longer created, but old URLs may contain them
      const compact = [[], [['i', 250, 0], ['o', 250, 160]], [[0, 1]]];
      const result = compactV2ToGraph(compact);
      expect(result.nodes[1].type).toBe('output');
      expect(result.nodes[1].position).toEqual({ x: 250, y: 160 });
    });

    it('roundtrips note node', () => {
      const nodes: Node[] = [
        makeInputNode('n1'),
        { id: 'n2', type: 'note', position: { x: 500, y: 100 }, data: { text: 'remember this' } },
      ];
      const edges: Edge[] = [];

      const compact = graphToCompactV2(nodes, edges);
      expect(compact[1][1]).toEqual(['n', 500, 100, 'remember this']);

      const result = compactV2ToGraph(compact);
      expectGraphEqual(result, { nodes, edges });
    });

    it('dedupes operation names in the dictionary', () => {
      const nodes = [
        makeInputNode('n1'),
        makeOpNode('n2', 'To Base64', {}, 250, 160),
        makeOpNode('n3', 'To Hex', {}, 250, 320),
        makeOpNode('n4', 'To Base64', {}, 250, 480),
      ];
      const edges = [makeEdge('n1', 'n2'), makeEdge('n2', 'n3'), makeEdge('n3', 'n4')];

      const compact = graphToCompactV2(nodes, edges);
      // "To Base64" should appear once
      expect(compact[0].filter((n: string) => n === 'To Base64').length).toBe(1);
      // Both To Base64 nodes should reference the same dict index
      const b64Idx = compact[0].indexOf('To Base64');
      expect(compact[1][1][0]).toBe(b64Idx);
      expect(compact[1][3][0]).toBe(b64Idx);
    });
  });

  describe('default arg trimming', () => {
    it('omits args when all are defaults', () => {
      const nodes = [makeOpNode('n1', 'To Base64')];
      const compact = graphToCompactV2(nodes, []);
      // Operation node should be [opIdx, x, y] without 4th element
      expect(compact[1][0].length).toBe(3);
    });

    it('includes non-default args', () => {
      const meta = getMeta('To Hex');
      if (!meta || meta.args.length === 0) return; // skip if no args

      const nonDefault: Record<string, any> = {};
      nonDefault[meta.args[0].name] = '__CUSTOM__';

      const nodes = [makeOpNode('n1', 'To Hex', nonDefault)];
      const compact = graphToCompactV2(nodes, []);
      // Should have 4th element (args array)
      expect(compact[1][0].length).toBe(4);
      expect(compact[1][0][3][0]).toBe('__CUSTOM__');
    });

    it('trims trailing default args but keeps leading non-defaults', () => {
      const meta = getMeta('To Hex');
      if (!meta || meta.args.length < 2) return;

      // Set only the first arg to non-default
      const args: Record<string, any> = {};
      args[meta.args[0].name] = 'CHANGED';

      const nodes = [makeOpNode('n1', 'To Hex', args)];
      const compact = graphToCompactV2(nodes, []);
      // Args array should only have 1 element (trailing defaults trimmed)
      expect(compact[1][0][3].length).toBe(1);
      expect(compact[1][0][3][0]).toBe('CHANGED');
    });
  });

  describe('JSON roundtrip (serialize + parse)', () => {
    it('survives JSON.stringify → JSON.parse', () => {
      const nodes = [
        makeInputNode('n1', 'hello'),
        makeOpNode('n2', 'To Base64', {}, 250, 160),
        makeOpNode('n3', 'From Base64', {}, 250, 320),
      ];
      const edges = [makeEdge('n1', 'n2'), makeEdge('n2', 'n3')];

      const compact = graphToCompactV2(nodes, edges);
      const json = JSON.stringify(compact);
      const parsed = JSON.parse(json);
      const result = compactV2ToGraph(parsed);

      expectGraphEqual(result, { nodes, edges });
    });
  });

  describe('decodeGraph format detection', () => {
    it('detects v2 format (3-element array with string dict)', () => {
      const nodes = [makeInputNode('n1', 'test'), makeOpNode('n2', 'To Hex')];
      const edges = [makeEdge('n1', 'n2')];
      const compact = graphToCompactV2(nodes, edges);

      const result = decodeGraph(compact);
      expect(result).not.toBeNull();
      expect(result!.nodes.length).toBe(2);
    });

    it('detects v1 format (2-element array)', () => {
      const v1 = [
        [['n1', 'i', 250, 0, { v: 'test', it: 'text' }]],
        [],
      ];
      const result = decodeGraph(v1);
      expect(result).not.toBeNull();
      expect(result!.nodes[0].type).toBe('input');
      expect(result!.nodes[0].data.inputValue).toBe('test');
    });

    it('detects legacy keyed format', () => {
      const legacy = {
        n: [{ i: 'n1', t: 'input', x: 250, y: 0, d: { inputValue: 'hello', inputType: 'text' } }],
        e: [],
      };
      const result = decodeGraph(legacy);
      expect(result).not.toBeNull();
      expect(result!.nodes[0].type).toBe('input');
    });

    it('returns null for unrecognized format', () => {
      expect(decodeGraph('garbage')).toBeNull();
      expect(decodeGraph(42)).toBeNull();
      expect(decodeGraph(null)).toBeNull();
    });
  });

  describe('all operations roundtrip', () => {
    const allOps = getAll();

    it(`loaded ${allOps.length} operations`, () => {
      expect(allOps.length).toBeGreaterThan(400);
    });

    // Test every single operation roundtrips through v2 encode/decode
    for (const meta of allOps) {
      it(`roundtrips "${meta.name}" with default args`, () => {
        // Build args the same way the app does (keyed by name).
        // Duplicate arg names (e.g. SHA2 has two "Rounds") collapse to last value.
        const argValues: Record<string, any> = {};
        for (const def of meta.args) argValues[def.name] = def.value;

        const opNode: Node = {
          id: 'op1', type: 'operation',
          position: { x: 200, y: 160 },
          data: {
            operationName: meta.name,
            args: argValues,
            inputType: meta.inputType,
            outputType: meta.outputType,
          },
        };

        const nodes = [makeInputNode('in1', 'test data'), opNode];
        const edges = [makeEdge('in1', 'op1')];

        const compact = graphToCompactV2(nodes, edges);
        const json = JSON.stringify(compact);
        const parsed = JSON.parse(json);
        const result = compactV2ToGraph(parsed);

        // Verify node count and types
        expect(result.nodes.length).toBe(2);
        expect(result.nodes[0].type).toBe('input');
        expect(result.nodes[1].type).toBe('operation');

        // Verify operation name survived
        expect(result.nodes[1].data.operationName).toBe(meta.name);

        // Verify edge connectivity
        expect(result.edges.length).toBe(1);
        expect(result.edges[0].source).toBe(result.nodes[0].id);
        expect(result.edges[0].target).toBe(result.nodes[1].id);

        // Verify args roundtrip: encode → decode should produce identical keyed args.
        // We compare against what a second encode→decode would produce (idempotent),
        // not raw meta defaults (which can have duplicate names that collapse).
        const result2 = compactV2ToGraph(JSON.parse(JSON.stringify(
          graphToCompactV2(result.nodes, result.edges),
        )));
        const args1 = result.nodes[1].data.args as Record<string, any>;
        const args2 = result2.nodes[1].data.args as Record<string, any>;
        expect(JSON.stringify(args1)).toBe(JSON.stringify(args2));
      });
    }
  });

  describe('compact size', () => {
    it('v2 is significantly smaller than naive JSON', () => {
      const nodes = [
        makeInputNode('node_Wf7S_ynQ', 'test input data'),
        makeOpNode('node_L9XiepKG', 'To Hex', {}, 160, 160),
        makeOpNode('node_ciE3EtOm', 'To Base64', {}, 176, 320),
        makeInputNode('node_SXzBDWez', 'second input', 'text', 496, 48),
      ];
      const edges = [makeEdge('node_Wf7S_ynQ', 'node_L9XiepKG'), makeEdge('node_L9XiepKG', 'node_ciE3EtOm')];

      const naive = JSON.stringify({ nodes, edges });
      const v2 = JSON.stringify(graphToCompactV2(nodes, edges));

      // v2 should be at least 50% smaller
      expect(v2.length).toBeLessThan(naive.length * 0.5);
    });
  });
});
