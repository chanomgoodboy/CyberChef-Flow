import React, { useEffect, useMemo, useCallback, type DragEvent } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useGraphStore } from '@/store/graphStore';
import * as Registry from '@/adapter/OperationRegistry';
import type { OperationMeta, CategoryInfo } from '@/adapter/types';
import { smartSearch } from '@/utils/smartSearch';
import { createNodeId } from '@/utils/id';
import { CategoryGroup } from './CategoryGroup';
import { OperationCard } from './OperationCard';

export const OperationPalette = React.memo(function OperationPalette() {
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  // Initialize registry on mount
  useEffect(() => {
    Registry.init();
  }, []);

  const allOps = useMemo(() => Registry.getAll(), []);
  const categories = useMemo(() => Registry.getCategories(), []);

  // Build a map for fast lookup
  const opsByName = useMemo(() => {
    const map = new Map<string, OperationMeta>();
    for (const op of allOps) {
      map.set(op.name, op);
    }
    return map;
  }, [allOps]);

  // Smart search filter
  const filteredOps = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return smartSearch(allOps, searchQuery, 50);
  }, [allOps, searchQuery]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [setSearchQuery],
  );

  if (!sidebarOpen) {
    return null;
  }

  return (
    <div className="operation-palette">
      <div className="palette-header">
        <h2 className="palette-title">Operations</h2>
      </div>

      <div className="palette-search">
        <input
          type="text"
          className="search-input"
          placeholder="Search operations..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className="palette-nodes">
        <NodeTypeCard nodeType="input" label="Input" color="var(--accent-blue)" />
        <NodeTypeCard nodeType="note" label="Note" color="var(--accent-yellow)" />
        <NodeTypeCard nodeType="magic" label="Magic" color="var(--accent-purple)" />
      </div>

      <div className="palette-list">
        {filteredOps ? (
          /* Search results -- flat list */
          filteredOps.length > 0 ? (
            filteredOps.map((r) => (
              <OperationCard
                key={r.op.name}
                name={r.op.name}
                description={r.op.description}
                matchIndices={r.matchIndices}
              />
            ))
          ) : (
            <div className="palette-empty">No matching operations</div>
          )
        ) : (
          /* Category view */
          categories.map((cat: CategoryInfo) => {
            const ops = cat.ops
              .map((name) => opsByName.get(name))
              .filter(Boolean) as OperationMeta[];
            if (ops.length === 0) return null;
            return (
              <CategoryGroup key={cat.name} name={cat.name} operations={ops} />
            );
          })
        )}
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  Draggable card for built-in node types (Input / Output / Note)     */
/* ------------------------------------------------------------------ */

function NodeTypeCard({ nodeType, label, color }: { nodeType: string; label: string; color: string }) {
  const addNode = useGraphStore((s) => s.addNode);
  const addNodeToChain = useGraphStore((s) => s.addNodeToChain);
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const setSelectedNode = useUIStore((s) => s.setSelectedNode);

  const onDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData('application/cyberweb-node', nodeType);
      e.dataTransfer.effectAllowed = 'move';
    },
    [nodeType],
  );

  const handleClick = useCallback(() => {
    const nodeId = createNodeId();
    if (nodeType === 'input') {
      addNode({
        id: nodeId,
        type: 'input',
        position: { x: 0, y: 0 },
        data: { inputValue: '', inputType: 'Text' },
      });
    } else {
      const nodeData =
        nodeType === 'magic'
          ? { depth: 3, intensive: false, extLang: false, crib: '' }
          : { text: '' };
      addNodeToChain(
        {
          id: nodeId,
          type: nodeType,
          position: { x: 0, y: 0 },
          data: nodeData,
        },
        { afterNodeId: selectedNodeId ?? undefined },
      );
    }
    setSelectedNode(nodeId);
  }, [nodeType, addNode, addNodeToChain, selectedNodeId, setSelectedNode]);

  return (
    <div
      className="node-type-card"
      draggable
      onDragStart={onDragStart}
      onClick={handleClick}
      style={{ borderLeftColor: color }}
    >
      {label}
    </div>
  );
}
