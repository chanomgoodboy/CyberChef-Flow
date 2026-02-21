import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getWorkerBridge } from '@/worker/WorkerBridge';
import { useBackendStore } from '@/store/backendStore';

interface WordlistBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (fullPath: string) => void;
}

interface DirEntry {
  folders: string[];
  files: { name: string; size: number }[];
}

interface SearchHit {
  relPath: string;
  name: string;
  size: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export const WordlistBrowser = React.memo(function WordlistBrowser({
  isOpen,
  onClose,
  onSelect,
}: WordlistBrowserProps) {
  const wordlistRoot = useBackendStore((s) => s.wordlistRoot);
  const backendStatus = useBackendStore((s) => s.status);

  const [currentPath, setCurrentPath] = useState('');
  const [listing, setListing] = useState<DirEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Search results from backend (recursive)
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  // Cache directory listings
  const cache = useRef(new Map<string, DirEntry>());

  const fetchDir = useCallback(async (relPath: string) => {
    const cached = cache.current.get(relPath);
    if (cached) {
      setListing(cached);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getWorkerBridge().listDir(relPath);
      cache.current.set(relPath, result);
      setListing(result);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to list directory');
      setListing(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on open and path change (only when not searching)
  useEffect(() => {
    if (isOpen && backendStatus === 'connected' && !search) {
      fetchDir(currentPath);
    }
  }, [isOpen, currentPath, backendStatus, fetchDir, search]);

  // Debounced recursive search
  useEffect(() => {
    if (!isOpen || backendStatus !== 'connected') return;

    if (!search) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await getWorkerBridge().searchWordlists(search);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [isOpen, backendStatus, search]);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setCurrentPath('');
      setSelectedFile(null);
      setSearch('');
      setError(null);
      setSearchResults([]);
      cache.current.clear();
    }
  }, [isOpen]);

  const navigateTo = useCallback((folder: string) => {
    setCurrentPath((prev) => (prev ? `${prev}/${folder}` : folder));
    setSelectedFile(null);
    setSearch('');
  }, []);

  const navigateUp = useCallback(() => {
    setCurrentPath((prev) => {
      const idx = prev.lastIndexOf('/');
      return idx === -1 ? '' : prev.slice(0, idx);
    });
    setSelectedFile(null);
    setSearch('');
  }, []);

  const navigateToBreadcrumb = useCallback((index: number) => {
    if (index < 0) {
      setCurrentPath('');
    } else {
      const segments = currentPath.split('/');
      setCurrentPath(segments.slice(0, index + 1).join('/'));
    }
    setSelectedFile(null);
    setSearch('');
  }, [currentPath]);

  const handleSelect = useCallback(() => {
    if (!selectedFile) return;

    if (search && searchResults.length > 0) {
      // In search mode, selectedFile is the relPath
      const fullPath = `${wordlistRoot}/${selectedFile}`;
      onSelect(fullPath);
    } else {
      const fullPath = currentPath
        ? `${wordlistRoot}/${currentPath}/${selectedFile}`
        : `${wordlistRoot}/${selectedFile}`;
      onSelect(fullPath);
    }
    onClose();
  }, [selectedFile, currentPath, wordlistRoot, search, searchResults, onSelect, onClose]);

  const handleDoubleClickFile = useCallback((fileIdentifier: string) => {
    let fullPath: string;
    if (search) {
      // In search mode, fileIdentifier is the relPath
      fullPath = `${wordlistRoot}/${fileIdentifier}`;
    } else {
      fullPath = currentPath
        ? `${wordlistRoot}/${currentPath}/${fileIdentifier}`
        : `${wordlistRoot}/${fileIdentifier}`;
    }
    onSelect(fullPath);
    onClose();
  }, [currentPath, wordlistRoot, search, onSelect, onClose]);

  const handleSort = useCallback((col: 'name' | 'size') => {
    if (sortBy === col) {
      setSortAsc((prev) => !prev);
    } else {
      setSortBy(col);
      setSortAsc(true);
    }
  }, [sortBy]);

  // Breadcrumb segments
  const breadcrumbs = useMemo(() => {
    if (!currentPath) return [];
    return currentPath.split('/');
  }, [currentPath]);

  // Filter and sort for directory browsing mode
  const filteredFolders = useMemo(() => {
    if (!listing || search) return [];
    const sorted = [...listing.folders].sort((a, b) => a.localeCompare(b));
    return sortAsc ? sorted : sorted.reverse();
  }, [listing, search, sortAsc]);

  const filteredFiles = useMemo(() => {
    if (!listing || search) return [];
    const sorted = [...listing.files].sort((a, b) => {
      if (sortBy === 'size') return sortAsc ? a.size - b.size : b.size - a.size;
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });
    return sorted;
  }, [listing, search, sortBy, sortAsc]);

  // Sort search results
  const sortedSearchResults = useMemo(() => {
    if (!search) return [];
    const sorted = [...searchResults].sort((a, b) => {
      if (sortBy === 'size') return sortAsc ? a.size - b.size : b.size - a.size;
      return sortAsc ? a.relPath.localeCompare(b.relPath) : b.relPath.localeCompare(a.relPath);
    });
    return sorted;
  }, [searchResults, sortBy, sortAsc, search]);

  const isSearchMode = !!search;
  const totalItems = isSearchMode
    ? sortedSearchResults.length
    : filteredFolders.length + filteredFiles.length;

  const rootLabel = wordlistRoot
    ? wordlistRoot.split('/').pop() || wordlistRoot
    : 'Wordlists';

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="wl-browser" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3 className="modal-title">Browse Wordlists</h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="wl-toolbar">
          <button
            className="wl-back-btn"
            onClick={navigateUp}
            disabled={!currentPath || isSearchMode}
            title="Go up"
          >
            <i className="fa-solid fa-arrow-up" />
          </button>
          <div className="wl-breadcrumbs">
            <span
              className="wl-crumb wl-crumb-root"
              onClick={() => navigateToBreadcrumb(-1)}
              title={wordlistRoot}
            >
              {rootLabel}
            </span>
            {!isSearchMode && breadcrumbs.map((seg, i) => (
              <React.Fragment key={i}>
                <span className="wl-crumb-sep">/</span>
                <span
                  className={`wl-crumb ${i === breadcrumbs.length - 1 ? 'wl-crumb-active' : ''}`}
                  onClick={() => navigateToBreadcrumb(i)}
                >
                  {seg}
                </span>
              </React.Fragment>
            ))}
            {isSearchMode && (
              <>
                <span className="wl-crumb-sep">/</span>
                <span className="wl-crumb wl-crumb-active">Search results</span>
              </>
            )}
          </div>
          <input
            type="text"
            className="wl-search"
            placeholder="Search all..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Column headers */}
        <div className="wl-col-headers">
          <span className="wl-col-name" onClick={() => handleSort('name')}>
            Name {sortBy === 'name' ? (sortAsc ? '\u25B2' : '\u25BC') : ''}
          </span>
          <span className="wl-col-size" onClick={() => handleSort('size')}>
            Size {sortBy === 'size' ? (sortAsc ? '\u25B2' : '\u25BC') : ''}
          </span>
        </div>

        {/* File list */}
        <div className="wl-list" ref={listRef}>
          {backendStatus !== 'connected' ? (
            <div className="wl-empty">Backend not connected</div>
          ) : !wordlistRoot ? (
            <div className="wl-empty">No wordlist root configured on backend</div>
          ) : isSearchMode ? (
            // Search results mode
            searching ? (
              <div className="wl-empty">Searching...</div>
            ) : sortedSearchResults.length === 0 ? (
              <div className="wl-empty">No matches</div>
            ) : (
              sortedSearchResults.map((hit) => (
                <div
                  key={hit.relPath}
                  className={`wl-row wl-row-file ${selectedFile === hit.relPath ? 'wl-selected' : ''}`}
                  onClick={() => setSelectedFile(hit.relPath)}
                  onDoubleClick={() => handleDoubleClickFile(hit.relPath)}
                >
                  <span className="wl-row-icon">
                    <i className="fa-solid fa-file-lines" />
                  </span>
                  <span className="wl-row-name" title={hit.relPath}>{hit.relPath}</span>
                  <span className="wl-row-size">{formatSize(hit.size)}</span>
                </div>
              ))
            )
          ) : loading ? (
            <div className="wl-empty">Loading...</div>
          ) : error ? (
            <div className="wl-empty wl-error">{error}</div>
          ) : totalItems === 0 ? (
            <div className="wl-empty">Empty directory</div>
          ) : (
            <>
              {filteredFolders.map((folder) => (
                <div
                  key={`d:${folder}`}
                  className="wl-row wl-row-folder"
                  onClick={() => navigateTo(folder)}
                >
                  <span className="wl-row-icon">
                    <i className="fa-solid fa-folder" />
                  </span>
                  <span className="wl-row-name">{folder}</span>
                  <span className="wl-row-size" />
                </div>
              ))}
              {filteredFiles.map((file) => (
                <div
                  key={`f:${file.name}`}
                  className={`wl-row wl-row-file ${selectedFile === file.name ? 'wl-selected' : ''}`}
                  onClick={() => setSelectedFile(file.name)}
                  onDoubleClick={() => handleDoubleClickFile(file.name)}
                >
                  <span className="wl-row-icon">
                    <i className="fa-solid fa-file-lines" />
                  </span>
                  <span className="wl-row-name">{file.name}</span>
                  <span className="wl-row-size">{formatSize(file.size)}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="wl-footer">
          <span className="wl-footer-info">
            {totalItems} item{totalItems !== 1 ? 's' : ''}
            {selectedFile && (
              <>
                {' \u2014 '}
                <span className="wl-footer-path">
                  {selectedFile}
                </span>
              </>
            )}
          </span>
          <div className="wl-footer-actions">
            <button className="modal-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="modal-btn primary"
              disabled={!selectedFile}
              onClick={handleSelect}
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
