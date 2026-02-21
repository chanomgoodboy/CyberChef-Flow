import { describe, it, expect } from 'vitest';
import { execute } from './GraphEngine';
import type { Node, Edge } from '@xyflow/react';

describe('Regular expression with quantifier', () => {
  it('should match base64-like patterns', async () => {
    const b64 = 'A'.repeat(120); // 120 chars of base64-like content
    const input = `some text ${b64} more text`;

    const nodes: Node[] = [
      { id: 'input1', type: 'input', position: { x: 0, y: 0 }, data: { inputValue: input, inputType: 'text' } },
      { id: 'regex1', type: 'operation', position: { x: 0, y: 120 }, data: {
        operationName: 'Regular expression',
        args: {
          'Built in regexes': 'User defined',
          'Regex': '[a-zA-Z0-9\\=\\+/]{100,}',
          'Case insensitive': false,
          '^ and $ match at newlines': true,
          'Dot matches all': false,
          'Unicode support': false,
          'Astral support': false,
          'Display total': false,
          'Output format': 'List matches'
        },
        inputType: 'string', outputType: 'html'
      }}
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'input1', target: 'regex1', sourceHandle: 'output', targetHandle: 'input' },
    ];

    const result = await execute(nodes, edges);
    if ('type' in result) throw new Error('Cycle');

    const r = result.get('regex1');
    console.log('status:', r?.status);
    console.log('display:', r?.displayValue?.slice(0, 200));
    console.log('error:', r?.error);
    expect(r?.status).toBe('success');
  });
});
