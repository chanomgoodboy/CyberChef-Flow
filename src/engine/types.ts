import type { Node, Edge } from '@xyflow/react';

export interface GraphNodeData {
  operationName?: string;
  args?: Record<string, any>;
  inputValue?: string;
  label?: string;
  noteContent?: string;
  [key: string]: unknown;
}

export type GraphNode = Node<GraphNodeData>;
export type GraphEdge = Edge;

export interface NodeResult {
  nodeId: string;
  output: any; // Dish-like data ({value, type} or raw)
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

export interface ExecutionLevel {
  level: number;
  nodeIds: string[];
}

export interface CycleError {
  type: 'cycle';
  nodeIds: string[];
}
