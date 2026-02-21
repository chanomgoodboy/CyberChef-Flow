import React, { useState, useEffect, useCallback } from 'react';
import { useGraphStore } from '@/store/graphStore';
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  listSavedGraphs,
  deleteSavedGraph,
} from '@/utils/graphSerializer';

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SaveLoadModal = React.memo(function SaveLoadModal({
  isOpen,
  onClose,
}: SaveLoadModalProps) {
  const [savedNames, setSavedNames] = useState<string[]>([]);
  const [saveName, setSaveName] = useState('');
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const setNodes = useGraphStore((s) => s.setNodes);
  const setEdges = useGraphStore((s) => s.setEdges);

  useEffect(() => {
    if (isOpen) {
      setSavedNames(listSavedGraphs());
    }
  }, [isOpen]);

  const handleSave = useCallback(() => {
    const name = saveName.trim();
    if (!name) return;
    saveToLocalStorage(name, nodes, edges);
    setSavedNames(listSavedGraphs());
    setSaveName('');
  }, [saveName, nodes, edges]);

  const handleLoad = useCallback(
    (name: string) => {
      const data = loadFromLocalStorage(name);
      if (data) {
        setNodes(data.nodes);
        setEdges(data.edges);
        onClose();
      }
    },
    [setNodes, setEdges, onClose],
  );

  const handleDelete = useCallback(
    (name: string) => {
      if (window.confirm(`Delete saved graph "${name}"?`)) {
        deleteSavedGraph(name);
        setSavedNames(listSavedGraphs());
      }
    },
    [],
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Save / Load Graph</h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="modal-body">
          <div className="save-section">
            <div className="save-row">
              <input
                type="text"
                className="modal-input"
                placeholder="Graph name..."
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <button
                className="modal-btn primary"
                onClick={handleSave}
                disabled={!saveName.trim()}
              >
                Save
              </button>
            </div>
          </div>

          <div className="saved-list">
            {savedNames.length === 0 ? (
              <p className="saved-empty">No saved graphs</p>
            ) : (
              savedNames.map((name) => (
                <div key={name} className="saved-item">
                  <span className="saved-name">{name}</span>
                  <div className="saved-actions">
                    <button
                      className="modal-btn"
                      onClick={() => handleLoad(name)}
                    >
                      Load
                    </button>
                    <button
                      className="modal-btn danger"
                      onClick={() => handleDelete(name)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
