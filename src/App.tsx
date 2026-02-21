import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { FlowCanvas } from './components/Canvas/FlowCanvas';
import { OperationPalette } from './components/Sidebar/OperationPalette';
import { MainToolbar } from './components/Toolbar/MainToolbar';
import { CommandPalette } from './components/CommandPalette';
import { ProbePane } from './components/ProbePane';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useGraphExecution } from './hooks/useGraphExecution';
import { useURLState } from './hooks/useURLState';
import { useGraphStore } from './store/graphStore';
import { useCribStore } from './store/cribStore';
import { useBackendStore } from './store/backendStore';
import { getWorkerBridge } from './worker/WorkerBridge';
import '@xyflow/react/dist/style.css';

export default function App() {
  useKeyboardShortcuts();
  const { runGraph } = useGraphExecution();
  useURLState();
  const ensureInputNode = useGraphStore((s) => s.ensureInputNode);

  useEffect(() => {
    ensureInputNode();
    // Expose stores and fuzz helper for E2E tests (dev only)
    if (import.meta.env.DEV) {
      (window as any).__ZUSTAND_GRAPHSTORE__ = useGraphStore;
      import('./utils/fuzzHelper').then(({ initFuzzHelper }) => initFuzzHelper());
    }
  }, [ensureInputNode]);

  useEffect(() => {
    useCribStore.getState().hydrate();
  }, []);

  // Backend: hydrate settings, sync to worker, listen for status updates
  useEffect(() => {
    useBackendStore.getState().hydrate();
  }, []);
  useEffect(() => {
    const bridge = getWorkerBridge();
    const { url, enabled } = useBackendStore.getState();
    bridge.syncBackendSettings(url, enabled);
    bridge.onBackendStatus((status, error, tools, wordlistRoot) => {
      useBackendStore.getState().setStatus(status, error);
      if (tools) useBackendStore.getState().setTools(tools);
      if (wordlistRoot) useBackendStore.getState().setWordlistRoot(wordlistRoot);
    });
    return useBackendStore.subscribe((s, prev) => {
      if (s.url !== prev.url || s.enabled !== prev.enabled) {
        bridge.syncBackendSettings(s.url, s.enabled);
      }
    });
  }, []);

  return (
    <ReactFlowProvider>
      <div className="cyberweb-app">
        <MainToolbar onRun={runGraph} />
        <div className="cyberweb-main">
          <OperationPalette />
          <FlowCanvas onRun={runGraph} />
          <ProbePane />
        </div>
        <CommandPalette />
      </div>
    </ReactFlowProvider>
  );
}
