import { create } from 'zustand';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CribEntry {
  id: string;
  label: string;
  value: string;
}

interface CribState {
  entries: CribEntry[];
  addEntry: (label: string, value: string) => void;
  removeEntry: (id: string) => void;
  updateEntry: (id: string, patch: Partial<Pick<CribEntry, 'label' | 'value'>>) => void;
  hydrate: () => void;
}

/* ------------------------------------------------------------------ */
/*  Persistence                                                        */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'cyberweb_cribs';

function persist(entries: CribEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch { /* storage full or unavailable */ }
}

function load(): CribEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e: any) =>
        typeof e.id === 'string' &&
        typeof e.label === 'string' &&
        typeof e.value === 'string',
    );
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useCribStore = create<CribState>()((set, get) => ({
  entries: [],

  addEntry: (label, value) => {
    const entry: CribEntry = {
      id: crypto.randomUUID(),
      label,
      value,
    };
    const next = [...get().entries, entry];
    persist(next);
    set({ entries: next });
  },

  removeEntry: (id) => {
    const next = get().entries.filter((e) => e.id !== id);
    persist(next);
    set({ entries: next });
  },

  updateEntry: (id, patch) => {
    const next = get().entries.map((e) =>
      e.id === id ? { ...e, ...patch } : e,
    );
    persist(next);
    set({ entries: next });
  },

  hydrate: () => {
    set({ entries: load() });
  },
}));
