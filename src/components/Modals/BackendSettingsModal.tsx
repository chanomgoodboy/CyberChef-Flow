import React, { useState, useCallback } from 'react';
import { useBackendStore, type BackendStatus } from '@/store/backendStore';

interface BackendSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_COLORS: Record<BackendStatus, string> = {
  disconnected: '#6b6b80',
  connecting: '#fff176',
  connected: '#4caf50',
  error: '#ef5350',
};

export const BackendSettingsModal = React.memo(function BackendSettingsModal({
  isOpen,
  onClose,
}: BackendSettingsModalProps) {
  const enabled = useBackendStore((s) => s.enabled);
  const url = useBackendStore((s) => s.url);
  const status = useBackendStore((s) => s.status);
  const error = useBackendStore((s) => s.error);
  const tools = useBackendStore((s) => s.tools);
  const setEnabled = useBackendStore((s) => s.setEnabled);
  const wordlistRoot = useBackendStore((s) => s.wordlistRoot);
  const setUrl = useBackendStore((s) => s.setUrl);

  const [urlDraft, setUrlDraft] = useState(url);

  const handleUrlBlur = useCallback(() => {
    const trimmed = urlDraft.trim();
    if (trimmed && trimmed !== url) {
      setUrl(trimmed);
    }
  }, [urlDraft, url, setUrl]);

  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleUrlBlur();
    },
    [handleUrlBlur],
  );

  // Sync drafts when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setUrlDraft(url);
    }
  }, [isOpen, url]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Backend Settings</h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Connect to a local backend server for heavy CTF tools
            (binwalk, steghide, hashcat, exiftool, etc.).
          </p>

          {/* Enable toggle */}
          <label className="backend-toggle-row">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span>Enable backend connection</span>
          </label>

          {/* URL input */}
          <div className="backend-url-row">
            <label className="backend-label">Server URL</label>
            <input
              type="text"
              className="modal-input"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onBlur={handleUrlBlur}
              onKeyDown={handleUrlKeyDown}
              placeholder="ws://localhost:8540"
              disabled={!enabled}
            />
          </div>

          {/* Status */}
          <div className="backend-status-row">
            <span
              className="backend-indicator-dot"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
            <span className="backend-status-text">
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {error ? `: ${error}` : ''}
            </span>
          </div>

          {/* Wordlist Root (read-only, from backend) */}
          {wordlistRoot && status === 'connected' && (
            <div className="backend-url-row">
              <label className="backend-label">Wordlist Root</label>
              <input
                type="text"
                className="modal-input"
                value={wordlistRoot}
                readOnly
                title="Configured on the backend server via WORDLIST_ROOT env var"
              />
            </div>
          )}

          {/* Tool list */}
          {tools.length > 0 && (
            <div className="backend-tools-section">
              <label className="backend-label">
                Available Tools ({tools.length})
              </label>
              <div className="backend-tools-list">
                {tools.map((t) => (
                  <div key={t.name} className="backend-tool-item">
                    <span className="backend-tool-name">{t.name}</span>
                    {t.description && (
                      <span className="backend-tool-desc">
                        {t.description}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
