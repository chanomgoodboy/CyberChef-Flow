import React, { useState, useCallback } from 'react';
import { useCribStore } from '@/store/cribStore';

interface CribSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CribSettingsModal = React.memo(function CribSettingsModal({
  isOpen,
  onClose,
}: CribSettingsModalProps) {
  const entries = useCribStore((s) => s.entries);
  const addEntry = useCribStore((s) => s.addEntry);
  const removeEntry = useCribStore((s) => s.removeEntry);

  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  const handleAdd = useCallback(() => {
    const l = label.trim();
    const v = value.trim();
    if (!l || !v) return;
    addEntry(l, v);
    setLabel('');
    setValue('');
  }, [label, value, addEntry]);

  const toggleVisibility = useCallback((id: string) => {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Cribs &amp; Secrets</h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Add known keys, passwords, or plaintext fragments. Magic will
            automatically try these against keyed operations (XOR, Vigen&egrave;re,
            RC4, classical ciphers).
          </p>

          <div className="save-section">
            <div className="save-row">
              <input
                type="text"
                className="modal-input"
                placeholder="Label..."
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                style={{ flex: '0 0 120px' }}
              />
              <input
                type="text"
                className="modal-input"
                placeholder="Secret value..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <button
                className="modal-btn primary"
                onClick={handleAdd}
                disabled={!label.trim() || !value.trim()}
              >
                Add
              </button>
            </div>
          </div>

          <div className="saved-list">
            {entries.length === 0 ? (
              <p className="saved-empty">No cribs configured</p>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="saved-item">
                  <span className="saved-name" style={{ flex: '0 0 auto', marginRight: 8 }}>
                    {entry.label}
                  </span>
                  <span className="crib-value">
                    {visibleIds.has(entry.id) ? entry.value : '\u2022'.repeat(Math.min(entry.value.length, 16))}
                  </span>
                  <div className="saved-actions">
                    <button
                      className="modal-btn crib-toggle-vis"
                      onClick={() => toggleVisibility(entry.id)}
                      title={visibleIds.has(entry.id) ? 'Hide value' : 'Show value'}
                    >
                      {visibleIds.has(entry.id) ? '\u{1F441}' : '\u25CF'}
                    </button>
                    <button
                      className="modal-btn danger"
                      onClick={() => removeEntry(entry.id)}
                    >
                      Remove
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
