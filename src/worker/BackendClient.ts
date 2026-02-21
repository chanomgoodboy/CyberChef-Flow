/**
 * WebSocket client singleton for the graph worker.
 *
 * Protocol (like ttyd):
 *   Binary frames = raw PTY output:  [36-byte request ID][data bytes]
 *   Text   frames = JSON control:    capabilities / result / error
 */

/* ------------------------------------------------------------------ */
/*  UUID helper (crypto.randomUUID needs secure context)               */
/* ------------------------------------------------------------------ */

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts (HTTP on LAN IP, etc.)
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1
  const h = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface BackendTool {
  name: string;
  description?: string;
}

export interface BackendResult {
  status: 'success' | 'error';
  text?: string;
  stdout?: string;
  files?: { name: string; size: number; data: string }[];
  message?: string;
}

type StatusCallback = (
  status: 'disconnected' | 'connecting' | 'connected' | 'error',
  error?: string,
  tools?: BackendTool[],
  wordlistRoot?: string,
) => void;

interface PendingRequest {
  resolve: (result: BackendResult) => void;
  reject: (error: Error) => void;
  stdout: string[];
  timer: ReturnType<typeof setTimeout>;
  onStream?: (accumulated: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Module state                                                       */
/* ------------------------------------------------------------------ */

let ws: WebSocket | null = null;
let currentUrl = '';
let enabled = false;
let status: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
let statusCb: StatusCallback | null = null;
let availableTools: BackendTool[] = [];
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 1000;

const MAX_RECONNECT_DELAY = 30000;
const REQUEST_TIMEOUT_MS = 120000;
const LISTDIR_TIMEOUT_MS = 5000;
const pendingRequests = new Map<string, PendingRequest>();

export interface DirListing {
  folders: string[];
  files: { name: string; size: number }[];
}

export interface SearchResult {
  relPath: string;
  name: string;
  size: number;
}

interface PendingListDir {
  resolve: (result: DirListing) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface PendingSearch {
  resolve: (results: SearchResult[]) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const pendingListDirs = new Map<string, PendingListDir>();
const pendingSearches = new Map<string, PendingSearch>();

/* Reusable TextDecoder for binary frames */
const decoder = new TextDecoder();

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */

function setStatus(
  s: typeof status,
  error?: string,
  tools?: BackendTool[],
  wordlistRoot?: string,
) {
  status = s;
  if (tools) availableTools = tools;
  statusCb?.(s, error, tools, wordlistRoot);
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export function setStatusCallback(cb: StatusCallback) {
  statusCb = cb;
}

export function getStatus() {
  return status;
}

export function getAvailableTools(): BackendTool[] {
  return availableTools;
}

export function isToolAvailable(name: string): boolean {
  return availableTools.some((t) => t.name === name);
}

/**
 * Configure the WS connection. Called when settings change.
 * Closes old connection if URL changed, opens if enabled.
 */
export function configure(url: string, isEnabled: boolean) {
  enabled = isEnabled;

  if (!isEnabled) {
    disconnect();
    currentUrl = url;
    return;
  }

  if (url !== currentUrl || !ws) {
    currentUrl = url;
    disconnect();
    connect();
  }
}

/**
 * Execute a tool on the backend. Returns a promise that resolves with
 * the result or rejects on error/timeout.
 */
export function execute(
  tool: string,
  input: ArrayBuffer | string,
  args: Record<string, any>,
  timeoutMs = REQUEST_TIMEOUT_MS,
  onStream?: (accumulated: string) => void,
): Promise<BackendResult> {
  return new Promise((resolve, reject) => {
    if (status !== 'connected' || !ws) {
      reject(new Error('Backend not connected'));
      return;
    }

    const id = uuid();

    // Encode binary input as base64
    let encodedInput: string;
    if (input instanceof ArrayBuffer) {
      const bytes = new Uint8Array(input);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      encodedInput = btoa(binary);
    } else {
      encodedInput = typeof input === 'string' ? input : String(input);
    }

    const timer = setTimeout(() => {
      const pending = pendingRequests.get(id);
      if (pending) {
        pendingRequests.delete(id);
        pending.reject(new Error(`Backend request timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    pendingRequests.set(id, { resolve, reject, stdout: [], timer, onStream });

    ws.send(JSON.stringify({
      type: 'execute',
      id,
      tool,
      input: encodedInput,
      args,
    }));
  });
}

/**
 * Send terminal size to the backend so PTYs match the xterm.js display.
 * Resizes all active PTYs and sets the default for future spawns.
 */
export function resizeTerminal(cols: number, rows: number) {
  if (status !== 'connected' || !ws) return;
  ws.send(JSON.stringify({ type: 'resize', cols, rows }));
}

/**
 * List files and folders in a directory relative to the backend's wordlist root.
 */
export function listDir(relativePath: string): Promise<DirListing> {
  return new Promise((resolve, reject) => {
    if (status !== 'connected' || !ws) {
      reject(new Error('Backend not connected'));
      return;
    }

    const id = uuid();
    const timer = setTimeout(() => {
      pendingListDirs.delete(id);
      reject(new Error('listDir request timed out'));
    }, LISTDIR_TIMEOUT_MS);

    pendingListDirs.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ type: 'list-dir', id, path: relativePath }));
  });
}

/**
 * Recursively search wordlists by filename across all subdirectories.
 */
export function searchWordlists(query: string): Promise<SearchResult[]> {
  return new Promise((resolve, reject) => {
    if (status !== 'connected' || !ws) {
      reject(new Error('Backend not connected'));
      return;
    }

    const id = uuid();
    const timer = setTimeout(() => {
      pendingSearches.delete(id);
      reject(new Error('searchWordlists request timed out'));
    }, LISTDIR_TIMEOUT_MS);

    pendingSearches.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ type: 'search-wordlists', id, query }));
  });
}

/* ------------------------------------------------------------------ */
/*  Connection management                                              */
/* ------------------------------------------------------------------ */

function connect() {
  if (ws) return;
  if (!currentUrl) return;

  clearReconnectTimer();
  setStatus('connecting');

  try {
    ws = new WebSocket(currentUrl);
  } catch {
    setStatus('error', `Invalid WebSocket URL: ${currentUrl}`);
    scheduleReconnect();
    return;
  }

  // Receive binary frames as ArrayBuffer (not Blob)
  ws.binaryType = 'arraybuffer';

  ws.onopen = () => {
    reconnectDelay = 1000; // reset backoff
    // Request capabilities
    ws!.send(JSON.stringify({ type: 'capabilities' }));
  };

  ws.onmessage = (e) => {
    if (e.data instanceof ArrayBuffer) {
      // Binary frame = raw PTY output: [36-byte ID][data]
      handleBinaryOutput(e.data);
    } else {
      // Text frame = JSON control message
      try {
        handleJsonMessage(JSON.parse(e.data as string));
      } catch {
        // ignore malformed
      }
    }
  };

  ws.onclose = () => {
    ws = null;
    rejectAllPending('Connection closed');
    if (enabled) {
      setStatus('disconnected');
      scheduleReconnect();
    } else {
      setStatus('disconnected');
    }
  };

  ws.onerror = () => {
    // onclose will fire after onerror — handle cleanup there
    if (status !== 'disconnected') {
      setStatus('error', 'Connection failed');
    }
  };
}

function disconnect() {
  clearReconnectTimer();
  if (ws) {
    ws.onclose = null;
    ws.onerror = null;
    ws.onmessage = null;
    ws.close();
    ws = null;
  }
  rejectAllPending('Disconnected');
  availableTools = [];
  setStatus('disconnected');
}

function scheduleReconnect() {
  if (!enabled) return;
  clearReconnectTimer();
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (enabled && !ws) connect();
  }, reconnectDelay);
  reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
}

function clearReconnectTimer() {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function rejectAllPending(reason: string) {
  for (const [id, pending] of pendingRequests) {
    clearTimeout(pending.timer);
    pending.reject(new Error(reason));
  }
  pendingRequests.clear();
  for (const [id, pending] of pendingListDirs) {
    clearTimeout(pending.timer);
    pending.reject(new Error(reason));
  }
  pendingListDirs.clear();
  for (const [id, pending] of pendingSearches) {
    clearTimeout(pending.timer);
    pending.reject(new Error(reason));
  }
  pendingSearches.clear();
}

/* ------------------------------------------------------------------ */
/*  Message handling                                                   */
/* ------------------------------------------------------------------ */

/** Binary frame: [36-byte request ID (ASCII)][raw PTY data] */
function handleBinaryOutput(buf: ArrayBuffer) {
  if (buf.byteLength < 36) return;
  const id = decoder.decode(new Uint8Array(buf, 0, 36));
  const pending = pendingRequests.get(id);
  if (!pending) return;

  const data = decoder.decode(new Uint8Array(buf, 36));
  pending.stdout.push(data);
  pending.onStream?.(pending.stdout.join(''));
}

/** Text frame: JSON control messages (capabilities, result, error) */
function handleJsonMessage(msg: any) {
  switch (msg.type) {
    case 'capabilities': {
      const tools: BackendTool[] = Array.isArray(msg.tools) ? msg.tools : [];
      const wlRoot: string | undefined = typeof msg.wordlistRoot === 'string' ? msg.wordlistRoot : undefined;
      setStatus('connected', undefined, tools, wlRoot);
      break;
    }

    case 'result': {
      const pending = pendingRequests.get(msg.id);
      if (pending) {
        clearTimeout(pending.timer);
        pendingRequests.delete(msg.id);
        pending.resolve({
          status: msg.status ?? 'success',
          text: msg.text,
          stdout: pending.stdout.join(''),
          files: msg.files,
        });
      }
      break;
    }

    case 'error': {
      const pending = pendingRequests.get(msg.id);
      if (pending) {
        clearTimeout(pending.timer);
        pendingRequests.delete(msg.id);
        pending.reject(new Error(msg.message ?? 'Backend error'));
      }
      break;
    }

    case 'list-dir': {
      const pending = pendingListDirs.get(msg.id);
      if (pending) {
        clearTimeout(pending.timer);
        pendingListDirs.delete(msg.id);
        if (msg.error) {
          pending.reject(new Error(msg.error));
        } else {
          pending.resolve({
            folders: msg.folders ?? [],
            files: msg.files ?? [],
          });
        }
      }
      break;
    }

    case 'search-wordlists': {
      const pending = pendingSearches.get(msg.id);
      if (pending) {
        clearTimeout(pending.timer);
        pendingSearches.delete(msg.id);
        if (msg.error) {
          pending.reject(new Error(msg.error));
        } else {
          pending.resolve(msg.results ?? []);
        }
      }
      break;
    }
  }
}
