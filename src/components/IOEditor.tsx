import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Compartment, EditorState, StateEffect, StateField, type Extension } from '@codemirror/state';
import {
  EditorView,
  keymap,
  drawSelection,
  highlightSpecialChars,
  lineNumbers,
  placeholder as cmPlaceholder,
  Decoration,
  type DecorationSet,
} from '@codemirror/view';
import { highlightSelectionMatches, search, searchKeymap } from '@codemirror/search';
import { highlightActiveLineGutter, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { EOL_OPTIONS, eolCodeToSeq } from '@/utils/eol';
import { ENCODINGS, getEncodingGroups } from '@/utils/chrenc';
import hljs from 'highlight.js/lib/core';

/* Register common highlight.js languages lazily */
const hljsLanguages: Record<string, () => Promise<any>> = {
  javascript: () => import('highlight.js/lib/languages/javascript'),
  typescript: () => import('highlight.js/lib/languages/typescript'),
  python: () => import('highlight.js/lib/languages/python'),
  json: () => import('highlight.js/lib/languages/json'),
  xml: () => import('highlight.js/lib/languages/xml'),
  css: () => import('highlight.js/lib/languages/css'),
  sql: () => import('highlight.js/lib/languages/sql'),
  bash: () => import('highlight.js/lib/languages/bash'),
  yaml: () => import('highlight.js/lib/languages/yaml'),
  markdown: () => import('highlight.js/lib/languages/markdown'),
  java: () => import('highlight.js/lib/languages/java'),
  c: () => import('highlight.js/lib/languages/c'),
  cpp: () => import('highlight.js/lib/languages/cpp'),
  csharp: () => import('highlight.js/lib/languages/csharp'),
  go: () => import('highlight.js/lib/languages/go'),
  rust: () => import('highlight.js/lib/languages/rust'),
  php: () => import('highlight.js/lib/languages/php'),
  ruby: () => import('highlight.js/lib/languages/ruby'),
  powershell: () => import('highlight.js/lib/languages/powershell'),
  ini: () => import('highlight.js/lib/languages/ini'),
  plaintext: () => import('highlight.js/lib/languages/plaintext'),
};

const registeredLangs = new Set<string>();

async function ensureLang(lang: string): Promise<boolean> {
  if (registeredLangs.has(lang)) return true;
  const loader = hljsLanguages[lang];
  if (!loader) return false;
  const mod = await loader();
  hljs.registerLanguage(lang, mod.default);
  registeredLangs.add(lang);
  return true;
}

async function ensureAllLangs(): Promise<void> {
  for (const lang of Object.keys(hljsLanguages)) {
    await ensureLang(lang);
  }
}

const SYNTAX_LANGUAGES = [
  { value: '', label: 'None' },
  { value: 'auto', label: 'Auto' },
  ...Object.keys(hljsLanguages).filter(l => l !== 'plaintext').map(l => ({
    value: l,
    label: l.charAt(0).toUpperCase() + l.slice(1),
  })),
];

/* ------------------------------------------------------------------ */
/*  Theme                                                              */
/* ------------------------------------------------------------------ */

const darkTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '12px',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
  '.cm-content': {
    fontFamily: "var(--font-mono)",
    lineHeight: '1.5',
    padding: '4px 6px',
    caretColor: 'var(--text-primary)',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: "var(--font-mono)",
  },
  '.cm-focused': {
    outline: 'none',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--text-primary)',
  },
  '.cm-selectionBackground': {
    background: 'rgba(74, 158, 255, 0.3) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    background: 'rgba(74, 158, 255, 0.3) !important',
  },
  '.cm-selectionMatch': {
    background: 'rgba(255, 215, 0, 0.35) !important',
    borderRadius: '2px',
  },
  '.cm-gutters': {
    background: 'var(--bg-secondary)',
    border: 'none',
    borderRight: '1px solid var(--border-color)',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    color: 'var(--text-muted)',
    fontSize: '10px',
    padding: '0 4px 0 2px',
    minWidth: '20px',
    textOverflow: 'unset',
    overflow: 'visible',
  },
  '.cm-activeLineGutter': {
    color: 'var(--text-primary) !important',
    background: 'rgba(74, 158, 255, 0.15)',
  },
  '.cm-activeLine': {
    background: 'rgba(74, 158, 255, 0.07)',
  },
  '.cm-placeholder': {
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  '.cm-line': {
    padding: '0',
  },
  '.cm-crosshair-match': {
    background: 'rgba(255, 165, 0, 0.25) !important',
    borderRadius: '2px',
  },
  '.cm-panels': {
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
  },
  '.cm-panels.cm-panels-top': {
    borderBottom: '1px solid var(--border-color)',
  },
  '.cm-search': {
    fontSize: '12px',
    padding: '4px 8px',
    gap: '4px',
  },
  '.cm-search label': {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  '.cm-search input, .cm-search button': {
    fontSize: '12px',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '3px',
    padding: '2px 6px',
  },
  '.cm-search button:hover': {
    background: 'var(--bg-surface-hover)',
  },
  '.cm-searchMatch': {
    background: 'rgba(255, 215, 0, 0.3) !important',
    borderRadius: '2px',
  },
  '.cm-searchMatch-selected': {
    background: 'rgba(74, 158, 255, 0.4) !important',
  },
}, { dark: true });

