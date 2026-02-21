import React, { useCallback } from 'react';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { getMeta } from '@/adapter/OperationRegistry';
import { createNodeId } from '@/utils/id';

interface OperationCardProps {
  name: string;
  description?: string;
  matchIndices?: number[];
}

function HighlightedName({ text, indices }: { text: string; indices?: number[] }) {
  if (!indices || indices.length === 0) return <>{text}</>;
  const indexSet = new Set(indices);
  const parts: React.ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    if (indexSet.has(i)) {
      const start = i;
      while (i < text.length && indexSet.has(i)) i++;
      parts.push(<mark key={start}>{text.slice(start, i)}</mark>);
    } else {
      const start = i;
      while (i < text.length && !indexSet.has(i)) i++;
      parts.push(text.slice(start, i));
    }
  }
  return <>{parts}</>;
}

export const OperationCard = React.memo(function OperationCard({
  name,
  description,
  matchIndices,
}: OperationCardProps) {
  const addNodeToChain = useGraphStore((s) => s.addNodeToChain);
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const setSelectedNode = useUIStore((s) => s.setSelectedNode);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('application/cyberweb-operation', name);
      e.dataTransfer.effectAllowed = 'move';
    },
    [name],
  );

  const handleDoubleClick = useCallback(() => {
    const meta = getMeta(name);
    const optionTypes = new Set(['option', 'editableOption', 'editableOptionShort', 'argSelector']);
    const argValues: Record<string, any> = {};
    if (meta) {
      for (const def of meta.args) {
        if (optionTypes.has(def.type) && Array.isArray(def.value)) {
          const first = def.value[0];
          argValues[def.name] = typeof first === 'object' && first !== null
            ? (first.value ?? first.name ?? '')
            : (first ?? '');
        } else if (def.type === 'toggleString') {
          argValues[def.name] = { string: def.value ?? '', option: def.toggleValues?.[0] ?? '' };
        } else {
          argValues[def.name] = def.value;
        }
      }
    }
    const nodeId = createNodeId();
    addNodeToChain(
      {
        id: nodeId,
        type: 'operation',
        position: { x: 0, y: 0 },
        data: {
          operationName: name,
          args: argValues,
          inputType: meta?.inputType ?? 'string',
          outputType: meta?.outputType ?? 'string',
        },
      },
      { afterNodeId: selectedNodeId ?? undefined },
    );
    setSelectedNode(nodeId);
  }, [name, addNodeToChain, selectedNodeId, setSelectedNode]);

  return (
    <div
      className="operation-card"
      draggable
      onDragStart={handleDragStart}
      onDoubleClick={handleDoubleClick}
      title={description || name}
    >
      <span className="operation-card-name">
        <HighlightedName text={name} indices={matchIndices} />
      </span>
    </div>
  );
});
