import React, { useCallback, useMemo } from 'react';
import { Position, type NodeProps, NodeResizer } from '@xyflow/react';
import { DataHandle } from '@/components/NodeParts/DataHandle';
import { ArgControls } from '@/components/NodeParts/ArgControls';
import { PreviewPanel } from '@/components/NodeParts/PreviewPanel';
import { StatusIndicator } from '@/components/NodeParts/StatusIndicator';
import { MagicBadge } from '@/components/NodeParts/MagicBadge';
import { ZoomableImage } from '@/components/ZoomableImage';
import { useGraphStore } from '@/store/graphStore';
import { useExecutionStore, type NodeResult } from '@/store/executionStore';
import { getMeta } from '@/adapter/OperationRegistry';
import { MANUAL_BACKEND_OPS } from '@/engine/manualOps';
import { forceRunNode } from '@/hooks/useGraphExecution';

function OperationNodeInner({ id, data, selected }: NodeProps) {
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const removeNode = useGraphStore((s) => s.removeNode);
  const result: NodeResult | undefined = useExecutionStore((s) => s.results.get(id));

  const operationName = (data.operationName as string) ?? 'Unknown';
  const argValues = (data.args as Record<string, any>) ?? {};
  const inputType = (data.inputType as string) ?? 'string';
  const outputType = (data.outputType as string) ?? 'string';
  const isMinimized = (data.isMinimized as boolean) ?? false;

  const meta = useMemo(() => getMeta(operationName), [operationName]);
  const argDefs = meta?.args ?? [];
  const isManualOp = MANUAL_BACKEND_OPS.has(operationName);

  const status = result?.status ?? 'idle';
  const previewValue = result?.displayValue;
  const dataUrl = result?.dataUrl;

  const handleForceRun = useCallback(() => {
    forceRunNode(id);
  }, [id]);

  const handleArgChange = useCallback(
    (argName: string, value: any) => {
      updateNodeData(id, {
        args: { ...argValues, [argName]: value },
      });
    },
    [id, argValues, updateNodeData],
  );

  const handleRemove = useCallback(() => {
    removeNode(id);
  }, [id, removeNode]);

  const toggleMinimize = useCallback(() => {
    updateNodeData(id, { isMinimized: !isMinimized });
  }, [id, isMinimized, updateNodeData]);

  return (
    <div className={`cyberweb-node operation-node${meta?.module === 'Backend' ? ' backend-op' : ''}${dataUrl && !isMinimized ? ' operation-node-image' : ''}${selected ? ' selected' : ''}${isMinimized ? ' node-minimized' : ''}`}>
      {dataUrl && !isMinimized && (
        <NodeResizer
          minWidth={160}
          minHeight={120}
          isVisible={selected}
          lineClassName="node-resize-line-purple"
          handleClassName="node-resize-handle-purple"
        />
      )}
      <DataHandle
        type="target"
        position={Position.Top}
        dishType={inputType}
        id="input"
      />

      <div className="node-header operation-header">
        <span className="node-icon">
          {meta?.module === 'Backend'
            ? <i className="fa-solid fa-terminal" />
            : <i className="fa-solid fa-gear" />}
        </span>
        <span className="node-title">{operationName}</span>
        {isMinimized && (
          <StatusIndicator
            status={status}
            duration={result?.duration}
            error={result?.error}
          />
        )}
        {isManualOp && (
          <button
            className="node-run-btn"
            onClick={handleForceRun}
            title="Run this operation"
          >
            <i className="fa-solid fa-play" />
          </button>
        )}
        <button
          className="node-minimize-btn"
          onClick={toggleMinimize}
          title={isMinimized ? 'Expand node' : 'Minimize node'}
        >
          <i className={`fa-solid ${isMinimized ? 'fa-chevron-right' : 'fa-chevron-down'}`} />
        </button>
        <button
          className="node-close-btn"
          onClick={handleRemove}
          title="Remove node"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      {!isMinimized && (
        <div className="node-body nowheel">
          {argDefs.length > 0 && (
            <ArgControls
              args={argDefs}
              values={argValues}
              onChange={handleArgChange}
            />
          )}

          {dataUrl && (
            <ZoomableImage src={dataUrl} alt={operationName} className="op-node-zoomable" />
          )}

          <div className="node-footer">
            {!dataUrl && <PreviewPanel value={previewValue} />}
            <StatusIndicator
              status={status}
              duration={result?.duration}
              error={result?.error}
            />
          </div>
          <MagicBadge nodeId={id} />
        </div>
      )}

      <DataHandle
        type="source"
        position={Position.Bottom}
        dishType={outputType}
        id="output"
      />
    </div>
  );
}

export const OperationNode = React.memo(OperationNodeInner);
