import React from 'react';

interface StatusIndicatorProps {
  status: 'idle' | 'running' | 'success' | 'error';
  duration?: number;
  error?: string;
}

export const StatusIndicator = React.memo(function StatusIndicator({
  status,
  duration,
  error,
}: StatusIndicatorProps) {
  switch (status) {
    case 'idle':
      return (
        <span className="status-indicator status-idle" title="Idle">
          <span className="status-dot idle-dot" />
        </span>
      );

    case 'running':
      return (
        <span className="status-indicator status-running" title="Running...">
          <span className="status-dot running-dot" />
        </span>
      );

    case 'success':
      return (
        <span className="status-indicator status-success" title="Success">
          <span className="status-check"><i className="fa-solid fa-check" /></span>
          {duration !== undefined && (
            <span className="status-duration">{Math.round(duration)}ms</span>
          )}
        </span>
      );

    case 'error':
      return (
        <span
          className="status-indicator status-error"
          title={error || 'Error'}
        >
          <span className="status-x"><i className="fa-solid fa-xmark" /></span>
          {error && <span className="status-error-msg">{error}</span>}
        </span>
      );

    default:
      return null;
  }
});
