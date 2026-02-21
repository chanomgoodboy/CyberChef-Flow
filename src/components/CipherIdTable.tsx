import React, { useCallback, useMemo } from 'react';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { getMeta } from '@/adapter/OperationRegistry';
import { createNodeId } from '@/utils/id';
import { buildDefaultArgs } from '@/utils/argDefaults';
import type { CipherMatch } from '@/custom-ops/_lib/cipherIdentifier';

interface CipherIdTableProps {
  jsonValue: string;
  afterNodeId: string;
}

function scoreBar(score: number): string {
  const filled = Math.round(score / 5);
  return '\u2588'.repeat(filled) + '\u2591'.repeat(20 - filled);
}

function CipherIdTableInner({ jsonValue, afterNodeId }: CipherIdTableProps) {
  const addNodeToChain = useGraphStore((s) => s.addNodeToChain);
  const setSelectedNode = useUIStore((s) => s.setSelectedNode);

  const results: CipherMatch[] = useMemo(() => {
    if (!jsonValue) return [];
    try {
      let parsed = JSON.parse(jsonValue);
      // Handle double-serialization: if Dish.JSON wraps an already-stringified
      // value, the first parse yields a string instead of an array.
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [jsonValue]);

  const handleLoadRecipe = useCallback(
    (recipe: { op: string; args: any[] }[]) => {
      if (recipe.length === 0) return;

      let afterId = afterNodeId;
      let isFirst = true;
      for (const step of recipe) {
        const meta = getMeta(step.op);
        if (!meta) continue;

        const newNodeId = createNodeId();
        const argValues = buildDefaultArgs(step.op, step.args);

        addNodeToChain(
          {
            id: newNodeId,
            type: 'operation',
            position: { x: 0, y: 0 },
            data: {
              operationName: step.op,
              args: argValues,
              inputType: meta.inputType ?? 'string',
              outputType: meta.outputType ?? 'string',
            },
          },
          { afterNodeId: afterId, branch: isFirst },
        );
        isFirst = false;
        afterId = newNodeId;
      }
      setSelectedNode(afterId);
    },
    [afterNodeId, addNodeToChain, setSelectedNode],
  );

  if (results.length === 0) {
    return (
      <div className="cipher-id-no-results">
        No ciphers or encodings identified with sufficient confidence.
      </div>
    );
  }

  return (
    <div className="cipher-id-table-wrap">
      <table className="cipher-id-table">
        <thead>
          <tr>
            <th className="cipher-id-col-rank">#</th>
            <th className="cipher-id-col-name">Name</th>
            <th className="cipher-id-col-score">Score</th>
            <th className="cipher-id-col-cat">Category</th>
            <th className="cipher-id-col-desc">Details</th>
          </tr>
        </thead>
        <tbody>
          {results.map((m, i) => {
            const hasRecipe = m.recipe && m.recipe.length > 0;
            const preview = m.reversed
              ? m.reversed.length > 80 ? m.reversed.slice(0, 80) + '\u2026' : m.reversed
              : null;

            return (
              <tr
                key={i}
                className={`cipher-id-row${hasRecipe ? ' cipher-id-clickable' : ' cipher-id-dimmed'}`}
                onClick={hasRecipe ? () => handleLoadRecipe(m.recipe!) : undefined}
                title={hasRecipe ? `Click to add ${m.recipe!.map((s) => s.op).join(' + ')}` : 'No matching operation available'}
              >
                <td className="cipher-id-cell-rank">{i + 1}</td>
                <td className="cipher-id-cell-name">
                  {hasRecipe ? (
                    <a className="cipher-id-link">{m.name}</a>
                  ) : (
                    m.name
                  )}
                </td>
                <td className="cipher-id-cell-score">
                  <span className="cipher-id-bar">{scoreBar(m.score)}</span>
                  <span className="cipher-id-pct">{m.score}%</span>
                </td>
                <td className="cipher-id-cell-cat">{m.category}</td>
                <td className="cipher-id-cell-desc">
                  <div>{m.description}</div>
                  {preview && (
                    <div className="cipher-id-preview">{preview}</div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export const CipherIdTable = React.memo(CipherIdTableInner);
