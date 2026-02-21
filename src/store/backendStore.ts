import { create } from 'zustand';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type BackendStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface BackendTool {
  name: string;
  description?: string;
}

interface BackendState {
  url: string;
  enabled: boolean;
  status: BackendStatus;
  error: string | null;
  tools: BackendTool[];
  /** Wordlist root directory reported by the backend server. */
  wordlistRoot: string;

  setUrl: (url: string) => void;
  setEnabled: (enabled: boolean) => void;
  setStatus: (status: BackendStatus, error?: string | null) => void;
  setTools: (tools: BackendTool[]) => void;
  setWordlistRoot: (path: string) => void;
  hydrate: () => void;
}

/* ------------------------------------------------------------------ */
/*  Persistence                                                        */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'cyberweb_backend';

interface PersistedBackend {
  url: string;
  enabled: boolean;
}

function persist(data: PersistedBackend) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* storage full or unavailable */ }
}

function load(): PersistedBackend {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaults();
    const parsed = JSON.parse(raw);
    return {
      url: typeof parsed.url === 'string' ? parsed.url : getDefaults().url,
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : false,
    };
  } catch {
    return getDefaults();
  }
}

function getDefaults(): PersistedBackend {
  const host = typeof location !== 'undefined' ? location.hostname : 'localhost';
  return {
    url: `ws://${host}:8540`,
    enabled: false,
  };
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useBackendStore = create<BackendState>()((set, get) => ({
  url: getDefaults().url,
  enabled: false,
  status: 'disconnected',
  error: null,
  tools: [],
  wordlistRoot: '',

  setUrl: (url) => {
    const s = get();
    persist({ url, enabled: s.enabled });
    set({ url });
  },

  setEnabled: (enabled) => {
    const s = get();
    persist({ url: s.url, enabled });
    set({ enabled });
  },

  setStatus: (status, error) => {
    set({ status, error: error ?? null });
  },

  setTools: (tools) => {
    set({ tools });
  },

  setWordlistRoot: (wordlistRoot) => {
    set({ wordlistRoot });
  },

  hydrate: () => {
    const { url, enabled } = load();
    set({ url, enabled });
  },
}));
