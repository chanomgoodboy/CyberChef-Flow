import React, { useState, useCallback } from 'react';
import { useGraphStore } from '@/store/graphStore';
import { recipeToGraph, type RecipeStep } from '@/utils/recipeConverter';

interface ImportRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportRecipeModal = React.memo(function ImportRecipeModal({
  isOpen,
  onClose,
}: ImportRecipeModalProps) {
  const [recipeJson, setRecipeJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const setNodes = useGraphStore((s) => s.setNodes);
  const setEdges = useGraphStore((s) => s.setEdges);

  const handleImport = useCallback(() => {
    setError(null);
    try {
      const parsed = JSON.parse(recipeJson);
      let recipe: RecipeStep[];

      if (Array.isArray(parsed)) {
        recipe = parsed;
      } else if (parsed.recipe && Array.isArray(parsed.recipe)) {
        recipe = parsed.recipe;
      } else {
        throw new Error('Expected an array of recipe steps or an object with a "recipe" array.');
      }

      const { nodes, edges } = recipeToGraph(recipe);
      setNodes(nodes);
      setEdges(edges);
      setRecipeJson('');
      onClose();
    } catch (e: any) {
      setError(e.message || 'Invalid JSON');
    }
  }, [recipeJson, setNodes, setEdges, onClose]);

  const handleClose = useCallback(() => {
    setError(null);
    setRecipeJson('');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Import CyberChef Recipe</h3>
          <button className="modal-close" onClick={handleClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Paste a CyberChef recipe JSON array below.
          </p>
          <textarea
            className="modal-textarea"
            value={recipeJson}
            onChange={(e) => setRecipeJson(e.target.value)}
            placeholder='[{"op":"To Base64","args":["A-Za-z0-9+/="]}]'
            rows={10}
          />
          {error && <p className="modal-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="modal-btn" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="modal-btn primary"
            onClick={handleImport}
            disabled={!recipeJson.trim()}
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
});
