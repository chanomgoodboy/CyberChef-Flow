import React, { useState, useCallback, useMemo } from 'react';
import { useGraphStore } from '@/store/graphStore';
import { graphToRecipe } from '@/utils/recipeConverter';
import { copyToClipboard } from '@/utils/clipboard';

interface ExportRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportRecipeModal = React.memo(function ExportRecipeModal({
  isOpen,
  onClose,
}: ExportRecipeModalProps) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const [copied, setCopied] = useState(false);

  const recipe = useMemo(() => {
    if (!isOpen) return [];
    return graphToRecipe(nodes, edges);
  }, [isOpen, nodes, edges]);

  const recipeJson = useMemo(() => {
    return JSON.stringify(recipe, null, 2);
  }, [recipe]);

  const handleCopy = useCallback(() => {
    copyToClipboard(recipeJson).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [recipeJson]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([recipeJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'recipe.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [recipeJson]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Export CyberChef Recipe</h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            {recipe.length === 0
              ? 'No operation nodes found in the graph.'
              : `Exported ${recipe.length} operation(s).`}
          </p>
          <textarea
            className="modal-textarea"
            value={recipeJson}
            readOnly
            rows={12}
          />
        </div>

        <div className="modal-footer">
          <button className="modal-btn" onClick={onClose}>
            Close
          </button>
          <button
            className="modal-btn"
            onClick={handleCopy}
            disabled={recipe.length === 0}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            className="modal-btn primary"
            onClick={handleDownload}
            disabled={recipe.length === 0}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
});
