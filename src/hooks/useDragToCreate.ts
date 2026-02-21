import { useCallback, type DragEvent } from 'react';
import { useReactFlow } from '@xyflow/react';
import { createNodeId } from '@/utils/id';
import { useGraphStore } from '@/store/graphStore';
import { getMeta } from '@/adapter/OperationRegistry';

/**
 * MIME type used when dragging an operation name from the sidebar
 * palette onto the React Flow canvas.
 */
const DRAG_DATA_TYPE = 'application/cyberweb-operation';

/* ------------------------------------------------------------------ */
/*  Drag source helper (use in the palette item)                       */
/* ------------------------------------------------------------------ */

/**
 * Set up the `dragStart` event so the operation name is available on
 * drop.  Call this from the palette item's `onDragStart`.
 */
export function setDragData(event: DragEvent, operationName: string): void {
  event.dataTransfer.setData(DRAG_DATA_TYPE, operationName);
  event.dataTransfer.effectAllowed = 'move';
}

/* ------------------------------------------------------------------ */
/*  Hook (use on the canvas / ReactFlow wrapper)                       */
/* ------------------------------------------------------------------ */

/**
 * Returns `onDragOver` and `onDrop` handlers that should be spread
 * onto the `<ReactFlow>` component.  When a user drags an operation
 * from the sidebar palette and drops it on the canvas, a new
 * operation node is created at the drop position.
 */
export function useDragToCreate() {
  const reactFlowInstance = useReactFlow();
  const addNode = useGraphStore((s) => s.addNode);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const operationName = event.dataTransfer.getData(DRAG_DATA_TYPE);
      if (!operationName) return;

      const meta = getMeta(operationName);

      // Convert the screen-space drop coordinates to flow-space.
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Build default arg values from the operation metadata.
      const argValues: Record<string, unknown> = {};
      if (meta) {
        for (const def of meta.args) {
          argValues[def.name] = def.value;
        }
      }

      addNode({
        id: createNodeId(),
        type: 'operation',
        position,
        data: {
          operationName,
          args: argValues,
          inputType: meta?.inputType ?? 'string',
          outputType: meta?.outputType ?? 'string',
        },
      });
    },
    [reactFlowInstance, addNode],
  );

  return { onDragOver, onDrop } as const;
}
