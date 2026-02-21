/**
 * xterm.js-based terminal output for backend operations.
 *
 * Renders raw PTY data (ANSI colors, \r progress bars, etc.) like a real
 * terminal — same approach as ttyd.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import '@xterm/xterm/css/xterm.css';

interface TerminalOutputProps {
  /** Accumulated raw PTY output (may contain ANSI codes, \r, etc.) */
  value: string;
  className?: string;
  /** Called when the terminal is resized (cols/rows change after FitAddon fits). */
  onResize?: (cols: number, rows: number) => void;
}

const SEARCH_DECORATIONS = {
  matchBackground: '#ffd70040',
  matchBorder: '#ffd70060',
  matchOverviewRuler: '#ffd700',
  activeMatchBackground: '#4a9eff60',
  activeMatchBorder: '#4a9eff',
  activeMatchColorOverviewRuler: '#4a9eff',
} as const;

export default function TerminalOutput({ value, className, onResize }: TerminalOutputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const searchRef = useRef<SearchAddon | null>(null);
  const writtenRef = useRef(0);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [resultIndex, setResultIndex] = useState(-1);
  const [resultCount, setResultCount] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize terminal on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      fontSize: 11,
      fontFamily: '"MesloLGS NF", "JetBrainsMono Nerd Font", "FiraCode Nerd Font", "Hack Nerd Font", Menlo, Consolas, monospace',
      letterSpacing: 0,
      lineHeight: 1.05,
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        cursorAccent: '#0d1117',
        selectionBackground: 'rgba(56, 139, 253, 0.3)',
        selectionForeground: '#ffffff',
        black: '#484f58',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39d353',
        white: '#b1bac4',
        brightBlack: '#6e7681',
        brightRed: '#ffa198',
        brightGreen: '#56d364',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#56d364',
        brightWhite: '#f0f6fc',
      },
      allowProposedApi: true,
      disableStdin: true,
      cursorStyle: 'underline',
      cursorBlink: false,
      scrollback: 5000,
      convertEol: false,
    });

    const fit = new FitAddon();
    const searchAddon = new SearchAddon();
    term.loadAddon(fit);
    term.loadAddon(searchAddon);
    term.open(containerRef.current);
    fit.fit();
    onResize?.(term.cols, term.rows);

    // Listen for search result changes
    searchAddon.onDidChangeResults((e) => {
      setResultIndex(e.resultIndex);
      setResultCount(e.resultCount);
    });

    termRef.current = term;
    fitRef.current = fit;
    searchRef.current = searchAddon;
    writtenRef.current = 0;

    // Resize observer — report new cols/rows after each fit
    const ro = new ResizeObserver(() => {
      fit.fit();
      onResize?.(term.cols, term.rows);
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
      searchRef.current = null;
      writtenRef.current = 0;
    };
  }, []);

  // Incrementally write new data
  useEffect(() => {
    const term = termRef.current;
    if (!term || !value) return;

    if (writtenRef.current < value.length) {
      const newData = value.slice(writtenRef.current);
      term.write(newData);
      writtenRef.current = value.length;
    }
  }, [value]);

  // Keyboard shortcut: Ctrl/Cmd+F to open search
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        e.stopPropagation();
        setSearchOpen(true);
      }
    };
    el.addEventListener('keydown', handler, true);
    return () => el.removeEventListener('keydown', handler, true);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }
  }, [searchOpen]);

  // Run search when query changes
  useEffect(() => {
    const sa = searchRef.current;
    if (!sa) return;
    if (!searchQuery) {
      sa.clearDecorations();
      setResultIndex(-1);
      setResultCount(0);
      return;
    }
    sa.findNext(searchQuery, { incremental: true, decorations: SEARCH_DECORATIONS });
  }, [searchQuery]);

  const findNext = useCallback(() => {
    searchRef.current?.findNext(searchQuery, { decorations: SEARCH_DECORATIONS });
  }, [searchQuery]);

  const findPrev = useCallback(() => {
    searchRef.current?.findPrevious(searchQuery, { decorations: SEARCH_DECORATIONS });
  }, [searchQuery]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    searchRef.current?.clearDecorations();
    setResultIndex(-1);
    setResultCount(0);
  }, []);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) findPrev();
      else findNext();
    }
  }, [closeSearch, findNext, findPrev]);

  return (
    <div className={`term-search-wrap${className ? ` ${className}` : ''}`}>
      {searchOpen && (
        <div className="term-search-bar">
          <input
            ref={searchInputRef}
            className="term-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search..."
            spellCheck={false}
          />
          {searchQuery && (
            <span className="term-search-count">
              {resultCount > 0 ? `${resultIndex + 1}/${resultCount}` : 'No results'}
            </span>
          )}
          <button className="term-search-btn" onClick={findPrev} title="Previous (Shift+Enter)">
            <i className="fa-solid fa-chevron-up" />
          </button>
          <button className="term-search-btn" onClick={findNext} title="Next (Enter)">
            <i className="fa-solid fa-chevron-down" />
          </button>
          <button className="term-search-btn" onClick={closeSearch} title="Close (Esc)">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}
      <div
        ref={containerRef}
        className="term-container"
        style={{ width: '100%', height: '100%', minHeight: 100 }}
      />
    </div>
  );
}
