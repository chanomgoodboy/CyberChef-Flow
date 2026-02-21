/**
 * Message protocol shared by the graph worker and the main thread.
 *
 * This file is **type-only** — it produces no runtime code and can be
 * safely imported from both sides of the worker boundary.
 */

import type { DishData } from '@/adapter/types';
import type { MagicHint, MagicHintSuggestion } from '@/engine/MagicEngine';

/* ------------------------------------------------------------------ */
/*  Serialised graph types (React Flow internals stripped)             */
/* ------------------------------------------------------------------ */

export interface SerializedGraphNode {
  id: string;
  type?: string;
  data: Record<string, unknown>;
}

export interface SerializedGraphEdge {
  id: string;
  source: string;
  target: string;
}

/**
 * A node result as it crosses the worker boundary.
 * Identical shape to the engine's `NodeResult` but listed explicitly
 * so we don't pull React Flow types into the worker.
 */
export interface SerializedNodeResult {
  nodeId: string;
  output: DishData | null;
  displayValue: string;
  dataUrl?: string;
  isHtml?: boolean;
  isTerminal?: boolean;
  duration: number;
  error?: string;
  status: 'idle' | 'running' | 'success' | 'error';
  forkResults?: string[];
  files?: { name: string; size: number; data: string }[];
}

/* ------------------------------------------------------------------ */
/*  Main → Worker messages                                            */
/* ------------------------------------------------------------------ */

export interface ExecuteMessage {
  type: 'execute';
  executionId: number;
  nodes: SerializedGraphNode[];
  edges: SerializedGraphEdge[];
  /** Incremental execution options. */
  changedNodeId?: string;
  /** Existing results as `[id, result][]` entries (Maps aren't cloneable). */
  existingResults?: [string, SerializedNodeResult][];
  /** Node IDs that should execute even if they are normally manual-only. */
  forceNodeIds?: string[];
}

export interface AbortMessage {
  type: 'abort';
  executionId: number;
}

export interface MagicLeafInput {
  nodeId: string;
  dishData: DishData;
}

export interface MagicAnalyzeMessage {
  type: 'magic-analyze';
  executionId: number;
  leaves: MagicLeafInput[];
}

export interface CribAnalyzeMessage {
  type: 'crib-analyze';
  executionId: number;
  leaves: MagicLeafInput[];
  secrets: string[];
}

export interface SyncCribsMessage {
  type: 'sync-cribs';
  secrets: string[];
}

export interface SyncBackendSettingsMessage {
  type: 'sync-backend-settings';
  url: string;
  enabled: boolean;
}

export interface TerminalResizeMessage {
  type: 'terminal-resize';
  cols: number;
  rows: number;
}

export interface ListDirRequest {
  type: 'list-dir';
  requestId: string;
  path: string;
}

export interface SearchWordlistsRequest {
  type: 'search-wordlists';
  requestId: string;
  query: string;
}

export type MainToWorkerMessage =
  | ExecuteMessage
  | AbortMessage
  | MagicAnalyzeMessage
  | CribAnalyzeMessage
  | SyncCribsMessage
  | SyncBackendSettingsMessage
  | TerminalResizeMessage
  | ListDirRequest
  | SearchWordlistsRequest;

/* ------------------------------------------------------------------ */
/*  Worker → Main messages                                            */
/* ------------------------------------------------------------------ */

export interface ReadyMessage {
  type: 'ready';
}

export interface ProgressMessage {
  type: 'progress';
  executionId: number;
  nodeId: string;
  result: SerializedNodeResult;
}

export interface CompleteMessage {
  type: 'complete';
  executionId: number;
  results: [string, SerializedNodeResult][];
}

export interface CycleErrorMessage {
  type: 'cycle-error';
  executionId: number;
  nodeIds: string[];
}

export interface ErrorMessage {
  type: 'error';
  executionId: number;
  message: string;
}

export interface MagicResultMessage {
  type: 'magic-result';
  executionId: number;
  nodeId: string;
  hint: MagicHint;
}

export interface CribResultMessage {
  type: 'crib-result';
  executionId: number;
  nodeId: string;
  suggestions: MagicHintSuggestion[];
}

export interface BackendStatusMessage {
  type: 'backend-status';
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error?: string;
  tools?: { name: string; description?: string }[];
  wordlistRoot?: string;
}

/** Deferred result for a backend operation that completed after the main execution finished. */
export interface NodeUpdateMessage {
  type: 'node-update';
  nodeId: string;
  result: SerializedNodeResult;
}

export interface ListDirResultMessage {
  type: 'list-dir-result';
  requestId: string;
  folders: string[];
  files: { name: string; size: number }[];
  error?: string;
}

export interface SearchWordlistsResultMessage {
  type: 'search-wordlists-result';
  requestId: string;
  results: { relPath: string; name: string; size: number }[];
  error?: string;
}

export type WorkerToMainMessage =
  | ReadyMessage
  | ProgressMessage
  | CompleteMessage
  | CycleErrorMessage
  | ErrorMessage
  | MagicResultMessage
  | CribResultMessage
  | BackendStatusMessage
  | NodeUpdateMessage
  | ListDirResultMessage
  | SearchWordlistsResultMessage;
