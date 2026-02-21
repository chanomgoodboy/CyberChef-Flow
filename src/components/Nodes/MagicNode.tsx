import React, { useCallback } from 'react';
import { Position, type NodeProps } from '@xyflow/react';
import { DataHandle } from '@/components/NodeParts/DataHandle';
import { StatusIndicator } from '@/components/NodeParts/StatusIndicator';
import { useGraphStore } from '@/store/graphStore';
import { useExecutionStore, type NodeResult } from '@/store/executionStore';
import { NumberInput } from '@/components/NumberInput';
import { MagicTable } from '@/components/MagicTable';

function MagicNodeInner({ id, data, selected }: NodeProps) {
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const removeNode = useGraphStore((s) => s.removeNode);
  const result: NodeResult | undefined = useExecutionStore((s) => s.results.get(id));

  const depth = (data.depth as number) ?? 3;
  const intensive = (data.intensive as boolean) ?? false;
  const extLang = (data.extLang as boolean) ?? false;
  const crib = (data.crib as string) ?? '';

  const status = result?.status ?? 'idle';
  const displayValue = result?.displayValue ?? '';

  const handleRemove = useCallback(() => {
    removeNode(id);
  }, [id, removeNode]);

  const handleDepthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === '') {
        updateNodeData(id, { depth: '' as any });
        return;
      }
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed)) {
        updateNodeData(id, { depth: Math.max(0, Math.min(5, parsed)) });
      }
    },
    [id, updateNodeData],
  );

  const handleIntensiveChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(id, { intensive: e.target.checked });
    },
    [id, updateNodeData],
  );

  const handleExtLangChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(id, { extLang: e.target.checked });
    },
    [id, updateNodeData],
  );

  const handleCribChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(id, { crib: e.target.value });
    },
    [id, updateNodeData],
  );

  return (
    <div className={`cyberweb-node magic-node${selected ? ' selected' : ''}`}>
      <DataHandle
        type="target"
        position={Position.Top}
        dishType="ArrayBuffer"
        id="input"
      />

      <div className="node-header magic-header">
        <span className="node-icon"><i className="fa-solid fa-wand-magic-sparkles" /></span>
        <span className="node-title">Magic</span>
        <button
          className="node-close-btn"
          onClick={handleRemove}
          title="Remove node"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <div className="node-body nowheel">
        <div className="magic-args">
          <label className="magic-arg-row">
            <span className="magic-arg-label">Depth</span>
            <NumberInput
              className="magic-arg-input"
              value={data.depth === '' ? '' : depth}
              min={0}
              max={5}
              onChange={handleDepthChange}
            />
          </label>
          <label className="magic-arg-row">
            <input
              type="checkbox"
              checked={intensive}
              onChange={handleIntensiveChange}
            />
            <span className="magic-arg-label">Intensive</span>
          </label>
          <label className="magic-arg-row">
            <input
              type="checkbox"
              checked={extLang}
              onChange={handleExtLangChange}
            />
            <span className="magic-arg-label">Ext. Languages</span>
          </label>
          <label className="magic-arg-row">
            <span className="magic-arg-label">Crib</span>
            <input
              type="text"
              className="magic-arg-input magic-crib-input"
              value={crib}
              placeholder="regex..."
              onChange={handleCribChange}
            />
          </label>
        </div>

        {status === 'success' && displayValue && (
          <MagicTable jsonValue={displayValue} afterNodeId={id} />
        )}

        <div className="node-footer">
          <StatusIndicator
            status={status}
            duration={result?.duration}
            error={result?.error}
          />
        </div>
      </div>

      <DataHandle
        type="source"
        position={Position.Bottom}
        dishType="ArrayBuffer"
        id="output"
      />
    </div>
  );
}

export const MagicNode = React.memo(MagicNodeInner);
