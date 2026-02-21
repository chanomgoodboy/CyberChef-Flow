import React, { useCallback } from 'react';
import { useExecutionStore } from '@/store/executionStore';

interface ExecutionControlsProps {
  onRun?: () => void;
}

export const ExecutionControls = React.memo(function ExecutionControls({
  onRun,
}: ExecutionControlsProps) {
  const isRunning = useExecutionStore((s) => s.isRunning);
  const autoRun = useExecutionStore((s) => s.autoRun);
  const toggleAutoRun = useExecutionStore((s) => s.toggleAutoRun);
  const setRunning = useExecutionStore((s) => s.setRunning);

  const handleRun = useCallback(() => {
    if (!isRunning && onRun) {
      onRun();
    }
  }, [isRunning, onRun]);

  const handleStop = useCallback(() => {
    setRunning(false);
  }, [setRunning]);

  return (
    <div className="execution-controls">
      {isRunning ? (
        <button
          className="toolbar-btn stop-btn"
          onClick={handleStop}
          title="Stop execution"
        >
          <i className="fa-solid fa-stop" /> Stop
        </button>
      ) : (
        <button
          className="toolbar-btn run-btn"
          onClick={handleRun}
          title="Run graph"
        >
          <i className="fa-solid fa-play" /> Run
        </button>
      )}
      <label className="auto-run-toggle" title="Auto-run on changes">
        <input
          type="checkbox"
          checked={autoRun}
          onChange={toggleAutoRun}
        />
        Auto-run
      </label>
    </div>
  );
});
