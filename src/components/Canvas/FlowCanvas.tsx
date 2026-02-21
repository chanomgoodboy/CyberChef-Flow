import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  type ReactFlowInstance,
  type Viewport,
  type OnConnectStart,
  type OnConnectEnd,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { useExecutionStore } from '@/store/executionStore';
import { nodeTypes } from '@/components/Nodes/nodeTypes';
import { createNodeId } from '@/utils/id';
import { getMeta } from '@/adapter/OperationRegistry';
import { buildDefaultArgs } from '@/utils/argDefaults';
import { MiniMap } from './MiniMap';
import { ContextMenu, type MenuEntry } from '@/components/ContextMenu';

interface FlowCanvasProps {
  onRun?: () => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  items: MenuEntry[];
}

export const FlowCanvas = React.memo(function FlowCanvas({ onRun }: FlowCanvasProps) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const onNodesChange = useGraphStore((s) => s.onNodesChange);
  const onEdgesChange = useGraphStore((s) => s.onEdgesChange);
  const onConnect = useGraphStore((s) => s.onConnect);
  const addNode = useGraphStore((s) => s.addNode);
  const addNodeToChain = useGraphStore((s) => s.addNodeToChain);
  const removeNode = useGraphStore((s) => s.removeNode);
  const removeEdge = useGraphStore((s) => s.removeEdge);
  const insertNodeOnEdge = useGraphStore((s) => s.insertNodeOnEdge);
  const bypassNode = useGraphStore((s) => s.bypassNode);
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const setSelectedNode = useUIStore((s) => s.setSelectedNode);

  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 0.85 });
  const connectingFrom = useRef<string | null>(null);
  const connectSucceeded = useRef(false);
  const justOpenedPalette = useRef(false);
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null);

  const closeCtxMenu = useCallback(() => setCtxMenu(null), []);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowRef.current = instance;
  }, []);

  const onViewportChange = useCallback((vp: Viewport) => {
    setViewport({
      x: Math.min(vp.x, 0),
      y: Math.min(vp.y, 0),
      zoom: vp.zoom,
    });
  }, []);

  const onConnectStart: OnConnectStart = useCallback((_event, params) => {
    connectingFrom.current = params.nodeId ?? null;
    connectSucceeded.current = false;
  }, []);

  const handleConnect = useCallback(
    (connection: any) => {
      connectSucceeded.current = true;
      onConnect(connection);
    },
    [onConnect],
  );

  const onConnectEnd: OnConnectEnd = useCallback(() => {
    if (!connectSucceeded.current && connectingFrom.current) {
      setSelectedNode(connectingFrom.current);
      useUIStore.getState().setCommandPaletteOpen(true, true);
      justOpenedPalette.current = true;
    }
    connectingFrom.current = null;
  }, [setSelectedNode]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const rfInstance = reactFlowRef.current;
      if (!rfInstance) return;

      const position = rfInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const chainOpts = { position, afterNodeId: selectedNodeId ?? undefined };

      const nodeType = e.dataTransfer.getData('application/cyberweb-node');
      if (nodeType) {
        const nodeId = createNodeId();
        if (nodeType === 'input') {
          addNode({
            id: nodeId,
            type: nodeType,
            position,
            data: { inputValue: '', inputType: 'text' },
          });
        } else {
          const nodeData =
            nodeType === 'magic'
              ? { depth: 3, intensive: false, extLang: false, crib: '' }
              : { text: '' };
          addNodeToChain(
            {
              id: nodeId,
              type: nodeType,
              position,
              data: nodeData,
            },
            chainOpts,
          );
        }
        setSelectedNode(nodeId);
        return;
      }

      // Artifact file dropped from ArtifactBrowser → create input node
      const artifactJson = e.dataTransfer.getData('application/cyberweb-artifact');
      if (artifactJson) {
        try {
          const file = JSON.parse(artifactJson) as { name: string; size: number; data: string };
          const bin = atob(file.data);
          const buf = new ArrayBuffer(bin.length);
          const view = new Uint8Array(buf);
          for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
          const chunks: string[] = [];
          const CHUNK = 8192;
          for (let i = 0; i < view.length; i += CHUNK) {
            chunks.push(String.fromCharCode(...view.subarray(i, i + CHUNK)));
          }
          const nodeId = createNodeId();
          addNode({
            id: nodeId,
            type: 'input',
            position,
            data: {
              inputValue: chunks.join(''),
              inputRaw: buf,
              inputType: 'text',
              fileName: file.name,
            },
          });
          setSelectedNode(nodeId);
        } catch { /* ignore bad data */ }
        return;
      }

      const operationName = e.dataTransfer.getData('application/cyberweb-operation');
      if (!operationName) return;

      const meta = getMeta(operationName);
      const argValues = buildDefaultArgs(operationName);

      const nodeId = createNodeId();
      addNodeToChain(
        {
          id: nodeId,
          type: 'operation',
          position,
          data: {
            operationName,
            args: argValues,
            inputType: meta?.inputType ?? 'string',
            outputType: meta?.outputType ?? 'string',
          },
        },
        chainOpts,
      );
      setSelectedNode(nodeId);
    },
    [addNode, addNodeToChain, selectedNodeId, setSelectedNode],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode],
  );

  const onPaneClick = useCallback(() => {
    if (justOpenedPalette.current) {
      justOpenedPalette.current = false;
      return;
    }
    setSelectedNode(null);
    setCtxMenu(null);
  }, [setSelectedNode]);

  const edgeClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.stopPropagation();
      // Delay to distinguish from double-click
      const x = event.clientX;
      const y = event.clientY;
      if (edgeClickTimer.current) clearTimeout(edgeClickTimer.current);
      edgeClickTimer.current = setTimeout(() => {
        edgeClickTimer.current = null;
        const items: MenuEntry[] = [
          {
            label: 'Add Operation',
            action: () => {
              useUIStore.setState({ paletteInsertEdgeId: edge.id });
              useUIStore.getState().setCommandPaletteOpen(true);
            },
          },
          { separator: true },
          {
            label: 'Delete Edge',
            action: () => removeEdge(edge.id),
          },
        ];
        setCtxMenu({ x, y, items });
      }, 250);
    },
    [removeEdge],
  );

  const onEdgeDoubleClick = useCallback(
    (_: React.MouseEvent, edge: { id: string }) => {
      if (edgeClickTimer.current) {
        clearTimeout(edgeClickTimer.current);
        edgeClickTimer.current = null;
      }
      removeEdge(edge.id);
    },
    [removeEdge],
  );

  /* ---------------------------------------------------------------- */
  /*  Drop node onto edge → insert between                             */
  /* ---------------------------------------------------------------- */

  const EDGE_PROXIMITY = 40; // px threshold in flow-space
  const [dropTargetEdgeId, setDropTargetEdgeId] = useState<string | null>(null);

  /** Find the closest edge to a dragged node's center, if within threshold. */
  const findNearestEdge = useCallback(
    (draggedNode: Node): Edge | null => {
      if (draggedNode.type === 'input' || draggedNode.type === 'note') return null;

      const { nodes: allNodes, edges: allEdges } = useGraphStore.getState();

      const hasEdges = allEdges.some(
        (e) => e.source === draggedNode.id || e.target === draggedNode.id,
      );
      if (hasEdges) return null;

      const nodeW = draggedNode.measured?.width ?? 180;
      const nodeH = draggedNode.measured?.height ?? 60;
      const cx = draggedNode.position.x + nodeW / 2;
      const cy = draggedNode.position.y + nodeH / 2;

      let bestEdge: Edge | null = null;
      let bestDist = EDGE_PROXIMITY;

      for (const edge of allEdges) {
        const srcNode = allNodes.find((n) => n.id === edge.source);
        const tgtNode = allNodes.find((n) => n.id === edge.target);
        if (!srcNode || !tgtNode) continue;

        const sw = srcNode.measured?.width ?? 180;
        const sh = srcNode.measured?.height ?? 60;
        const tw = tgtNode.measured?.width ?? 180;

        // Edge: source bottom-center → target top-center
        const sx = srcNode.position.x + sw / 2;
        const sy = srcNode.position.y + sh;
        const tx = tgtNode.position.x + tw / 2;
        const ty = tgtNode.position.y;

        const dx = tx - sx;
        const dy = ty - sy;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) continue;

        const t = Math.max(0, Math.min(1, ((cx - sx) * dx + (cy - sy) * dy) / lenSq));
        const px = sx + t * dx;
        const py = sy + t * dy;
        const dist = Math.sqrt((cx - px) ** 2 + (cy - py) ** 2);

        if (dist < bestDist) {
          bestDist = dist;
          bestEdge = edge;
        }
      }

      return bestEdge;
    },
    [],
  );

  const onNodeDrag = useCallback(
    (_: React.MouseEvent, draggedNode: Node) => {
      const nearest = findNearestEdge(draggedNode);
      setDropTargetEdgeId(nearest?.id ?? null);
    },
    [findNearestEdge],
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, draggedNode: Node) => {
      setDropTargetEdgeId(null);
      const nearest = findNearestEdge(draggedNode);
      if (nearest) {
        insertNodeOnEdge(draggedNode.id, nearest.id);
      }
    },
    [findNearestEdge, insertNodeOnEdge],
  );

  /* ---------------------------------------------------------------- */
  /*  Context menu handlers                                            */
  /* ---------------------------------------------------------------- */

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setSelectedNode(node.id);

      const store = useGraphStore.getState();
      const nodeEdges = store.edges.filter(
        (e) => e.source === node.id || e.target === node.id,
      );

      const items: MenuEntry[] = [
        {
          label: 'Add Operation After...',
          action: () => {
            setSelectedNode(node.id);
            useUIStore.getState().setCommandPaletteOpen(true);
          },
        },
        ...(node.type === 'operation'
          ? [
              {
                label: 'Replace with...',
                action: () => {
                  useUIStore.setState({ paletteReplaceNodeId: node.id });
                  useUIStore.getState().setCommandPaletteOpen(true);
                },
              } as MenuEntry,
            ]
          : []),
        { separator: true },
        {
          label: 'Duplicate',
          action: () => {
            const newId = createNodeId();
            const newNode: Node = {
              id: newId,
              type: node.type,
              position: { x: node.position.x + 40, y: node.position.y + 40 },
              data: { ...node.data },
            };
            addNodeToChain(newNode, {
              position: newNode.position,
              afterNodeId: node.id,
            });
            setSelectedNode(newId);
          },
        },
        { separator: true },
        {
          label: 'Skip Node',
          disabled: !nodeEdges.some((e) => e.target === node.id) ||
                    !nodeEdges.some((e) => e.source === node.id),
          action: () => {
            bypassNode(node.id);
          },
        },
        {
          label: 'Disconnect All Edges',
          disabled: nodeEdges.length === 0,
          action: () => {
            for (const e of nodeEdges) removeEdge(e.id);
          },
        },
        {
          label: 'Delete Node',
          action: () => {
            removeNode(node.id);
            setSelectedNode(null);
          },
        },
      ];

      setCtxMenu({ x: event.clientX, y: event.clientY, items });
    },
    [addNodeToChain, bypassNode, removeNode, removeEdge, setSelectedNode],
  );

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();

      const items: MenuEntry[] = [
        {
          label: 'Add Operation',
          action: () => {
            useUIStore.setState({ paletteInsertEdgeId: edge.id });
            useUIStore.getState().setCommandPaletteOpen(true);
          },
        },
        { separator: true },
        {
          label: 'Delete Edge',
          action: () => removeEdge(edge.id),
        },
      ];

      setCtxMenu({ x: event.clientX, y: event.clientY, items });
    },
    [removeEdge],
  );

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();

      const rfInstance = reactFlowRef.current;
      if (!rfInstance) return;

      const position = rfInstance.screenToFlowPosition({
        x: (event as MouseEvent).clientX,
        y: (event as MouseEvent).clientY,
      });

      const items: MenuEntry[] = [
        {
          label: 'Add Operation...',
          action: () => {
            useUIStore.getState().setCommandPaletteOpen(true);
          },
        },
        { separator: true },
        {
          label: 'Add Input',
          action: () => {
            const nodeId = createNodeId();
            addNode({
              id: nodeId,
              type: 'input',
              position,
              data: { inputValue: '', inputType: 'text' },
            });
            setSelectedNode(nodeId);
          },
        },
        {
          label: 'Add Note',
          action: () => {
            const nodeId = createNodeId();
            addNode({
              id: nodeId,
              type: 'note',
              position,
              data: { text: '' },
            });
            setSelectedNode(nodeId);
          },
        },
      ];

      setCtxMenu({ x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY, items });
    },
    [addNode, addNodeToChain, setSelectedNode],
  );

  /* ---------------------------------------------------------------- */

  const selectedUpstreamSourceId = useUIStore((s) => s.selectedUpstreamSourceId);

  // Detect fork-merge chain nodes + identify Fork/Merge node IDs
  const { forkMergeNodes, forkIds, mergeIds } = useMemo(() => {
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const fwd = new Map<string, string[]>();
    for (const e of edges) {
      if (!fwd.has(e.source)) fwd.set(e.source, []);
      fwd.get(e.source)!.push(e.target);
    }

    const fmNodes = new Set<string>();
    const fIds = new Set<string>();
    const mIds = new Set<string>();

    for (const n of nodes) {
      if (n.type !== 'operation' || n.data?.operationName !== 'Fork') continue;
      fIds.add(n.id);
      fmNodes.add(n.id);
      let cur = n.id;
      while (true) {
        const outs = fwd.get(cur) ?? [];
        if (outs.length !== 1) break;
        const next = nodeById.get(outs[0]);
        if (!next || next.type !== 'operation') break;
        fmNodes.add(next.id);
        if (next.data?.operationName === 'Merge') {
          mIds.add(next.id);
          break;
        }
        cur = next.id;
      }
    }
    return { forkMergeNodes: fmNodes, forkIds: fIds, mergeIds: mIds };
  }, [nodes, edges]);

  const styledEdges = useMemo(() => {
    const dropStyle = { stroke: 'var(--accent-green)', strokeWidth: 3, strokeDasharray: '6 3' };
    const fmColor = '#8a7a5a';
    const fmColorActive = '#a09070';

    const applyForkMerge = (e: Edge, color: string) => {
      const styled: Edge = { ...e, style: { stroke: color, strokeWidth: 2 } };
      if (forkIds.has(e.source)) {
        styled.markerEnd = 'url(#marker-fork-fan)';
      }
      if (mergeIds.has(e.target)) {
        styled.markerStart = 'url(#marker-merge-fan)';
      }
      return styled;
    };

    if (!selectedNodeId && !dropTargetEdgeId) {
      if (forkMergeNodes.size === 0) return edges;
      return edges.map((e) => {
        const inForkMerge = forkMergeNodes.has(e.source) && forkMergeNodes.has(e.target);
        return inForkMerge ? applyForkMerge(e, fmColor) : e;
      });
    }

    if (!selectedNodeId) {
      return edges.map((e) => {
        if (e.id === dropTargetEdgeId) return { ...e, style: dropStyle, animated: true };
        const inForkMerge = forkMergeNodes.has(e.source) && forkMergeNodes.has(e.target);
        return inForkMerge ? applyForkMerge(e, fmColor) : e;
      });
    }

    const fwd = new Map<string, string[]>();
    const bwd = new Map<string, string[]>();
    for (const e of edges) {
      if (!fwd.has(e.source)) fwd.set(e.source, []);
      fwd.get(e.source)!.push(e.target);
      if (!bwd.has(e.target)) bwd.set(e.target, []);
      bwd.get(e.target)!.push(e.source);
    }

    const chainNodes = new Set<string>();

    const canReach = (start: string, target: string): boolean => {
      const visited = new Set<string>();
      const q = [start];
      while (q.length > 0) {
        const id = q.pop()!;
        if (id === target) return true;
        if (visited.has(id)) continue;
        visited.add(id);
        for (const s of bwd.get(id) ?? []) q.push(s);
      }
      return false;
    };

    const upQueue = [selectedNodeId];
    while (upQueue.length > 0) {
      const id = upQueue.pop()!;
      if (chainNodes.has(id)) continue;
      chainNodes.add(id);
      const sources = bwd.get(id) ?? [];
      if (selectedUpstreamSourceId && sources.length > 1) {
        for (const s of sources) {
          if (s === selectedUpstreamSourceId || canReach(s, selectedUpstreamSourceId)) {
            upQueue.push(s);
          }
        }
      } else {
        for (const s of sources) upQueue.push(s);
      }
    }

    const downQueue = [...(fwd.get(selectedNodeId) ?? [])];
    while (downQueue.length > 0) {
      const id = downQueue.pop()!;
      if (chainNodes.has(id)) continue;
      chainNodes.add(id);
      for (const t of fwd.get(id) ?? []) downQueue.push(t);
    }

    return edges.map((e) => {
      if (e.id === dropTargetEdgeId) {
        return { ...e, style: dropStyle, animated: true };
      }
      const inChain = chainNodes.has(e.source) && chainNodes.has(e.target);
      const inForkMerge = forkMergeNodes.has(e.source) && forkMergeNodes.has(e.target);
      if (inForkMerge) {
        return applyForkMerge(e, inChain ? fmColorActive : fmColor);
      }
      if (inChain) {
        return { ...e, style: { stroke: 'var(--accent-blue)', strokeWidth: 2 } };
      }
      return e;
    });
  }, [edges, nodes, selectedNodeId, selectedUpstreamSourceId, dropTargetEdgeId, forkMergeNodes, forkIds, mergeIds]);

  return (
    <div className="flow-canvas">
      {/* SVG marker defs for fork/merge edges */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {/* Fork fan-out: three lines spreading from a point (placed at edge end, near Fork output) */}
          <marker id="marker-fork-fan" viewBox="0 0 16 16" refX="8" refY="8"
            markerWidth="16" markerHeight="16" orient="auto">
            <path d="M2,8 L14,2" stroke="#8a7a5a" strokeWidth="1.5" fill="none" />
            <path d="M2,8 L14,8" stroke="#8a7a5a" strokeWidth="1.5" fill="none" />
            <path d="M2,8 L14,14" stroke="#8a7a5a" strokeWidth="1.5" fill="none" />
          </marker>
          {/* Merge fan-in: three lines converging to a point (placed at edge start, near Merge input) */}
          <marker id="marker-merge-fan" viewBox="0 0 16 16" refX="8" refY="8"
            markerWidth="16" markerHeight="16" orient="auto">
            <path d="M2,2 L14,8" stroke="#8a7a5a" strokeWidth="1.5" fill="none" />
            <path d="M2,8 L14,8" stroke="#8a7a5a" strokeWidth="1.5" fill="none" />
            <path d="M2,14 L14,8" stroke="#8a7a5a" strokeWidth="1.5" fill="none" />
          </marker>
        </defs>
      </svg>
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onInit={onInit}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onEdgeClick={onEdgeClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        nodeTypes={nodeTypes}
        viewport={viewport}
        onViewportChange={onViewportChange}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode="Shift"
        snapToGrid
        snapGrid={[16, 16]}
        panOnScroll
        translateExtent={[[0, 0], [Infinity, Infinity]]}
        noPanClassName="nowheel"
        noWheelClassName="nowheel"
      >
        <MiniMap />
      </ReactFlow>
      <CanvasRunBar onRun={onRun} />
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

/* Floating run bar at the bottom of the canvas */
const CanvasRunBar = React.memo(function CanvasRunBar({ onRun }: { onRun?: () => void }) {
  const isRunning = useExecutionStore((s) => s.isRunning);
  const autoRun = useExecutionStore((s) => s.autoRun);
  const toggleAutoRun = useExecutionStore((s) => s.toggleAutoRun);
  const setRunning = useExecutionStore((s) => s.setRunning);

  const handleRun = useCallback(() => {
    if (!isRunning && onRun) onRun();
  }, [isRunning, onRun]);

  const handleStop = useCallback(() => {
    setRunning(false);
  }, [setRunning]);

  return (
    <div className="canvas-run-bar">
      {isRunning ? (
        <button className="toolbar-btn stop-btn" onClick={handleStop} title="Stop">
          <i className="fa-solid fa-stop" /> Stop
        </button>
      ) : (
        <button className="toolbar-btn run-btn" onClick={handleRun} title="Run graph (Ctrl+Enter)">
          <i className="fa-solid fa-play" /> Run
        </button>
      )}
      <label className="canvas-run-bar-toggle" title="Auto-run on changes">
        <input type="checkbox" checked={autoRun} onChange={toggleAutoRun} />
        Auto
      </label>
    </div>
  );
});
