import React, { useCallback, useRef, useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useGraphStore } from '@/store/graphStore';
import { useExecutionStore } from '@/store/executionStore';
import { ExecutionControls } from './ExecutionControls';
import { downloadGraph, deserializeGraph } from '@/utils/graphSerializer';
import { CribSettingsModal } from '@/components/Modals/CribSettingsModal';
import { BackendSettingsModal } from '@/components/Modals/BackendSettingsModal';
import { BackendIndicator } from './BackendIndicator';
import { copyDebugDump } from '@/utils/debugExport';

interface MainToolbarProps {
  onRun?: () => void;
}

export const MainToolbar = React.memo(function MainToolbar({
  onRun,
}: MainToolbarProps) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const undo = useGraphStore((s) => s.undo);
  const redo = useGraphStore((s) => s.redo);
  const canUndo = useGraphStore((s) => s.canUndo);
  const canRedo = useGraphStore((s) => s.canRedo);
  const setNodes = useGraphStore((s) => s.setNodes);
  const setEdges = useGraphStore((s) => s.setEdges);
  const ensureInputNode = useGraphStore((s) => s.ensureInputNode);
  const clearResults = useExecutionStore((s) => s.clearResults);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cribModalOpen, setCribModalOpen] = useState(false);
  const [backendModalOpen, setBackendModalOpen] = useState(false);
  const [debugCopied, setDebugCopied] = useState(false);

  const results = useExecutionStore((s) => s.results);

  const handleDebug = useCallback(async () => {
    await copyDebugDump(nodes, edges, results);
    setDebugCopied(true);
    setTimeout(() => setDebugCopied(false), 2000);
  }, [nodes, edges, results]);

  const handleNewGraph = useCallback(() => {
    if (window.confirm('Create a new empty graph? Unsaved changes will be lost.')) {
      setNodes([]);
      setEdges([]);
      clearResults();
      ensureInputNode();
    }
  }, [setNodes, setEdges, clearResults, ensureInputNode]);

  const handleSave = useCallback(() => {
    downloadGraph('graph', nodes, edges);
  }, [nodes, edges]);

  const handleLoad = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      file.text().then((json) => {
        try {
          const { nodes: n, edges: ed } = deserializeGraph(json);
          setNodes(n);
          setEdges(ed);
          clearResults();
        } catch (err: any) {
          alert(`Failed to load graph: ${err?.message ?? err}`);
        }
      });
      e.target.value = '';
    },
    [setNodes, setEdges, clearResults],
  );

  return (
    <div className="main-toolbar">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.cyberweb.json"
        className="input-file-hidden"
        onChange={handleFileSelect}
      />

      <div className="toolbar-left">
        <button
          className="toolbar-btn sidebar-toggle"
          onClick={toggleSidebar}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          <i className="fa-solid fa-bars" />
        </button>
        <span className="toolbar-brand">CyberWeb</span>
        <button className="toolbar-btn toolbar-mobile-clear" onClick={handleNewGraph} title="New graph">
          New
        </button>
      </div>

      <div className="toolbar-center">
        <button className="toolbar-btn" onClick={handleNewGraph} title="New graph">
          New
        </button>

        <span className="toolbar-separator" />

        <button className="toolbar-btn" onClick={handleSave} title="Save graph to file">
          Save
        </button>
        <button className="toolbar-btn" onClick={handleLoad} title="Load graph from file">
          Load
        </button>

        <span className="toolbar-separator" />

        <button className="toolbar-btn" onClick={undo} disabled={!canUndo} title="Undo">
          <i className="fa-solid fa-rotate-left" /> Undo
        </button>
        <button className="toolbar-btn" onClick={redo} disabled={!canRedo} title="Redo">
          <i className="fa-solid fa-rotate-right" /> Redo
        </button>
      </div>

      <div className="toolbar-right">
        <BackendIndicator onClick={() => setBackendModalOpen(true)} />
        <button
          className="toolbar-btn"
          onClick={handleDebug}
          title="Copy debug dump to clipboard"
        >
          {debugCopied ? 'Copied!' : <i className="fa-solid fa-bug" />}
        </button>
        <button
          className="toolbar-btn"
          onClick={() => setCribModalOpen(true)}
          title="Cribs & Secrets"
        >
          <i className="fa-solid fa-key" />
        </button>
        <ExecutionControls onRun={onRun} />
        <CribSettingsModal
          isOpen={cribModalOpen}
          onClose={() => setCribModalOpen(false)}
        />
        <BackendSettingsModal
          isOpen={backendModalOpen}
          onClose={() => setBackendModalOpen(false)}
        />
      </div>
    </div>
  );
});
