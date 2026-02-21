import React, { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useExecutionStore } from '@/store/executionStore';

interface CanvasToolbarProps {
  onRun?: () => void;
}

export const CanvasToolbar = React.memo(function CanvasToolbar({
  onRun,
}: CanvasToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const isRunning = useExecutionStore((s) => s.isRunning);
  const autoRun = useExecutionStore((s) => s.autoRun);
  const toggleAutoRun = useExecutionStore((s) => s.toggleAutoRun);

  const handleZoomIn = useCallback(() => {
    zoomIn();
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut();
  }, [zoomOut]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);

  const handleRun = useCallback(() => {
    if (!isRunning && onRun) {
      onRun();
    }
  }, [isRunning, onRun]);

  return (
    <div className="canvas-toolbar">
      <button
        className="toolbar-btn"
        onClick={handleZoomIn}
        title="Zoom in"
      >
        <i className="fa-solid fa-plus" />
      </button>
      <button
        className="toolbar-btn"
        onClick={handleZoomOut}
        title="Zoom out"
      >
        <i className="fa-solid fa-minus" />
      </button>
      <button
        className="toolbar-btn"
        onClick={handleFitView}
        title="Fit view"
      >
        <i className="fa-solid fa-expand" />
      </button>

      <span className="toolbar-separator" />

      <button
        className="toolbar-btn run-btn"
        onClick={handleRun}
        disabled={isRunning}
        title="Run graph"
      >
        <i className="fa-solid fa-play" />
      </button>
      <label className="toolbar-toggle" title="Auto-run on changes">
        <input
          type="checkbox"
          checked={autoRun}
          onChange={toggleAutoRun}
        />
        Auto
      </label>
    </div>
  );
});
