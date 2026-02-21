import React, { useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useExecutionStore } from '@/store/executionStore';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { getMeta } from '@/adapter/OperationRegistry';
import { createNodeId } from '@/utils/id';
import { buildDefaultArgs } from '@/utils/argDefaults';
import { MagicTable } from '@/components/MagicTable';
import type { MagicHintSuggestion, MagicHint } from '@/engine/MagicEngine';
import { isCribOp } from '@/engine/cribOps';

interface MagicBadgeProps {
  nodeId: string;
}

function entropyColor(entropy: number): string {
  if (entropy < 3) return 'var(--accent-green)';
  if (entropy < 5) return 'var(--accent-yellow)';
  return 'var(--accent-red)';
}

function filterSuggestions(hint: MagicHint): MagicHintSuggestion[] {
  return hint.suggestions.filter(
    (s) => s.recipe.length > 0 && (s.entropy < 7 || hint.fileType !== null),
  );
}

/* ------------------------------------------------------------------ */
/*  Full results modal                                                 */
/* ------------------------------------------------------------------ */

function MagicModal({
  nodeId,
  hint,
  onApply,
  onClose,
}: {
  nodeId: string;
  hint: MagicHint;
  onApply: (e: React.MouseEvent, s: MagicHintSuggestion) => void;
  onClose: () => void;
}) {
  const suggestions = filterSuggestions(hint);
  const [crib, setCrib] = useState('');
  const [deepRunning, setDeepRunning] = useState(false);
  const [deepJson, setDeepJson] = useState<string | null>(null);
  const [deepError, setDeepError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const handleDeepAnalysis = useCallback(async () => {
    setDeepRunning(true);
    setDeepError(null);
    setDeepJson(null);
    abortRef.current = false;

    try {
      const result = useExecutionStore.getState().results.get(nodeId);
      if (!result || !result.output) {
        setDeepError('No output data available for this node');
        setDeepRunning(false);
        return;
      }

      const [magicEngine, dishBridge, dishMod] = await Promise.all([
        import('@/engine/MagicEngine'),
        import('@/adapter/DishBridge'),
        import('@cyberchef/Dish.mjs'),
      ]);
      const Dish = dishMod.default;

      const dish = dishBridge.dishFromTransferable(result.output as any);
      const buf: ArrayBuffer = await Promise.resolve(dish.get(Dish.ARRAY_BUFFER));

      if (abortRef.current) return;

      const results = await magicEngine.runMagic(buf, 5, true, true, crib);

      if (abortRef.current) return;

      setDeepJson(JSON.stringify(results.slice(0, 20)));
    } catch (err) {
      if (!abortRef.current) {
        setDeepError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (!abortRef.current) setDeepRunning(false);
    }
  }, [nodeId, crib]);

  const handleClose = useCallback(() => {
    abortRef.current = true;
    onClose();
  }, [onClose]);

  return createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content"
        style={{ width: 640, maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">Magic Analysis</h3>
          <button className="modal-close" onClick={handleClose}>&times;</button>
        </div>
        <div className="modal-body">
          {/* Deep analysis controls */}
          <div className="magic-modal-controls">
            <label className="magic-modal-crib-label">
              <span>Crib</span>
              <input
                type="text"
                className="modal-input"
                value={crib}
                onChange={(e) => setCrib(e.target.value)}
                placeholder="regex to match expected plaintext..."
              />
            </label>
            <button
              className="modal-btn primary"
              onClick={handleDeepAnalysis}
              disabled={deepRunning}
            >
              {deepRunning ? 'Analysing...' : 'Deep Analysis'}
            </button>
          </div>

          {deepError && <p className="modal-error">{deepError}</p>}

          {/* Deep results table */}
          {deepJson && (
            <>
              <p className="modal-description" style={{ marginTop: 8 }}>
                Deep analysis results (depth=5, intensive):
              </p>
              <MagicTable jsonValue={deepJson} afterNodeId={nodeId} />
            </>
          )}

          {/* Quick results (shown when no deep results yet) */}
          {!deepJson && (
            <>
              {hint.fileType && (
                <p className="modal-description">
                  Detected file type: {hint.fileType.mime} (.{hint.fileType.ext})
                </p>
              )}
              {suggestions.length === 0 ? (
                <p className="modal-description">No quick suggestions available. Try Deep Analysis.</p>
              ) : (
                <div className="magic-modal-list">
                  {suggestions.map((s, i) => {
                    const recipePath = s.recipe.map((r) => r.op).join(' \u203a ');
                    return (
                      <div
                        key={i}
                        className="magic-modal-row"
                        onClick={(e) => { onApply(e, s); handleClose(); }}
                        title={`Click to add: ${recipePath}`}
                      >
                        <span
                          className="magic-badge-entropy"
                          style={{ color: entropyColor(s.entropy) }}
                        >
                          {s.entropy.toFixed(2)}
                        </span>
                        <span className="magic-badge-recipe">{recipePath}</span>
                        {s.recipe.length > 0 && isCribOp(s.recipe[0].op) && (
                          <span className="magic-badge-key">KEY</span>
                        )}
                        <span className="magic-badge-arrow">{'\u2192'}</span>
                        <span className="magic-badge-preview">
                          {s.preview || '\u2026'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="modal-btn" onClick={handleClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/*  Badge (shows best result + "more" button)                          */
/* ------------------------------------------------------------------ */

function MagicBadgeInner({ nodeId }: MagicBadgeProps) {
  const hint = useExecutionStore(
    (s) => s.magicHints.get(nodeId),
  );

  const addNodeToChain = useGraphStore((s) => s.addNodeToChain);
  const setSelectedNode = useUIStore((s) => s.setSelectedNode);
  const [modalOpen, setModalOpen] = useState(false);

  const handleApplySuggestion = useCallback(
    (e: React.MouseEvent, suggestion: MagicHintSuggestion) => {
      e.stopPropagation();
      if (suggestion.recipe.length === 0) return;

      let afterId = nodeId;
      for (const step of suggestion.recipe) {
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
    [nodeId, addNodeToChain, setSelectedNode],
  );

  if (!hint) return null;

  const goodSuggestions = filterSuggestions(hint);
  if (goodSuggestions.length === 0) return null;

  const best = goodSuggestions[0];
  const bestRecipe = best.recipe.map((r) => r.op).join(' \u203a ');

  return (
    <div className="magic-badge" title="Magic analysis">
      <div className="magic-badge-suggestions">
        <div
          className="magic-badge-suggestion magic-badge-clickable"
          onClick={(e) => handleApplySuggestion(e, best)}
          title={`Click to add: ${bestRecipe}`}
        >
          <span
            className="magic-badge-entropy"
            style={{ color: entropyColor(best.entropy) }}
          >
            {best.entropy.toFixed(2)}
          </span>
          <span className="magic-badge-recipe">{bestRecipe}</span>
          {best.recipe.length > 0 && isCribOp(best.recipe[0].op) && (
            <span className="magic-badge-key">KEY</span>
          )}
          <span className="magic-badge-arrow">{'\u2192'}</span>
          <span className="magic-badge-preview">
            {best.preview || '\u2026'}
          </span>
          <button
            className="magic-badge-more"
            onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}
            title="View all suggestions & deep analysis"
          >
            {goodSuggestions.length > 1 ? `+${goodSuggestions.length - 1} more` : 'more'}
          </button>
        </div>
      </div>
      {modalOpen && (
        <MagicModal
          nodeId={nodeId}
          hint={hint}
          onApply={handleApplySuggestion}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

export const MagicBadge = React.memo(MagicBadgeInner);