/* ------------------------------------------------------------------ */
/*  Cross-pane highlight extension                                     */
/* ------------------------------------------------------------------ */

const setCrossHighlight = StateEffect.define<string>();

const crossHighlightMark = Decoration.mark({ class: 'cm-crosshair-match' });

const crossHighlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decos, tr) {
    for (const e of tr.effects) {
      if (e.is(setCrossHighlight)) {
        const needle = e.value;
        if (!needle || needle.length < 2) return Decoration.none;
        const doc = tr.state.doc.toString();
        const marks: { from: number; to: number }[] = [];
        let pos = 0;
        while (pos <= doc.length - needle.length) {
          const idx = doc.indexOf(needle, pos);
          if (idx < 0) break;
          marks.push({ from: idx, to: idx + needle.length });
          pos = idx + 1;
        }
        if (marks.length === 0) return Decoration.none;
        return Decoration.set(marks.map(m => crossHighlightMark.range(m.from, m.to)));
      }
    }
    return decos;
  },
  provide: f => EditorView.decorations.from(f),
});

/* ------------------------------------------------------------------ */
/*  Selection info                                                     */
/* ------------------------------------------------------------------ */

interface SelectionInfo {
  offset: number;
  line: number;
  col: number;
  selLength: number;
  selectedText: string;
}

function getSelectionInfo(state: EditorState): SelectionInfo {
  const main = state.selection.main;
  const offset = main.head;
  const line = state.doc.lineAt(offset);
  const col = offset - line.from + 1;
  const selLength = Math.abs(main.to - main.from);
  const selectedText = selLength >= 2
    ? state.doc.sliceString(main.from, main.to)
    : '';
  return { offset, line: line.number, col, selLength, selectedText };
}

function countLines(s: string): number {
  if (!s) return 0;
  return s.split('\n').length;
}

/* ------------------------------------------------------------------ */
/*  Encoding groups for <select>                                       */
/* ------------------------------------------------------------------ */

const encodingGroups = getEncodingGroups();

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface IOEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  /** Text selected in the OTHER pane, to cross-highlight here */
  crossHighlight?: string;
  /** Called when this pane's selection changes */
  onSelectionChange?: (selectedText: string) => void;
  /** Character encoding value (e.g. 'raw', 'utf-8'). Default 'raw'. */
  chrEnc?: string;
  /** Called when user changes the encoding selector */
  onChrEncChange?: (enc: string) => void;
  /** EOL code (e.g. 'LF', 'CRLF'). Default 'LF'. */
  eolCode?: string;
  /** Called when user changes the EOL selector */
  onEolChange?: (code: string) => void;
  /** Syntax highlight language ('' = none, 'auto' = detect). */
  syntaxLang?: string;
  /** Called when user changes the syntax language selector */
  onSyntaxLangChange?: (lang: string) => void;
}

