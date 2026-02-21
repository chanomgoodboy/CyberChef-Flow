import { useEffect, useRef } from 'react';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { recipeToGraph, type RecipeStep } from '@/utils/recipeConverter';
import { graphToCompactV2, decodeGraph } from '@/utils/urlCodec';

/* ------------------------------------------------------------------ */
/*  Compression + Base64 helpers                                       */
/* ------------------------------------------------------------------ */

async function compress(str: string): Promise<string> {
  const input = new TextEncoder().encode(str);
  const cs = new CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  writer.write(input);
  writer.close();

  const chunks: Uint8Array[] = [];
  const reader = cs.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLen = chunks.reduce((s, c) => s + c.length, 0);
  const merged = new Uint8Array(totalLen);
  let offset = 0;
  for (const c of chunks) { merged.set(c, offset); offset += c.length; }

  return btoa(String.fromCharCode(...merged))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function decompress(b64: string): Promise<string> {
  let std = b64.replace(/-/g, '+').replace(/_/g, '/');
  while (std.length % 4) std += '=';

  const binary = atob(std);
  const input = Uint8Array.from(binary, (c) => c.charCodeAt(0));

  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(input);
  writer.close();

  const chunks: Uint8Array[] = [];
  const reader = ds.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLen = chunks.reduce((s, c) => s + c.length, 0);
  const merged = new Uint8Array(totalLen);
  let offset = 0;
  for (const c of chunks) { merged.set(c, offset); offset += c.length; }

  return new TextDecoder().decode(merged);
}

function fromBase64(b64: string): string {
  return new TextDecoder().decode(
    Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)),
  );
}

/* ------------------------------------------------------------------ */
/*  CyberChef recipe format (for backward-compatible loading)          */
/* ------------------------------------------------------------------ */

function prettyStringToRecipe(str: string): RecipeStep[] {
  const recipe: RecipeStep[] = [];
  let i = 0;

  while (i < str.length) {
    const parenIdx = str.indexOf('(', i);
    if (parenIdx < 0) break;
    const opName = str.slice(i, parenIdx).replace(/_/g, ' ');

    let depth = 1;
    let j = parenIdx + 1;
    while (j < str.length && depth > 0) {
      if (str[j] === "'") {
        j++;
        while (j < str.length && str[j] !== "'") {
          if (str[j] === '\\') j++;
          j++;
        }
      } else if (str[j] === '(') {
        depth++;
      } else if (str[j] === ')') {
        depth--;
      }
      j++;
    }

    const argsStr = str.slice(parenIdx + 1, j - 1);
    i = j;

    const jsonArgs = '[' + argsStr
      .replace(/\\'/g, '\x00')
      .replace(/'((?:[^'\\]|\\.)*)'/g, '"$1"')
      .replace(/\x00/g, "'")
      + ']';

    try {
      recipe.push({ op: opName, args: JSON.parse(jsonArgs) });
    } catch {
      recipe.push({ op: opName, args: [] });
    }
  }

  return recipe;
}

/* ------------------------------------------------------------------ */
/*  URL hash helpers                                                   */
/* ------------------------------------------------------------------ */

function getHashParams(): Record<string, string> {
  const href = window.location.href;
  const hashIdx = href.indexOf('#');
  if (hashIdx < 0) return {};

  const hash = href.slice(hashIdx + 1);
  const params: Record<string, string> = {};

  for (const part of hash.split('&')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx < 0) continue;
    const key = decodeURIComponent(part.slice(0, eqIdx));
    const value = decodeURIComponent(part.slice(eqIdx + 1));
    params[key] = value;
  }

  return params;
}

function setHash(hash: string): void {
  if (!hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  } else {
    history.replaceState(null, '', `#${hash}`);
  }
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

const URL_WRITE_DEBOUNCE_MS = 1000;

export function useURLState(): void {
  const loadedRef = useRef(false);

  // --- Load from URL once on mount ---
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const params = getHashParams();

    // Restore sidebar state: s=0 means hidden
    if (params.s === '0') {
      useUIStore.getState().setSidebarOpen(false);
    }

    if (params.g) {
      decompress(params.g)
        .then((json) => {
          const result = decodeGraph(JSON.parse(json));
          if (result && result.nodes.length > 0) {
            const store = useGraphStore.getState();
            store.captureSnapshot();
            useGraphStore.setState(result);
          }
        })
        .catch(() => {
          try {
            const result = decodeGraph(JSON.parse(fromBase64(params.g)));
            if (result && result.nodes.length > 0) {
              const store = useGraphStore.getState();
              store.captureSnapshot();
              useGraphStore.setState(result);
            }
          } catch { /* ignore */ }
        });
      return;
    }

    // Legacy CyberChef format: #recipe=...&input=...
    if (!params.recipe && !params.input) return;

    const recipe = params.recipe ? prettyStringToRecipe(params.recipe) : [];
    const inputText = params.input
      ? (() => { try { return fromBase64(params.input); } catch { return params.input; } })()
      : '';

    if (recipe.length > 0) {
      const { nodes, edges } = recipeToGraph(recipe);
      const inputNode = nodes.find((n) => n.type === 'input');
      if (inputNode && inputText) {
        inputNode.data = { ...inputNode.data, inputValue: inputText };
      }
      const store = useGraphStore.getState();
      store.captureSnapshot();
      useGraphStore.setState({ nodes, edges });
    } else if (inputText) {
      const store = useGraphStore.getState();
      const inputNode = store.nodes.find((n) => n.type === 'input');
      if (inputNode) {
        store.updateNodeData(inputNode.id, { inputValue: inputText });
      }
    }
  }, []);

  // --- Background URL writer: updates URL hash when graph changes ---
  // Uses requestIdleCallback so it never blocks user interaction.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let generation = 0;

    function scheduleWrite() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        const gen = ++generation;

        const doWork = async () => {
          const { nodes, edges } = useGraphStore.getState();
          const { sidebarOpen } = useUIStore.getState();

          // Empty or default graph — clear the hash
          if (nodes.length <= 1 && edges.length === 0) {
            const only = nodes[0];
            if (!only || (only.type === 'input' && !(only.data?.inputValue as string))) {
              setHash(sidebarOpen ? '' : 's=0');
              return;
            }
          }

          const compact = graphToCompactV2(nodes, edges);
          const json = JSON.stringify(compact);
          const compressed = await compress(json);

          // Only write if no newer update was scheduled
          if (gen === generation) {
            const parts = [`g=${compressed}`];
            if (!sidebarOpen) parts.push('s=0');
            setHash(parts.join('&'));
          }
        };

        if (typeof requestIdleCallback === 'function') {
          requestIdleCallback(() => { doWork(); });
        } else {
          setTimeout(() => { doWork(); }, 0);
        }
      }, URL_WRITE_DEBOUNCE_MS);
    }

    const unsubGraph = useGraphStore.subscribe(scheduleWrite);
    const unsubUI = useUIStore.subscribe(
      (state, prev) => { if (state.sidebarOpen !== prev.sidebarOpen) scheduleWrite(); },
    );

    return () => {
      unsubGraph();
      unsubUI();
      if (timer) clearTimeout(timer);
      generation++; // cancel any in-flight async work
    };
  }, []);
}
