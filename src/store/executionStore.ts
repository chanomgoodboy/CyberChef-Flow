import { create } from 'zustand';
import type { MagicHint } from '@/engine/MagicEngine';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface NodeResult {
  output: unknown;
  displayValue: string;
  dataUrl?: string; // data:image/... URL for image outputs
  isHtml?: boolean; // true when output is HTML (e.g. regex highlight)
  isTerminal?: boolean; // true for backend ops — render with xterm.js
  duration: number;
  error?: string;
  status: 'idle' | 'running' | 'success' | 'error';
  /** Per-piece results from a Fork, before merging. */
  forkResults?: string[];
  /** Extracted files from backend operations (steghide, binwalk, etc). */
  files?: { name: string; size: number; data: string }[];
}

interface ExecutionState {
  /** Per-node execution results, keyed by node ID. */
  results: Map<string, NodeResult>;

  /** Magic analysis hints for leaf nodes, keyed by node ID. */
  magicHints: Map<string, MagicHint>;

  /** Whether a graph execution is currently in progress. */
  isRunning: boolean;

  /** When true, the graph re-executes automatically on changes. */
  autoRun: boolean;

  /* Actions */
  setResult: (nodeId: string, result: NodeResult) => void;
  clearResults: () => void;
  setRunning: (running: boolean) => void;
  toggleAutoRun: () => void;
  getResult: (nodeId: string) => NodeResult | undefined;
  setMagicHint: (nodeId: string, hint: MagicHint) => void;
  clearMagicHints: () => void;
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useExecutionStore = create<ExecutionState>()((set, get) => ({
  results: new Map(),
  magicHints: new Map(),
  isRunning: false,
  autoRun: true,

  setResult: (nodeId, result) => {
    set((state) => {
      const next = new Map(state.results);
      next.set(nodeId, result);
      return { results: next };
    });
  },

  clearResults: () => {
    set({ results: new Map() });
  },

  setRunning: (running) => {
    set({ isRunning: running });
  },

  toggleAutoRun: () => {
    set((state) => ({ autoRun: !state.autoRun }));
  },

  getResult: (nodeId) => {
    return get().results.get(nodeId);
  },

  setMagicHint: (nodeId, hint) => {
    set((state) => {
      const next = new Map(state.magicHints);
      next.set(nodeId, hint);
      return { magicHints: next };
    });
  },

  clearMagicHints: () => {
    set({ magicHints: new Map() });
  },
}));
