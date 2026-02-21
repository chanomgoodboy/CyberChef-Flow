import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { ArtifactFile } from '@/components/Nodes/ArtifactNode';
import { ContextMenu, type MenuEntry } from './ContextMenu';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'ico', 'svg']);
const TEXT_EXTS = new Set([
  'txt', 'json', 'xml', 'csv', 'md', 'html', 'htm', 'css', 'js', 'ts',
  'log', 'ini', 'cfg', 'yaml', 'yml', 'toml', 'py', 'sh', 'bat',
]);

function getExt(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts: number): string {
  if (!ts) return '\u2014';
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function hexDump(bytes: Uint8Array, maxBytes = 512): string {
  const lines: string[] = [];
  const len = Math.min(bytes.length, maxBytes);
  for (let off = 0; off < len; off += 16) {
    const hex: string[] = [];
    let ascii = '';
    for (let i = 0; i < 16; i++) {
      if (off + i < len) {
        const b = bytes[off + i];
        hex.push(b.toString(16).padStart(2, '0'));
        ascii += b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.';
      } else {
        hex.push('  ');
        ascii += ' ';
      }
    }
    lines.push(
      `${off.toString(16).padStart(8, '0')}  ${hex.slice(0, 8).join(' ')}  ${hex.slice(8).join(' ')}  |${ascii}|`,
    );
  }
  if (bytes.length > maxBytes) {
    lines.push(`... ${bytes.length - maxBytes} more bytes`);
  }
  return lines.join('\n');
}

function downloadFile(file: ArtifactFile) {
  const bytes = base64ToBytes(file.data);
  const blob = new Blob([bytes.buffer as ArrayBuffer]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  Sort                                                               */
/* ------------------------------------------------------------------ */

type SortField = 'name' | 'size' | 'type' | 'date';
type SortDir = 'asc' | 'desc';

function sortFiles(files: ArtifactFile[], field: SortField, dir: SortDir): ArtifactFile[] {
  const cmp = (a: ArtifactFile, b: ArtifactFile): number => {
    switch (field) {
      case 'name': return a.name.localeCompare(b.name);
      case 'size': return a.size - b.size;
      case 'type': return getExt(a.name).localeCompare(getExt(b.name));
      case 'date': return (a.addedAt || 0) - (b.addedAt || 0);
    }
  };
  const sorted = [...files].sort(cmp);
  return dir === 'desc' ? sorted.reverse() : sorted;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface ArtifactBrowserProps {
  files: ArtifactFile[];
  folders: string[];
  onClearBadge?: () => void;
  onAddAsInput?: (file: ArtifactFile) => void;
  onUpdateFiles?: (files: ArtifactFile[]) => void;
  onUpdateFolders?: (folders: string[]) => void;
}

function ArtifactBrowserInner({
  files, folders, onClearBadge, onAddAsInput, onUpdateFiles, onUpdateFolders,
}: ArtifactBrowserProps) {
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [previewHash, setPreviewHash] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; items: MenuEntry[] } | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'auto' | 'text' | 'hex' | 'image'>('auto');
  const newFolderRef = useRef<HTMLInputElement>(null);

  // Clear badge once on mount
  const clearedRef = useRef(false);
  React.useEffect(() => {
    if (!clearedRef.current) {
      clearedRef.current = true;
      onClearBadge?.();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus new-folder input when it appears
  React.useEffect(() => {
    if (creatingFolder) newFolderRef.current?.focus();
  }, [creatingFolder]);

  // Derived: subfolders and files in current path
  const { visibleFolders, visibleFiles } = useMemo(() => {
    const inPath = files.filter((f) => (f.folder || '/') === currentPath);
    const sorted = sortFiles(inPath, sortField, sortDir);

    // Direct child folders of currentPath
    const folderNames = currentPath === '/'
      ? folders.filter((f) => !f.includes('/'))
      : folders
          .filter((f) => f.startsWith(currentPath.slice(1) + '/'))
          .map((f) => f.slice(currentPath.length))
          .filter((f) => f.length > 0 && !f.includes('/'));

    return { visibleFolders: [...new Set(folderNames)], visibleFiles: sorted };
  }, [files, folders, currentPath, sortField, sortDir]);

  const itemCount = visibleFolders.length + visibleFiles.length;
  const previewFile = previewHash ? files.find((f) => f.hash === previewHash) : null;
  const selectedFile = selectedHash ? visibleFiles.find((f) => f.hash === selectedHash) : null;

  const closeCtxMenu = useCallback(() => setCtxMenu(null), []);

  /* ---- Column sort ---- */
  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      setSortDir('asc');
      return field;
    });
  }, []);

  const sortArrow = (field: SortField) =>
    sortField === field ? (sortDir === 'asc' ? ' \u25B4' : ' \u25BE') : '';

  /* ---- Navigation ---- */
  const navigateTo = useCallback((folder: string) => {
    const path = currentPath === '/'
      ? '/' + folder
      : currentPath + '/' + folder;
    setCurrentPath(path);
    setSelectedHash(null);
  }, [currentPath]);

  const navigateUp = useCallback(() => {
    if (currentPath === '/') return;
    const idx = currentPath.lastIndexOf('/');
    setCurrentPath(idx <= 0 ? '/' : currentPath.slice(0, idx));
    setSelectedHash(null);
  }, [currentPath]);

  /* ---- Folder CRUD ---- */
  const commitNewFolder = useCallback(() => {
    const name = newFolderName.trim().replace(/[/\\]/g, '');
    if (name && !visibleFolders.includes(name)) {
      const fullPath = currentPath === '/' ? name : currentPath.slice(1) + '/' + name;
      onUpdateFolders?.([...folders, fullPath]);
    }
    setCreatingFolder(false);
    setNewFolderName('');
  }, [newFolderName, visibleFolders, currentPath, folders, onUpdateFolders]);

  const deleteFolder = useCallback((folderName: string) => {
    const fullPath = currentPath === '/' ? folderName : currentPath.slice(1) + '/' + folderName;
    const folderPathForFiles = currentPath === '/' ? '/' + folderName : currentPath + '/' + folderName;
    // Move files in that folder back to current path
    const updated = files.map((f) =>
      (f.folder || '/') === folderPathForFiles ? { ...f, folder: currentPath } : f,
    );
    onUpdateFiles?.(updated);
    onUpdateFolders?.(folders.filter((f) => f !== fullPath && !f.startsWith(fullPath + '/')));
  }, [currentPath, files, folders, onUpdateFiles, onUpdateFolders]);

  /* ---- File operations ---- */
  const deleteFile = useCallback((hash: string) => {
    onUpdateFiles?.(files.filter((f) => f.hash !== hash));
    if (selectedHash === hash) setSelectedHash(null);
    if (previewHash === hash) setPreviewHash(null);
  }, [files, selectedHash, previewHash, onUpdateFiles]);

  const moveFile = useCallback((hash: string, toFolder: string) => {
    onUpdateFiles?.(files.map((f) => f.hash === hash ? { ...f, folder: toFolder } : f));
  }, [files, onUpdateFiles]);

  const handleDownloadAll = useCallback(() => {
    for (const f of visibleFiles) downloadFile(f);
  }, [visibleFiles]);

  /* ---- Drag & drop ---- */
  const handleDragStart = useCallback((e: React.DragEvent, hash: string) => {
    e.dataTransfer.setData('text/plain', hash);
    // Also set artifact data so canvas can create an input node on drop
    const file = files.find((f) => f.hash === hash);
    if (file) {
      e.dataTransfer.setData(
        'application/cyberweb-artifact',
        JSON.stringify({ name: file.name, size: file.size, data: file.data }),
      );
    }
    e.dataTransfer.effectAllowed = 'copyMove';
  }, [files]);

  const handleFolderDragOver = useCallback((e: React.DragEvent, folderName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(folderName);
  }, []);

  const handleFolderDragLeave = useCallback(() => {
    setDragOverFolder(null);
  }, []);

  const handleFolderDrop = useCallback((e: React.DragEvent, folderName: string) => {
    e.preventDefault();
    setDragOverFolder(null);
    const hash = e.dataTransfer.getData('text/plain');
    if (!hash) return;
    const targetPath = currentPath === '/'
      ? '/' + folderName
      : currentPath + '/' + folderName;
    moveFile(hash, targetPath);
  }, [currentPath, moveFile]);

  // Drop on ".." row to move file up
  const handleUpDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverFolder(null);
    const hash = e.dataTransfer.getData('text/plain');
    if (!hash) return;
    const parentPath = currentPath === '/' ? '/' : (() => {
      const idx = currentPath.lastIndexOf('/');
      return idx <= 0 ? '/' : currentPath.slice(0, idx);
    })();
    moveFile(hash, parentPath);
  }, [currentPath, moveFile]);

  /* ---- Context menus ---- */
  const handleFileContext = useCallback((e: React.MouseEvent, file: ArtifactFile) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedHash(file.hash);
    const moveItems: MenuEntry[] = [];
    // "Move to root" if not already there
    if ((file.folder || '/') !== '/') {
      moveItems.push({ label: 'Move to /', action: () => moveFile(file.hash, '/') });
    }
    // Move to each visible folder
    for (const f of visibleFolders) {
      const targetPath = currentPath === '/' ? '/' + f : currentPath + '/' + f;
      if (targetPath !== (file.folder || '/')) {
        moveItems.push({ label: `Move to ${f}/`, action: () => moveFile(file.hash, targetPath) });
      }
    }
    const items: MenuEntry[] = [
      { label: 'Add as Input', action: () => onAddAsInput?.(file) },
      { label: 'Download', action: () => downloadFile(file) },
    ];
    if (moveItems.length > 0) {
      items.push({ separator: true });
      items.push(...moveItems);
    }
    items.push({ separator: true });
    items.push({ label: 'Delete', action: () => deleteFile(file.hash) });
    setCtxMenu({ x: e.clientX, y: e.clientY, items });
  }, [visibleFolders, currentPath, onAddAsInput, moveFile, deleteFile]);

  const handleFolderContext = useCallback((e: React.MouseEvent, folderName: string) => {
    e.preventDefault();
    e.stopPropagation();
    const items: MenuEntry[] = [
      { label: 'Open', action: () => navigateTo(folderName) },
      { separator: true },
      { label: 'Delete Folder', action: () => deleteFolder(folderName) },
    ];
    setCtxMenu({ x: e.clientX, y: e.clientY, items });
  }, [navigateTo, deleteFolder]);

  const handleEmptyContext = useCallback((e: React.MouseEvent) => {
    // Only fire on the list container itself, not on rows
    if ((e.target as HTMLElement).closest('.af-row')) return;
    e.preventDefault();
    e.stopPropagation();
    const items: MenuEntry[] = [
      { label: 'New Folder', action: () => setCreatingFolder(true) },
      { separator: true },
      { label: 'Download All', action: handleDownloadAll, disabled: visibleFiles.length === 0 },
    ];
    setCtxMenu({ x: e.clientX, y: e.clientY, items });
  }, [handleDownloadAll, visibleFiles.length]);

  /* ---- Preview ---- */
  const MIME_MAP: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp',
    ico: 'image/x-icon', svg: 'image/svg+xml',
  };

  const preview = useMemo(() => {
    if (!previewFile) return null;
    const ext = getExt(previewFile.name);
    const bytes = base64ToBytes(previewFile.data);

    // Determine effective mode
    let mode = previewMode;
    if (mode === 'auto') {
      if (IMAGE_EXTS.has(ext)) mode = 'image';
      else if (TEXT_EXTS.has(ext)) mode = 'text';
      else mode = 'hex';
    }

    switch (mode) {
      case 'image':
        return (
          <div className="af-preview-body af-preview-image">
            <img src={`data:${MIME_MAP[ext] ?? 'application/octet-stream'};base64,${previewFile.data}`} alt={previewFile.name} />
          </div>
        );
      case 'text': {
        const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
        return <div className="af-preview-body"><pre className="af-preview-text">{text}</pre></div>;
      }
      case 'hex':
        return <div className="af-preview-body"><pre className="af-preview-text af-hex">{hexDump(bytes, 4096)}</pre></div>;
    }
  }, [previewFile, previewMode]);

  /* ---- Preview mode ---- */
  if (previewFile) {
    return (
      <div className="af-browser">
        <div className="af-toolbar">
          <button className="af-btn" onClick={() => { setPreviewHash(null); setPreviewMode('auto'); }} title="Back"><i className="fa-solid fa-arrow-left" /></button>
          <span className="af-path">{previewFile.name}</span>
          <span className="af-spacer" />
          <select
            className="af-view-select"
            value={previewMode}
            onChange={(e) => setPreviewMode(e.target.value as 'auto' | 'text' | 'hex' | 'image')}
            title="View mode"
          >
            <option value="auto">Auto</option>
            <option value="text">Text</option>
            <option value="hex">Hex</option>
            <option value="image">Image</option>
          </select>
          <button className="af-btn" onClick={() => onAddAsInput?.(previewFile)} title="Add as input"><i className="fa-solid fa-file-import" /></button>
          <button className="af-btn" onClick={() => downloadFile(previewFile)} title="Download"><i className="fa-solid fa-download" /></button>
        </div>
        <div className="af-info-bar">
          <span>{formatSize(previewFile.size)}</span>
          <span>{getExt(previewFile.name).toUpperCase() || '\u2014'}</span>
          <span className="af-hash" title={previewFile.hash}>{previewFile.hash}</span>
          <span>{formatDate(previewFile.addedAt)}</span>
        </div>
        {preview}
      </div>
    );
  }

  /* ---- Breadcrumb segments ---- */
  const pathSegments = currentPath === '/' ? [] : currentPath.slice(1).split('/');

  /* ---- List mode (Finder) ---- */
  return (
    <div className="af-browser">
      {/* Toolbar */}
      <div className="af-toolbar">
        {currentPath !== '/' && (
          <button className="af-btn" onClick={navigateUp} title="Go up"><i className="fa-solid fa-arrow-left" /></button>
        )}
        <span className="af-breadcrumb">
          <button className="af-crumb" onClick={() => { setCurrentPath('/'); setSelectedHash(null); }}>/</button>
          {pathSegments.map((seg, i) => {
            const path = '/' + pathSegments.slice(0, i + 1).join('/');
            return (
              <React.Fragment key={path}>
                <span className="af-crumb-sep">/</span>
                <button className="af-crumb" onClick={() => { setCurrentPath(path); setSelectedHash(null); }}>
                  {seg}
                </button>
              </React.Fragment>
            );
          })}
        </span>
        <span className="af-spacer" />
        <button className="af-btn" onClick={() => setCreatingFolder(true)} title="New folder"><i className="fa-solid fa-folder-plus" /></button>
        <button className="af-btn" onClick={handleDownloadAll} title="Download all" disabled={visibleFiles.length === 0}>
          <i className="fa-solid fa-download" />
        </button>
        <span className="af-count">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Column headers */}
      <div className="af-colheader">
        <span className="af-col af-col-name" onClick={() => handleSort('name')}>
          Name{sortArrow('name')}
        </span>
        <span className="af-col af-col-size" onClick={() => handleSort('size')}>
          Size{sortArrow('size')}
        </span>
        <span className="af-col af-col-type" onClick={() => handleSort('type')}>
          Type{sortArrow('type')}
        </span>
        <span className="af-col af-col-date" onClick={() => handleSort('date')}>
          Date{sortArrow('date')}
        </span>
      </div>

      {/* File list */}
      <div className="af-list" onContextMenu={handleEmptyContext}>
        {/* ".." row when inside a folder */}
        {currentPath !== '/' && (
          <div
            className={`af-row af-row-folder${dragOverFolder === '..' ? ' af-drop-target' : ''}`}
            onClick={navigateUp}
            onDragOver={(e) => { e.preventDefault(); setDragOverFolder('..'); }}
            onDragLeave={handleFolderDragLeave}
            onDrop={handleUpDrop}
          >
            <span className="af-col af-col-name">..</span>
            <span className="af-col af-col-size" />
            <span className="af-col af-col-type" />
            <span className="af-col af-col-date" />
          </div>
        )}

        {/* Folders */}
        {visibleFolders.map((name) => (
          <div
            key={`folder-${name}`}
            className={`af-row af-row-folder${dragOverFolder === name ? ' af-drop-target' : ''}`}
            onClick={() => navigateTo(name)}
            onContextMenu={(e) => handleFolderContext(e, name)}
            onDragOver={(e) => handleFolderDragOver(e, name)}
            onDragLeave={handleFolderDragLeave}
            onDrop={(e) => handleFolderDrop(e, name)}
          >
            <span className="af-col af-col-name">{name}/</span>
            <span className="af-col af-col-size">\u2014</span>
            <span className="af-col af-col-type">Folder</span>
            <span className="af-col af-col-date" />
          </div>
        ))}

        {/* New folder inline input */}
        {creatingFolder && (
          <div className="af-row af-row-folder af-row-new-folder">
            <input
              ref={newFolderRef}
              className="af-new-folder-input"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitNewFolder();
                if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName(''); }
              }}
              onBlur={commitNewFolder}
              placeholder="folder name..."
            />
          </div>
        )}

        {/* Files */}
        {visibleFiles.map((f, i) => (
          <div
            key={f.hash}
            className={`af-row${selectedHash === f.hash ? ' af-selected' : ''}${i % 2 === 0 ? '' : ' af-row-alt'}`}
            draggable
            onClick={() => setSelectedHash(f.hash)}
            onDoubleClick={() => setPreviewHash(f.hash)}
            onContextMenu={(e) => handleFileContext(e, f)}
            onDragStart={(e) => handleDragStart(e, f.hash)}
          >
            <span className="af-col af-col-name">{f.name}</span>
            <span className="af-col af-col-size">{formatSize(f.size)}</span>
            <span className="af-col af-col-type">{getExt(f.name).toUpperCase() || '\u2014'}</span>
            <span className="af-col af-col-date">{formatDate(f.addedAt)}</span>
          </div>
        ))}

        {itemCount === 0 && !creatingFolder && (
          <div className="af-empty">Empty folder</div>
        )}
      </div>

      {/* Status bar */}
      {selectedFile && (
        <div className="af-status">
          <span>{selectedFile.name}</span>
          <span>{formatSize(selectedFile.size)}</span>
          <span className="af-hash">{selectedFile.hash}</span>
        </div>
      )}

      {ctxMenu && <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={closeCtxMenu} />}
    </div>
  );
}

export const ArtifactBrowser = React.memo(ArtifactBrowserInner);
