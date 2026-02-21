import { useEffect, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { saveToLocalStorage } from '@/utils/graphSerializer';
import { createNodeId, createEdgeId } from '@/utils/id';

interface ClipboardData {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Register global keyboard shortcuts.  Should be called once, near the
 * root of the component tree (e.g. in the main App or Canvas wrapper).
 *
 * Shortcuts:
 *   Ctrl+Z          undo
 *   Ctrl+Shift+Z    redo
 *   Ctrl+Y          redo (alternative)
 *   Delete / Back   remove selected nodes
 *   Ctrl+S          quick-save to localStorage (prevents default)
 *   Ctrl+C          copy selected node(s)
 *   Ctrl+V          paste copied node(s)
 */
export function useKeyboardShortcuts(): void {
  const clipboardRef = useRef<ClipboardData | null>(null);
  const pasteCountRef = useRef(0);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;

      // Skip when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isEditable = (e.target as HTMLElement)?.getAttribute?.('contenteditable') === 'true';
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || isEditable;

      // --- Undo -------------------------------------------------------
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        if (isInput) return;
        e.preventDefault();
        useGraphStore.getState().undo();
        return;
      }

      // --- Redo -------------------------------------------------------
      if (
        (ctrl && e.key === 'z' && e.shiftKey) ||
        (ctrl && e.key === 'y')
      ) {
        if (isInput) return;
        e.preventDefault();
        useGraphStore.getState().redo();
        return;
      }

      // --- Delete selected nodes --------------------------------------
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isInput) return;

        const selectedId = useUIStore.getState().selectedNodeId;
        if (selectedId) {
          e.preventDefault();
          useGraphStore.getState().removeNode(selectedId);
          useUIStore.getState().setSelectedNode(null);
        }
        return;
      }

      // --- Copy (Cmd+C) -----------------------------------------------
      if (ctrl && e.key === 'c') {
        if (isInput) return;

        const { nodes, edges } = useGraphStore.getState();
        const selected = nodes.filter((n) => n.selected);
        if (selected.length === 0) {
          const selectedId = useUIStore.getState().selectedNodeId;
          if (selectedId) {
            const node = nodes.find((n) => n.id === selectedId);
            if (node) selected.push(node);
          }
        }
        if (selected.length === 0) return;

        e.preventDefault();
        const selectedIds = new Set(selected.map((n) => n.id));
        const connectedEdges = edges.filter(
          (edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target),
        );

        clipboardRef.current = {
          nodes: selected.map((n) => structuredClone(n)),
          edges: connectedEdges.map((e) => structuredClone(e)),
        };
        pasteCountRef.current = 0;
        return;
      }

      // --- Paste (Cmd+V) ----------------------------------------------
      if (ctrl && e.key === 'v') {
        if (isInput) return;
        if (!clipboardRef.current) return;

        e.preventDefault();
        pasteCountRef.current += 1;
        const offset = pasteCountRef.current * 40;

        const { nodes: srcNodes, edges: srcEdges } = clipboardRef.current;
        const idMap = new Map<string, string>();

        // Create new nodes with fresh IDs and offset positions
        const newNodes: Node[] = srcNodes.map((n) => {
          const newId = createNodeId();
          idMap.set(n.id, newId);
          return {
            ...structuredClone(n),
            id: newId,
            position: { x: n.position.x + offset, y: n.position.y + offset },
            selected: true,
          };
        });

        // Recreate internal edges with mapped IDs
        const newEdges: Edge[] = srcEdges.map((edge) => ({
          ...structuredClone(edge),
          id: createEdgeId(),
          source: idMap.get(edge.source) ?? edge.source,
          target: idMap.get(edge.target) ?? edge.target,
        }));

        const graph = useGraphStore.getState();
        graph.captureSnapshot();

        // Deselect existing nodes
        const deselected = graph.nodes.map((n) => ({ ...n, selected: false }));
        useGraphStore.setState({
          nodes: [...deselected, ...newNodes],
          edges: [...graph.edges, ...newEdges],
        });

        // Select the first pasted node
        if (newNodes.length === 1) {
          useUIStore.getState().setSelectedNode(newNodes[0].id);
        }
        return;
      }

      // --- Save -------------------------------------------------------
      if (ctrl && e.key === 's') {
        e.preventDefault();
        const { nodes, edges } = useGraphStore.getState();
        saveToLocalStorage('__autosave__', nodes, edges);
        return;
      }

      // --- Command palette (Cmd+K) -----------------------------------
      if (ctrl && e.key === 'k') {
        e.preventDefault();
        const ui = useUIStore.getState();
        ui.setCommandPaletteOpen(!ui.commandPaletteOpen);
        return;
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
