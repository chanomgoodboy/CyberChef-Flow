import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useGraphStore } from '@/store/graphStore';
import { useExecutionStore } from '@/store/executionStore';
import { IOEditor } from './IOEditor';
import { ZoomableImage } from './ZoomableImage';
import { ContextMenu, type MenuEntry } from './ContextMenu';
import { saveOutputToFile } from '@/utils/fileIO';
import { MagicBadge } from '@/components/NodeParts/MagicBadge';
import { MagicTable } from '@/components/MagicTable';
import { CipherIdTable } from '@/components/CipherIdTable';
import { reDecodeString } from '@/utils/chrenc';
import { copyToClipboard } from '@/utils/clipboard';
import { executeFromNode } from '@/hooks/useGraphExecution';
import DOMPurify from 'dompurify';
import TerminalOutput from './TerminalOutput';
import { getWorkerBridge } from '@/worker/WorkerBridge';
import { ArtifactBrowser } from './ArtifactBrowser';
import type { ArtifactFile } from '@/components/Nodes/ArtifactNode';
import { createNodeId } from '@/utils/id';


export const ProbePane = React.memo(function ProbePane() {
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const addNode = useGraphStore((s) => s.addNode);
  const results = useExecutionStore((s) => s.results);
  const isRunning = useExecutionStore((s) => s.isRunning);
  const paneRef = useRef<HTMLDivElement>(null);

  // --- Resize state ---
  const [paneWidth, setPaneWidth] = useState<number | null>(null);
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [isResizingWidth, setIsResizingWidth] = useState(false);
  const [isResizingSplit, setIsResizingSplit] = useState(false);

  // --- Mobile detection ---
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // --- Maximize state: null = split view, 'input' or 'output' = maximized ---
  const [maximizedSection, setMaximizedSection] = useState<'input' | 'output' | null>(null);
  // On mobile: whether the pane is expanded to full screen
  const [mobileMaximized, setMobileMaximized] = useState(false);

  // On mobile, always show single-pane (default to output)
  const activeSection = isMobile
    ? (maximizedSection ?? 'output')
    : maximizedSection;

  const toggleMaximize = useCallback((section: 'input' | 'output') => {
    if (isMobile) {
      // On mobile, toggle full-screen for the pane
      setMaximizedSection(section);
      setMobileMaximized((prev) => !prev);
    } else {
      setMaximizedSection((prev) => (prev === section ? null : section));
    }
  }, [isMobile]);

  // --- Mobile pane height resize ---
  const [mobilePaneHeight, setMobilePaneHeight] = useState<number | null>(null);
  const [isResizingMobile, setIsResizingMobile] = useState(false);

  const handleMobileHandleDown = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsResizingMobile(true);
  }, []);

  useEffect(() => {
    if (!isResizingMobile) return;
    const getY = (e: MouseEvent | TouchEvent) =>
      'touches' in e ? e.touches[0].clientY : e.clientY;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const y = getY(e);
      const vh = window.innerHeight;
      const toolbarH = 37; // mobile toolbar
      const newH = vh - y;
      // Clamp between 15% and 90% of usable area
      const usable = vh - toolbarH;
      setMobilePaneHeight(Math.max(usable * 0.15, Math.min(usable * 0.9, newH)));
    };
    const onEnd = () => setIsResizingMobile(false);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.body.style.userSelect = '';
    };
  }, [isResizingMobile]);

  // --- Width resize ---
  const handleWidthMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingWidth(true);
  }, []);

  useEffect(() => {
    if (!isResizingWidth) return;
    const onMouseMove = (e: MouseEvent) => {
      const parentWidth = paneRef.current?.parentElement?.clientWidth;
      if (!parentWidth) return;
      const newWidth = parentWidth - e.clientX;
      setPaneWidth(Math.max(200, Math.min(parentWidth * 0.8, newWidth)));
    };
    const onMouseUp = () => setIsResizingWidth(false);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingWidth]);

  // --- Split resize ---
  const handleSplitMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSplit(true);
  }, []);

  useEffect(() => {
    if (!isResizingSplit) return;
    const onMouseMove = (e: MouseEvent) => {
      const pane = paneRef.current;
      if (!pane) return;
      const rect = pane.getBoundingClientRect();
      const ratio = (e.clientY - rect.top) / rect.height;
      setSplitRatio(Math.max(0.15, Math.min(0.85, ratio)));
    };
    const onMouseUp = () => setIsResizingSplit(false);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingSplit]);

  const selectedNode = useMemo(
    () => (selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null),
    [nodes, selectedNodeId],
  );

  const firstInputNode = useMemo(
    () => nodes.find((n) => n.type === 'input'),
    [nodes],
  );

  const selectedUpstreamSourceId = useUIStore((s) => s.selectedUpstreamSourceId);
  const setSelectedUpstreamSourceId = useUIStore((s) => s.setSelectedUpstreamSourceId);

  // Build a map of input node ID → "Input 1", "Input 2", etc.
  const inputNodeLabels = useMemo(() => {
    const labels = new Map<string, string>();
    const inputNodes = nodes.filter((n) => n.type === 'input');
    inputNodes.forEach((n, i) => {
      labels.set(n.id, inputNodes.length > 1 ? `Input ${i + 1}` : 'Input');
    });
    return labels;
  }, [nodes]);

  const getNodeLabel = useCallback((node: { id: string; type?: string; data: Record<string, unknown> }) => {
    if (node.type === 'input') return inputNodeLabels.get(node.id) ?? 'Input';
    if (node.type === 'operation') return (node.data.operationName as string) ?? 'Operation';
    return node.type ?? 'Node';
  }, [inputNodeLabels]);

  // Find all root input nodes upstream of the selected node
  const upstreamSources = useMemo(() => {
    if (!selectedNode || selectedNode.type === 'input') return [];

    // Build backward adjacency: target → sources
    const bwd = new Map<string, string[]>();
    for (const e of edges) {
      if (!bwd.has(e.target)) bwd.set(e.target, []);
      bwd.get(e.target)!.push(e.source);
    }

    // Trace all the way back to find root input nodes
    const roots: string[] = [];
    const visited = new Set<string>();
    const queue = [selectedNode.id];
    while (queue.length > 0) {
      const id = queue.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const sources = bwd.get(id) ?? [];
      if (sources.length === 0 && id !== selectedNode.id) {
        // Root node (no incoming edges)
        roots.push(id);
      } else {
        for (const s of sources) queue.push(s);
      }
    }

    // Also check: any node upstream that has multiple inputs creates a fork
    // We want to show all distinct root input nodes
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    return roots.map((rootId) => {
      const node = nodeMap.get(rootId);
      const name = node ? getNodeLabel(node) : rootId;
      return { sourceId: rootId, name, node };
    });
  }, [selectedNode, edges, nodes]);


  const { inputValue, inputLabel, inputEditable, outputValue, outputError, outputDuration, outputDataUrl, outputIsHtml, outputIsTerminal, outputNodeId, outputNodeType, outputOperationName } = useMemo(() => {
    if (selectedNode) {
      // When an input node is selected, show that input node's data
      // Otherwise show the first input node's data
      const activeInputNode = selectedNode.type === 'input' ? selectedNode : firstInputNode;
      const inVal = (activeInputNode?.data.inputValue as string) ?? '';
      const inLabel = activeInputNode
        ? (inputNodeLabels.get(activeInputNode.id) ?? 'Input')
        : 'Input';
      const inEditable = true;

      // For input nodes, show their own result as output too
      const outputId = selectedNode.type === 'input' ? selectedNode.id : selectedNode.id;
      const nodeResult = results.get(outputId);
      const outVal = nodeResult
        ? nodeResult.error
          ? `Error: ${nodeResult.error}`
          : (nodeResult.displayValue ?? '')
        : '';

      return {
        inputValue: inVal,
        inputLabel: inLabel,
        inputEditable: inEditable,
        outputValue: outVal,
        outputError: !!nodeResult?.error,
        outputDuration: nodeResult?.duration,
        outputDataUrl: nodeResult?.dataUrl,
        outputIsHtml: !!nodeResult?.isHtml,
        outputIsTerminal: !!nodeResult?.isTerminal,
        outputNodeId: selectedNode.id,
        outputNodeType: selectedNode.type ?? null,
        outputOperationName: (selectedNode.data.operationName as string) ?? null,
      };
    }

    const graphInput = (firstInputNode?.data.inputValue as string) ?? '';
    let outResult;
    let outNodeId: string | null = null;
    let outNodeType: string | null = null;
    let outOpName: string | null = null;
    const sources = new Set(edges.map((e) => e.source));
    const tails = nodes.filter((n) => n.type !== 'input' && n.type !== 'note' && n.type !== 'artifact' && !sources.has(n.id));
    const tail = tails.length > 0 ? tails[tails.length - 1] : null;
    outResult = tail ? results.get(tail.id) : undefined;
    outNodeId = tail?.id ?? null;
    outNodeType = tail?.type ?? null;
    outOpName = (tail?.data.operationName as string) ?? null;
    const graphOutput = outResult
      ? outResult.error
        ? `Error: ${outResult.error}`
        : (outResult.displayValue ?? '')
      : '';

    return {
      inputValue: graphInput,
      inputLabel: 'Input',
      inputEditable: true,
      outputValue: graphOutput,
      outputError: !!outResult?.error,
      outputDuration: outResult?.duration,
      outputDataUrl: outResult?.dataUrl,
      outputIsHtml: !!outResult?.isHtml,
      outputIsTerminal: !!outResult?.isTerminal,
      outputNodeId: outNodeId,
      outputNodeType: outNodeType,
      outputOperationName: outOpName,
    };
  }, [selectedNode, firstInputNode, nodes, edges, results, inputNodeLabels, upstreamSources, selectedUpstreamSourceId]);

  // When an input node is selected, edit that one; otherwise fall back to first input
  const editableInputNode = selectedNode?.type === 'input' ? selectedNode : firstInputNode;

  const handleInputChange = useCallback(
    (val: string) => {
      if (editableInputNode) {
        updateNodeData(editableInputNode.id, { inputValue: val, inputRaw: null, fileName: '' });
      }
    },
    [editableInputNode, updateNodeData],
  );

  const handleClearInput = useCallback(() => {
    if (editableInputNode) {
      updateNodeData(editableInputNode.id, { inputValue: '', inputRaw: null, fileName: '' });
    }
  }, [editableInputNode, updateNodeData]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editableInputNode) return;
      file.arrayBuffer().then((buf) => {
        const bytes = new Uint8Array(buf);
        const chunks: string[] = [];
        const CHUNK = 8192;
        for (let i = 0; i < bytes.length; i += CHUNK) {
          chunks.push(String.fromCharCode(...bytes.subarray(i, i + CHUNK)));
        }
        updateNodeData(editableInputNode.id, {
          inputValue: chunks.join(''),
          inputRaw: buf,
          fileName: file.name,
        });
      });
      e.target.value = '';
    },
    [editableInputNode, updateNodeData],
  );

  const [copyToast, setCopyToast] = useState<string | null>(null);
  const copyToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopyOutput = useCallback(async () => {
    if (outputValue) {
      await copyToClipboard(outputValue);
      const preview = outputValue.length > 40 ? outputValue.slice(0, 40) + '\u2026' : outputValue;
      setCopyToast(preview);
      if (copyToastTimer.current) clearTimeout(copyToastTimer.current);
      copyToastTimer.current = setTimeout(() => setCopyToast(null), 1500);
    }
  }, [outputValue]);

  const handleSaveOutput = useCallback(() => {
    saveOutputToFile(outputValue, outputDataUrl);
  }, [outputValue, outputDataUrl]);

  const handleTerminalResize = useCallback((cols: number, rows: number) => {
    getWorkerBridge().resizeBackendTerminal(cols, rows);
  }, []);

  const nodeLabel = selectedNode ? getNodeLabel(selectedNode) : null;

  // Cross-pane highlight: whichever pane has a selection, highlight in the other
  const [inputSelText, setInputSelText] = useState('');
  const [outputSelText, setOutputSelText] = useState('');

  const handleInputSelChange = useCallback((text: string) => {
    setInputSelText(text);
    if (text) setOutputSelText(''); // clear other pane's selection tracking
  }, []);

  const handleOutputSelChange = useCallback((text: string) => {
    setOutputSelText(text);
    if (text) setInputSelText(''); // clear other pane's selection tracking
  }, []);

  // The "active" selected text — whichever was set last
  const crossForInput = outputSelText; // output selection highlights in input
  const crossForOutput = inputSelText; // input selection highlights in output

  // --- Encoding, EOL & syntax state for each pane ---
  const [inputChrEnc, setInputChrEnc] = useState('raw');
  const [inputEol, setInputEol] = useState('LF');
  const [outputChrEnc, setOutputChrEnc] = useState('raw');
  const [outputEol, setOutputEol] = useState('LF');
  const [inputSyntaxLang, setInputSyntaxLang] = useState('');
  const [outputSyntaxLang, setOutputSyntaxLang] = useState('');

  // Re-decode output when encoding changes
  const displayOutputValue = useMemo(() => {
    if (outputChrEnc === 'raw' || !outputValue) return outputValue;
    return reDecodeString(outputValue, outputChrEnc);
  }, [outputValue, outputChrEnc]);

  // Re-decode input (when read-only / from upstream) when encoding changes
  const displayInputValue = useMemo(() => {
    if (inputChrEnc === 'raw' || !inputValue || inputEditable) return inputValue;
    return reDecodeString(inputValue, inputChrEnc);
  }, [inputValue, inputChrEnc, inputEditable]);

  /* ---- Context menus for input / output sections ---- */

  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; items: MenuEntry[] } | null>(null);
  const closeCtxMenu = useCallback(() => setCtxMenu(null), []);

  const handleInputContextMenu = useCallback(
    (e: React.MouseEvent) => {
      // Let CodeMirror keep the browser's native context menu
      if ((e.target as HTMLElement).closest('.cm-editor')) return;
      e.preventDefault();
      const val = inputEditable ? inputValue : displayInputValue;
      const items: MenuEntry[] = [
        {
          label: 'Copy All',
          action: () => { copyToClipboard(val); },
          disabled: !val,
        },
      ];
      if (inputEditable) {
        items.push({
          label: 'Paste from Clipboard',
          action: async () => {
            const text = await (navigator.clipboard?.readText?.() ?? Promise.resolve(''));
            if (text) handleInputChange(text);
          },
        });
        items.push({ separator: true });
        items.push({
          label: 'Open File\u2026',
          action: () => fileInputRef.current?.click(),
        });
        items.push({ separator: true });
        items.push({
          label: 'Clear',
          action: handleClearInput,
          disabled: !inputValue,
        });
      }
      setCtxMenu({ x: e.clientX, y: e.clientY, items });
    },
    [inputEditable, inputValue, displayInputValue, handleInputChange, handleClearInput],
  );

  const handleOutputContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.cm-editor')) return;
      if ((e.target as HTMLElement).closest('.zoomable-image-container')) return;
      e.preventDefault();
      const items: MenuEntry[] = [];
      if (outputDataUrl) {
        items.push({
          label: 'Save Image\u2026',
          action: handleSaveOutput,
        });
      } else {
        items.push({
          label: 'Copy All',
          action: () => { copyToClipboard(displayOutputValue); },
          disabled: !displayOutputValue,
        });
        items.push({ separator: true });
        items.push({
          label: 'Save to File\u2026',
          action: handleSaveOutput,
          disabled: !outputValue,
        });
      }
      setCtxMenu({ x: e.clientX, y: e.clientY, items });
    },
    [outputDataUrl, displayOutputValue, outputValue, handleSaveOutput],
  );

  // Extra menu items injected into ZoomableImage's context menu
  const imageExtraMenu = useMemo((): MenuEntry[] => [
    {
      label: 'Save Image\u2026',
      action: handleSaveOutput,
    },
  ], [handleSaveOutput]);

  const isFullPane = activeSection !== null; // maximized or mobile
  const paneStyle: React.CSSProperties = (() => {
    if (isMobile && !mobileMaximized && mobilePaneHeight != null) {
      return { height: mobilePaneHeight };
    }
    if (!isFullPane && paneWidth != null) {
      return { width: paneWidth };
    }
    return {};
  })();
  const inputSectionStyle: React.CSSProperties =
    activeSection === 'input'
      ? { flex: 1 }
      : activeSection === 'output'
        ? { display: 'none' }
        : { flex: `0 0 ${splitRatio * 100}%` };
  const outputSectionStyle: React.CSSProperties =
    activeSection === 'output'
      ? { flex: 1 }
      : activeSection === 'input'
        ? { display: 'none' }
        : { flex: 1 };
  const gutterHidden = isFullPane;

  return (
    <div
      className={`io-pane${isFullPane ? ' io-maximized' : ''}${isMobile ? ' io-mobile' : ''}${isMobile && mobileMaximized ? ' io-mobile-max' : ''}`}
      ref={paneRef}
      style={paneStyle}
    >
      <div
        className={`io-resize-handle${isResizingWidth ? ' active' : ''}`}
        onMouseDown={handleWidthMouseDown}
      />

      {/* Mobile drag handle */}
      {isMobile && !mobileMaximized && (
        <div
          className={`io-mobile-handle${isResizingMobile ? ' active' : ''}`}
          onMouseDown={handleMobileHandleDown}
          onTouchStart={handleMobileHandleDown}
        >
          <div className="io-mobile-handle-bar" />
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="input-file-hidden"
        onChange={handleFileSelect}
      />

      {/* Input section */}
      <div className="io-section" style={inputSectionStyle} onContextMenu={handleInputContextMenu}>
        <div className="io-title">
          <label>{inputLabel}</label>
          <span className="io-controls">
            {inputEditable && (
              <>
                <button className="io-btn" onClick={handleOpenFile} title="Open file">
                  <i className="fa-solid fa-folder-open" />
                </button>
                <button className="io-btn" onClick={handleClearInput} title="Clear input">
                  <i className="fa-solid fa-xmark" />
                </button>
              </>
            )}
            <button
              className={`io-btn${(isMobile ? mobileMaximized : activeSection === 'input') ? ' io-btn-active' : ''}`}
              onClick={() => toggleMaximize('input')}
              title={isMobile ? (mobileMaximized ? 'Restore' : 'Maximize') : (activeSection === 'input' ? 'Restore split view' : 'Maximize input')}
            >
              {(isMobile ? mobileMaximized : activeSection === 'input')
                ? <i className="fa-solid fa-down-left-and-up-right-to-center" />
                : <i className="fa-solid fa-up-right-and-down-left-from-center" />}
            </button>
          </span>
        </div>
        {upstreamSources.length > 1 && (
          <div className="io-upstream-tabs">
            {upstreamSources.map((src) => {
              const isActive = selectedUpstreamSourceId
                ? src.sourceId === selectedUpstreamSourceId
                : src === upstreamSources[0];
              return (
                <button
                  key={src.sourceId}
                  className={`io-upstream-tab${isActive ? ' active' : ''}`}
                  onClick={() => setSelectedUpstreamSourceId(src.sourceId)}
                >
                  {src.name}
                </button>
              );
            })}
          </div>
        )}
        <IOEditor
          value={inputEditable ? inputValue : displayInputValue}
          onChange={inputEditable ? handleInputChange : undefined}
          readOnly={!inputEditable}
          placeholder={inputEditable ? 'Enter input data...' : '\u2014 no data \u2014'}
          crossHighlight={crossForInput}
          onSelectionChange={handleInputSelChange}
          chrEnc={inputChrEnc}
          onChrEncChange={setInputChrEnc}
          eolCode={inputEol}
          onEolChange={setInputEol}
          syntaxLang={inputSyntaxLang}
          onSyntaxLangChange={setInputSyntaxLang}
        />
      </div>

      {/* Gutter */}
      {!gutterHidden && (
        <div
          className={`io-gutter${isResizingSplit ? ' active' : ''}`}
          onMouseDown={handleSplitMouseDown}
        />
      )}

      {/* Output section */}
      <div className="io-section" style={outputSectionStyle} onContextMenu={handleOutputContextMenu}>
        <div className="io-title">
          <label>{nodeLabel ? `Output (${nodeLabel})` : 'Output'}</label>
          <span className="io-controls">
            {outputNodeId && outputNodeType !== 'input' && (
              <button
                className={`io-btn${isRunning ? ' io-btn-active' : ''}`}
                onClick={() => executeFromNode(outputNodeId)}
                title="Re-run from this node"
                disabled={isRunning}
              >
                <i className="fa-solid fa-play" />
              </button>
            )}
            <button className="io-btn" onClick={handleSaveOutput} title="Save to file" disabled={!outputValue && !outputDataUrl}>
              <i className="fa-solid fa-floppy-disk" />
            </button>
            <button className="io-btn" onClick={handleCopyOutput} title="Copy output to clipboard">
              <i className="fa-solid fa-copy" />
            </button>
            <button
              className={`io-btn${(isMobile ? mobileMaximized : activeSection === 'output') ? ' io-btn-active' : ''}`}
              onClick={() => toggleMaximize('output')}
              title={isMobile ? (mobileMaximized ? 'Restore' : 'Maximize') : (activeSection === 'output' ? 'Restore split view' : 'Maximize output')}
            >
              {(isMobile ? mobileMaximized : activeSection === 'output')
                ? <i className="fa-solid fa-down-left-and-up-right-to-center" />
                : <i className="fa-solid fa-up-right-and-down-left-from-center" />}
            </button>
          </span>
        </div>
        {copyToast && (
          <div className="io-copy-toast">Copied! {copyToast}</div>
        )}
        {outputNodeType === 'artifact' && selectedNode ? (
          <ArtifactBrowser
            files={(selectedNode.data.files as ArtifactFile[]) ?? []}
            folders={(selectedNode.data.folders as string[]) ?? []}
            onClearBadge={() => {
              if (selectedNode && (selectedNode.data.newFileCount as number) > 0) {
                updateNodeData(selectedNode.id, { newFileCount: 0 });
              }
            }}
            onAddAsInput={(file) => {
              const bin = atob(file.data);
              const buf = new ArrayBuffer(bin.length);
              const view = new Uint8Array(buf);
              for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
              const chunks: string[] = [];
              const CHUNK = 8192;
              for (let i = 0; i < view.length; i += CHUNK) {
                chunks.push(String.fromCharCode(...view.subarray(i, i + CHUNK)));
              }
              // Find a position for the new input node
              const inputNodes = nodes.filter((n) => n.type === 'input');
              const lastInput = inputNodes[inputNodes.length - 1];
              const pos = lastInput
                ? { x: lastInput.position.x, y: lastInput.position.y + 140 }
                : { x: 0, y: 0 };
              addNode({
                id: createNodeId(),
                type: 'input',
                position: pos,
                data: {
                  inputValue: chunks.join(''),
                  inputRaw: buf,
                  inputType: 'text',
                  fileName: file.name,
                },
              });
            }}
            onUpdateFiles={(newFiles) => {
              if (selectedNode) {
                updateNodeData(selectedNode.id, { files: newFiles });
              }
            }}
            onUpdateFolders={(newFolders) => {
              if (selectedNode) {
                updateNodeData(selectedNode.id, { folders: newFolders });
              }
            }}
          />
        ) : outputDataUrl ? (
          <ZoomableImage src={outputDataUrl} alt="Output" className="io-image-zoomable" extraMenuItems={imageExtraMenu} />
        ) : outputNodeType === 'magic' && outputValue ? (
          <div className="io-magic-table-wrap">
            <MagicTable jsonValue={outputValue} afterNodeId={outputNodeId!} />
          </div>
        ) : outputOperationName === 'Cipher Identifier' && outputValue ? (
          <div className="io-magic-table-wrap">
            <CipherIdTable jsonValue={outputValue} afterNodeId={
              // Connect from the node feeding INTO the Cipher Identifier, not from it
              edges.find((e) => e.target === outputNodeId)?.source ?? outputNodeId!
            } />
          </div>
        ) : outputIsTerminal ? (
          <TerminalOutput
            key={outputNodeId}
            value={displayOutputValue}
            className="io-terminal-output"
            onResize={handleTerminalResize}
          />
        ) : outputIsHtml && displayOutputValue ? (
          <div
            className="io-html-output"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(displayOutputValue) }}
          />
        ) : (
          <IOEditor
            value={displayOutputValue}
            readOnly
            placeholder={isRunning ? 'Running...' : '\u2014 no data \u2014'}
            className={`io-output${outputError ? ' io-error' : ''}`}
            crossHighlight={crossForOutput}
            onSelectionChange={handleOutputSelChange}
            chrEnc={outputChrEnc}
            onChrEncChange={setOutputChrEnc}
            eolCode={outputEol}
            onEolChange={setOutputEol}
            syntaxLang={outputSyntaxLang}
            onSyntaxLangChange={setOutputSyntaxLang}
          />
        )}
        {outputNodeId && outputNodeType !== 'magic' && <MagicBadge nodeId={outputNodeId} />}
      </div>
      {/* Bottom tab bar — shown in maximize mode and mobile */}
      {isFullPane && (
        <div className="io-tab-bar">
          <button
            className={`io-tab${activeSection === 'input' ? ' active' : ''}`}
            onClick={() => setMaximizedSection('input')}
          >
            Input
          </button>
          <button
            className={`io-tab${activeSection === 'output' ? ' active' : ''}`}
            onClick={() => setMaximizedSection('output')}
          >
            Output
          </button>
          {!isMobile && (
            <button
              className="io-tab io-tab-restore"
              onClick={() => setMaximizedSection(null)}
              title="Restore split view"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
      )}
      {/* Context menu for title bars / non-editor areas */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={ctxMenu.items}
          onClose={closeCtxMenu}
        />
      )}
    </div>
  );
});

