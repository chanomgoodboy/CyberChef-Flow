import React from 'react';
import { useBackendStore, type BackendStatus } from '@/store/backendStore';

const STATUS_COLORS: Record<BackendStatus, string> = {
  disconnected: '#6b6b80',
  connecting: '#fff176',
  connected: '#4caf50',
  error: '#ef5350',
};

const STATUS_LABELS: Record<BackendStatus, string> = {
  disconnected: 'Disconnected',
  connecting: 'Connecting...',
  connected: 'Connected',
  error: 'Error',
};

interface BackendIndicatorProps {
  onClick?: () => void;
}

export const BackendIndicator = React.memo(function BackendIndicator({ onClick }: BackendIndicatorProps) {
  const enabled = useBackendStore((s) => s.enabled);
  const status = useBackendStore((s) => s.status);
  const error = useBackendStore((s) => s.error);

  const color = STATUS_COLORS[enabled ? status : 'disconnected'];
  const label = enabled ? STATUS_LABELS[status] : 'Backend';
  const title = error ? `${label}: ${error}` : `${label} — click to configure`;

  return (
    <button className="toolbar-btn backend-btn" onClick={onClick} title={title}>
      <i className="fa-solid fa-server" />
      {enabled && (
        <span
          className="backend-indicator-dot"
          style={{ backgroundColor: color }}
        />
      )}
    </button>
  );
});
