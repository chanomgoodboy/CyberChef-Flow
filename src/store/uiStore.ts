import { create } from 'zustand';
import type { NodeSelectionChange } from '@xyflow/react';
import { useGraphStore } from './graphStore';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UIState {
  /** Whether the operation sidebar/palette is open. */
  sidebarOpen: boolean;

  /** Current search query in the operation palette. */
  searchQuery: string;

  /** ID of the currently selected/focused node on the canvas. */
  selectedNodeId: string | null;

  /** Whether the command palette (Cmd+K) is open. */
  commandPaletteOpen: boolean;

  /** True when the palette was opened from a connector drag to empty space. */
  paletteFromConnector: boolean;

  /** Edge ID to insert a new node onto (set when "Add Operation" is chosen from edge context menu). */
  paletteInsertEdgeId: string | null;

  /** Node ID to replace (set when "Replace with..." is chosen from node context menu). */
  paletteReplaceNodeId: string | null;

  /** When a node has multiple inputs, which upstream source is selected. */
  selectedUpstreamSourceId: string | null;

  /* Actions */
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setCommandPaletteOpen: (open: boolean, fromConnector?: boolean) => void;
  setSelectedUpstreamSourceId: (sourceId: string | null) => void;
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: typeof window !== 'undefined' ? window.innerWidth > 768 : true,
  searchQuery: '',
  selectedNodeId: null,
  commandPaletteOpen: false,
  paletteFromConnector: false,
  paletteInsertEdgeId: null,
  paletteReplaceNodeId: null,
  selectedUpstreamSourceId: null,

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setSelectedNode: (nodeId) => {
    set({ selectedNodeId: nodeId, selectedUpstreamSourceId: null });
    // Sync React Flow's internal selected state on nodes
    const graphStore = useGraphStore.getState();
    const changes: NodeSelectionChange[] = graphStore.nodes.map((n) => ({
      id: n.id,
      type: 'select' as const,
      selected: n.id === nodeId,
    }));
    graphStore.onNodesChange(changes);
  },

  setCommandPaletteOpen: (open, fromConnector) => {
    set({
      commandPaletteOpen: open,
      paletteFromConnector: open && !!fromConnector,
      ...(open ? {} : { paletteInsertEdgeId: null, paletteReplaceNodeId: null }),
    });
  },

  setSelectedUpstreamSourceId: (sourceId) => {
    set({ selectedUpstreamSourceId: sourceId });
  },
}));