export const IOEditor = React.memo(function IOEditor({
  value,
  onChange,
  readOnly,
  placeholder,
  className,
  crossHighlight,
  onSelectionChange,
  chrEnc = 'raw',
  onChrEncChange,
  eolCode = 'LF',
  onEolChange,
  syntaxLang = '',
  onSyntaxLangChange,
}: IOEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onSelChangeRef = useRef(onSelectionChange);
  onSelChangeRef.current = onSelectionChange;

  const isExternalUpdate = useRef(false);

  const [selInfo, setSelInfo] = useState<SelectionInfo>({
    offset: 0, line: 1, col: 1, selLength: 0, selectedText: '',
  });

  // Compartment for dynamic lineSeparator updates
  const eolCompartment = useRef(new Compartment());
  const eolSeq = eolCodeToSeq(eolCode);

  // Compartment for toggling line numbers based on line count
  const lineNumCompartment = useRef(new Compartment());
  const hasMultipleLines = value.split('\n').length > 1;

  const extensions = useMemo(() => {
    const exts: Extension[] = [
      darkTheme,
      eolCompartment.current.of(EditorState.lineSeparator.of(eolSeq)),
      lineNumCompartment.current.of(
        hasMultipleLines ? [lineNumbers(), highlightActiveLineGutter()] : [],
      ),
      highlightActiveLine(),
      highlightSpecialChars(),
      drawSelection(),
      highlightSelectionMatches({ minSelectionLength: 2 }),
      search({ top: true }),
      EditorView.lineWrapping,
      crossHighlightField,
      // Intercept paste for file/blob items (images, files dropped from OS).
      EditorView.domEventHandlers({
        paste(event, view) {
          if (!onChangeRef.current) return false;
          const items = event.clipboardData?.items;
          if (!items) return false;
          for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
              event.preventDefault();
              const file = items[i].getAsFile();
              if (!file) continue;
              file.arrayBuffer().then((buf) => {
                const bytes = new Uint8Array(buf);
                const chunks: string[] = [];
                const CHUNK = 8192;
                for (let j = 0; j < bytes.length; j += CHUNK) {
                  chunks.push(String.fromCharCode(...bytes.subarray(j, j + CHUNK)));
                }
                onChangeRef.current?.(chunks.join(''));
              });
              return true;
            }
          }
          // For text paste, let CodeMirror handle it — lineSeparator
          // ensures \r is preserved as content.
          return false;
        },
      }),
      EditorView.updateListener.of((update) => {
        if (update.selectionSet || update.docChanged) {
          const info = getSelectionInfo(update.state);
          setSelInfo(info);
          onSelChangeRef.current?.(info.selectedText);
        }
        if (update.docChanged) {
          if (!isExternalUpdate.current) {
            onChangeRef.current?.(update.state.doc.toString());
          }
          // Toggle line numbers when crossing 1↔2 line threshold
          const wasMulti = update.startState.doc.lines > 1;
          const isMulti = update.state.doc.lines > 1;
          if (wasMulti !== isMulti) {
            update.view.dispatch({
              effects: lineNumCompartment.current.reconfigure(
                isMulti ? [lineNumbers(), highlightActiveLineGutter()] : [],
              ),
            });
          }
        }
      }),
    ];

    if (readOnly) {
      exts.push(
        EditorState.readOnly.of(true),
        keymap.of([...defaultKeymap, ...searchKeymap]),
      );
    } else {
      exts.push(
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
      );
    }

    if (placeholder) {
      exts.push(cmPlaceholder(placeholder));
    }

    return exts;
    // eolSeq is intentionally omitted — we update via Compartment reconfigure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, placeholder]);

  // Create editor on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extensions]);

  // Dynamically reconfigure lineSeparator when EOL changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: eolCompartment.current.reconfigure(
        EditorState.lineSeparator.of(eolSeq),
      ),
    });
  }, [eolSeq]);

  // Sync external value changes into editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      isExternalUpdate.current = true;
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
      });
      isExternalUpdate.current = false;
    }
  }, [value]);

  // Sync cross-pane highlight
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: setCrossHighlight.of(crossHighlight ?? '') });
  }, [crossHighlight]);

  const handleChrEncChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChrEncChange?.(e.target.value);
    },
    [onChrEncChange],
  );

  const handleEolChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onEolChange?.(e.target.value);
    },
    [onEolChange],
  );

  const handleSyntaxChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onSyntaxLangChange?.(e.target.value);
    },
    [onSyntaxLangChange],
  );

  // Syntax-highlighted HTML
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const [detectedLang, setDetectedLang] = useState<string>('');

  useEffect(() => {
    if (!syntaxLang || !readOnly || !value) {
      setHighlightedHtml(null);
      setDetectedLang('');
      return;
    }

    let cancelled = false;

    (async () => {
      if (syntaxLang === 'auto') {
        await ensureAllLangs();
        if (cancelled) return;
        const result = hljs.highlightAuto(value);
        setHighlightedHtml(result.value);
        setDetectedLang(result.language ?? '');
      } else {
        const ok = await ensureLang(syntaxLang);
        if (cancelled || !ok) return;
        const result = hljs.highlight(value, { language: syntaxLang });
        setHighlightedHtml(result.value);
        setDetectedLang(syntaxLang);
      }
    })();

    return () => { cancelled = true; };
  }, [syntaxLang, value, readOnly]);

  const showHighlighted = !!(readOnly && syntaxLang && highlightedHtml !== null);

  return (
    <div className="io-editor-container">
      {showHighlighted && (
        <pre className={`io-syntax-pre${className ? ` ${className}` : ''}`}>
          <code
            className={`hljs${detectedLang ? ` language-${detectedLang}` : ''}`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml! }}
          />
        </pre>
      )}
      <div
        ref={containerRef}
        className={`io-cm-wrap${className ? ` ${className}` : ''}`}
        style={showHighlighted ? { display: 'none' } : undefined}
      />
      <div className="io-status-bar">
        <div className="io-status-lhs">
          <span className="io-stat" title="Length">
            {value.length} chars
          </span>
          <span className="io-stat" title="Lines">
            {countLines(value)} lines
          </span>
          {selInfo.selLength > 0 ? (
            <span className="io-stat io-sel" title="Selection">
              {selInfo.selLength} selected
            </span>
          ) : (
            <span className="io-stat io-cursor" title="Cursor position">
              Ln {selInfo.line}, Col {selInfo.col} | Offset {selInfo.offset}
            </span>
          )}
        </div>
        <div className="io-status-rhs">
          {onSyntaxLangChange && (
            <select
              className="io-status-select"
              value={syntaxLang}
              onChange={handleSyntaxChange}
              title="Syntax highlighting"
            >
              {SYNTAX_LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}{l.value === 'auto' && detectedLang ? ` (${detectedLang})` : ''}
                </option>
              ))}
            </select>
          )}
          <select
            className="io-status-select"
            value={chrEnc}
            onChange={handleChrEncChange}
            title="Character encoding"
          >
            {encodingGroups.map(({ group, options }) => (
              <optgroup key={group} label={group}>
                {options.map((enc) => (
                  <option key={enc.value} value={enc.value}>
                    {enc.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <select
            className="io-status-select"
            value={eolCode}
            onChange={handleEolChange}
            title="End of line sequence"
          >
            {EOL_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.code}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
});
