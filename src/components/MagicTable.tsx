import React, { useCallback, useMemo } from 'react';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { getMeta } from '@/adapter/OperationRegistry';
import { createNodeId } from '@/utils/id';
import { buildDefaultArgs } from '@/utils/argDefaults';
import type { MagicSuggestion } from '@/engine/MagicEngine';

function entropyColor(val: number): string {
  if (val < 3) return 'var(--accent-green)';
  if (val < 5) return 'var(--accent-yellow)';
  return 'var(--accent-red)';
}

function formatRecipe(recipe: { op: string; args: any[] }[]): string {
  if (recipe.length === 0) return '(no recipe)';
  return recipe
    .map((step) => {
      const argsStr = step.args
        .map((a: any) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
        .join(',');
      return `${step.op}(${argsStr})`;
    })
    .join('\n');
}

interface MagicTableProps {
  /** The raw JSON displayValue from the magic node result */
  jsonValue: string;
  /** Node ID to insert recipe operations after */
  afterNodeId: string;
}

function MagicTableInner({ jsonValue, afterNodeId }: MagicTableProps) {
  const addNodeToChain = useGraphStore((s) => s.addNodeToChain);
  const setSelectedNode = useUIStore((s) => s.setSelectedNode);

  const suggestions: MagicSuggestion[] = useMemo(() => {
    if (!jsonValue) return [];
    try {
      const parsed = JSON.parse(jsonValue);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [jsonValue]);

  const handleLoadRecipe = useCallback(
    (recipe: { op: string; args: any[] }[]) => {
      if (recipe.length === 0) return;

      let afterId = afterNodeId;
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
          { afterNodeId: afterId },
        );
        afterId = newNodeId;
      }
      setSelectedNode(afterId);
    },
    [afterNodeId, addNodeToChain, setSelectedNode],
  );

  if (suggestions.length === 0) {
    return (
      <div className="magic-no-results">
        Nothing of interest could be detected about the input data.
        {'\n'}Have you tried modifying the operation arguments?
      </div>
    );
  }

  return (
    <div className="magic-table-wrap">
      <table className="magic-table">
        <thead>
          <tr>
            <th>Recipe (click to load)</th>
            <th>Result snippet</th>
            <th>Properties</th>
          </tr>
        </thead>
        <tbody>
          {suggestions.map((s, i) => {
            const recipeStr = formatRecipe(s.recipe);
            const matchingOpsStr = s.matchingOps.length
              ? [...new Set(s.matchingOps.map((o) => o.op))].join(', ')
              : '';

            return (
              <tr key={i} className="magic-table-row">
                <td className="magic-table-recipe">
                  {s.recipe.length > 0 ? (
                    <a
                      className="magic-recipe-link"
                      onClick={(e) => {
                        e.preventDefault();
                        handleLoadRecipe(s.recipe);
                      }}
                      title="Click to load this recipe"
                    >
                      {recipeStr}
                    </a>
                  ) : (
                    <span className="magic-recipe-empty">(identity)</span>
                  )}
                </td>
                <td className="magic-table-data">{s.data || '\u2026'}</td>
                <td className="magic-table-props">
                  {matchingOpsStr && (
                    <div className="magic-prop">Matching ops: {matchingOpsStr}</div>
                  )}
                  {s.fileType && (
                    <div className="magic-prop">
                      File type: {s.fileType.mime} ({s.fileType.ext})
                    </div>
                  )}
                  {s.useful && (
                    <div className="magic-prop">Useful op detected</div>
                  )}
                  {s.isUTF8 && (
                    <div className="magic-prop">Valid UTF8</div>
                  )}
                  <div className="magic-prop">
                    Entropy:{' '}
                    <span style={{ color: entropyColor(s.entropy) }}>
                      {s.entropy.toFixed(2)}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export const MagicTable = React.memo(MagicTableInner);
