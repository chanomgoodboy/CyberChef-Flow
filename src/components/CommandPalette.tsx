import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useGraphStore } from '@/store/graphStore';
import * as Registry from '@/adapter/OperationRegistry';
import { smartSearch } from '@/utils/smartSearch';
import { createNodeId } from '@/utils/id';
import { getMeta } from '@/adapter/OperationRegistry';
import { buildDefaultArgs } from '@/utils/argDefaults';

interface PaletteItem {
  id: string;
  label: string;
  description: string;
  kind: 'input' | 'note' | 'magic' | 'operation';
  matchIndices?: number[];
  pinned?: boolean;
}

function HighlightedLabel({ text, indices }: { text: string; indices?: number[] }) {
  if (!indices || indices.length === 0) {
    return <>{text}</>;
  }
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

const BUILT_IN_ITEMS: PaletteItem[] = [
  { id: '__input', label: 'Input', description: 'Add an input source node', kind: 'input' },
  { id: '__note', label: 'Note', description: 'Add an annotation note', kind: 'note' },
  { id: '__magic', label: 'Magic', description: 'Detect encodings and suggest operations', kind: 'magic' },
  { id: 'Cipher Identifier', label: 'Cipher Identifier', description: 'Identify ciphers, encodings, and esolangs', kind: 'operation', pinned: true },
];

export const CommandPalette = React.memo(function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const fromConnector = useUIStore((s) => s.paletteFromConnector);
  const addNode = useGraphStore((s) => s.addNode);
  const addNodeToChain = useGraphStore((s) => s.addNodeToChain);
  const insertNodeOnEdge = useGraphStore((s) => s.insertNodeOnEdge);
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const setSelectedNode = useUIStore((s) => s.setSelectedNode);
  const insertEdgeId = useUIStore((s) => s.paletteInsertEdgeId);
  const replaceNodeId = useUIStore((s) => s.paletteReplaceNodeId);
  const updateNodeData = useGraphStore((s) => s.updateNodeData);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const mouseMovedRef = useRef(false);

  const allOps = useMemo(() => Registry.getAll(), []);

  const results = useMemo((): PaletteItem[] => {
    const q = query.trim().toLowerCase();

    // In replace mode, only show operations
    if (replaceNodeId) {
      return q
        ? smartSearch(allOps, query, 30).map((r) => ({
            id: r.op.name,
            label: r.op.name,
            description: r.op.description.slice(0, 80),
            kind: 'operation' as const,
            matchIndices: r.matchIndices,
          }))
        : [];
    }

    // Filter built-in items
    const builtIn = q
      ? BUILT_IN_ITEMS.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q),
        )
      : BUILT_IN_ITEMS;

    // Names pinned as built-ins — exclude from search to avoid dupes
    const pinnedNames = new Set(
      BUILT_IN_ITEMS.filter((i) => i.pinned).map((i) => i.label),
    );

    // Search operations
    const ops = q
      ? smartSearch(allOps, query, 30)
          .filter((r) => !pinnedNames.has(r.op.name))
          .map((r) => ({
            id: r.op.name,
            label: r.op.name,
            description: r.op.description.slice(0, 80),
            kind: 'operation' as const,
            matchIndices: r.matchIndices,
          }))
      : [];

    return [...builtIn, ...ops];
  }, [query, allOps, replaceNodeId]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      mouseMovedRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[selectedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, [setOpen]);

  // Global Escape listener — catches Escape even if focus is elsewhere
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, close]);

  const addItem = useCallback(
    (item: PaletteItem) => {
      // Replace mode: swap the operation on the existing node
      if (replaceNodeId && item.kind === 'operation') {
        const meta = getMeta(item.label);
        updateNodeData(replaceNodeId, {
          operationName: item.label,
          args: buildDefaultArgs(item.label),
          inputType: meta?.inputType ?? 'string',
          outputType: meta?.outputType ?? 'string',
        });
        setSelectedNode(replaceNodeId);
        close();
        return;
      }

      const nodeId = createNodeId();

      // Build node data by kind
      const buildNodeData = (kind: PaletteItem['kind'], label: string) => {
        if (kind === 'input') return { type: 'input' as const, data: { inputValue: '', inputType: 'text' } };
        if (kind === 'note') return { type: 'note' as const, data: { text: '' } };
        if (kind === 'magic') return { type: 'magic' as const, data: { depth: 3, intensive: false, extLang: false, crib: '' } };
        const meta = getMeta(label);
        return {
          type: 'operation' as const,
          data: {
            operationName: label,
            args: buildDefaultArgs(label),
            inputType: meta?.inputType ?? 'string',
            outputType: meta?.outputType ?? 'string',
          },
        };
      };

      const { type, data } = buildNodeData(item.kind, item.label);

      // Edge insertion mode: add node and insert it on the target edge
      if (insertEdgeId) {
        // Position midway between source and target of the edge
        const store = useGraphStore.getState();
        const edge = store.edges.find((e) => e.id === insertEdgeId);
        const srcNode = edge ? store.nodes.find((n) => n.id === edge.source) : null;
        const tgtNode = edge ? store.nodes.find((n) => n.id === edge.target) : null;
        const pos = srcNode && tgtNode
          ? { x: (srcNode.position.x + tgtNode.position.x) / 2, y: (srcNode.position.y + tgtNode.position.y) / 2 }
          : { x: 100, y: 200 };

        addNode({ id: nodeId, type, position: pos, data });
        insertNodeOnEdge(nodeId, insertEdgeId);
      } else if (item.kind === 'input') {
        addNode({ id: nodeId, type: 'input', position: { x: 100, y: 60 }, data: { inputValue: '', inputType: 'text' } });
      } else if (selectedNodeId) {
        // A node is selected — chain from it
        const chainOpts = { afterNodeId: selectedNodeId, branch: fromConnector };
        const placeholder = { x: 0, y: 0 };
        addNodeToChain({ id: nodeId, type, position: placeholder, data }, chainOpts);
      } else {
        // No selection — add standalone, no connection
        const nodes = useGraphStore.getState().nodes;
        const pos = nodes.length === 0
          ? { x: 100, y: 60 }
          : { x: nodes[0].position.x, y: Math.max(...nodes.map((n) => n.position.y)) + 120 };
        addNode({ id: nodeId, type, position: pos, data });
      }

      setSelectedNode(nodeId);
      close();
    },
    [addNode, addNodeToChain, insertNodeOnEdge, selectedNodeId, insertEdgeId, fromConnector, replaceNodeId, updateNodeData, setSelectedNode, close],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const item = results[selectedIndex];
        if (item) addItem(item);
        return;
      }
    },
    [close, results, selectedIndex, addItem],
  );

  if (!open) return null;

  return (
    <div className="cmd-palette-overlay" onClick={close}>
      <div className="cmd-palette" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="cmd-palette-input-row">
          <span className="cmd-palette-icon"><i className="fa-solid fa-angle-right" /></span>
          <input
            ref={inputRef}
            type="text"
            className="cmd-palette-input"
            placeholder={replaceNodeId ? 'Replace with... (type to search operations)' : 'Add node... (type to search operations)'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="cmd-palette-kbd" onClick={close} style={{ cursor: 'pointer' }}>esc</kbd>
        </div>
        <div className="cmd-palette-list" ref={listRef}>
          {results.length === 0 ? (
            <div className="cmd-palette-empty">No matching operations</div>
          ) : (
            results.map((item, i) => (
              <div
                key={item.id}
                className={`cmd-palette-item${i === selectedIndex ? ' selected' : ''}`}
                onClick={() => addItem(item)}
                onMouseMove={() => { mouseMovedRef.current = true; }}
                onMouseEnter={() => { if (mouseMovedRef.current) setSelectedIndex(i); }}
              >
                <span className="cmd-palette-item-kind" data-kind={item.kind}>
                  {item.kind === 'input'
                    ? '\u{1F4E5}'
                    : item.kind === 'note'
                      ? '\u{1F4DD}'
                      : item.kind === 'magic'
                        ? '\u2728'
                        : item.pinned
                          ? '\u{1F50D}'
                          : '\u2699'}
                </span>
                <span className="cmd-palette-item-label">
                  <HighlightedLabel text={item.label} indices={item.matchIndices} />
                </span>
                {item.description && (
                  <span className="cmd-palette-item-desc">{item.description}</span>
                )}
              </div>
            ))
          )}
        </div>
        <div className="cmd-palette-footer">
          <span><kbd>{'\u2191'}</kbd><kbd>{'\u2193'}</kbd> navigate</span>
          <span><kbd>{'\u23CE'}</kbd> add</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
});
