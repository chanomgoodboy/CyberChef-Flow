import Dish from '@cyberchef/Dish.mjs';
import { OperationAdapter } from '../adapter/OperationAdapter';
import {
  createDish,
  cloneDish,
  dishToString,
  dishToTransferable,
  dishToImageDataUrl,
} from '../adapter/DishBridge';
import { runMagic } from './MagicEngine';
import type { DishData } from '../adapter/types';
import type { GraphNode, NodeResult } from './types';

/**
 * Execute a single graph node and return a NodeResult.
 *
 * Behaviour varies by the node's `type` property:
 *
 * - **input**     : Creates a Dish from the node's `inputValue` text.
 * - **operation** : Runs the CyberChef operation via OperationAdapter.
 *
 * @param node          The React Flow node to execute.
 * @param upstreamDish  The input Dish provided by the upstream node(s).
 *                      May be `null` for input nodes.
 * @param onStream      Optional streaming callback for backend operations.
 * @returns             A NodeResult describing the execution outcome.
 */
export async function executeNode(
  node: GraphNode,
  upstreamDish: InstanceType<typeof Dish> | null,
  onStream?: (accumulated: string) => void,
): Promise<NodeResult> {
  const start = performance.now();

  try {
    switch (node.type) {
      // ---------------------------------------------------------------
      // Input node -- produces a Dish from the user-supplied text.
      // ---------------------------------------------------------------
      case 'input': {
        // Prefer raw ArrayBuffer (from file/paste) — preserves all bytes
        // including \r (0x0D) that browser text APIs strip.
        const rawBuf = node.data?.inputRaw as ArrayBuffer | null | undefined;
        const text = (node.data?.inputValue as string) ?? '';

        const dish = rawBuf
          ? createDish(rawBuf, Dish.ARRAY_BUFFER)
          : createDish(text, Dish.STRING);
        const displayValue = rawBuf
          ? `[${rawBuf.byteLength} bytes]`
          : text;

        return {
          nodeId: node.id,
          output: await dishToTransferable(dish),
          displayValue,
          duration: performance.now() - start,
          status: 'success',
        };
      }

      // ---------------------------------------------------------------
      // Operation node -- delegates to OperationAdapter.
      // ---------------------------------------------------------------
      case 'operation': {
        const opName = node.data?.operationName;
        if (!opName) {
          throw new Error('Operation node is missing operationName in data.');
        }

        if (!upstreamDish) {
          throw new Error(
            `Operation node "${opName}" has no upstream input.`,
          );
        }

        const adapter = await OperationAdapter.create(opName);

        // Convert the args Record to a positional array.  Operations
        // expect args as an ordered array matching their arg definitions.
        const argsRecord = (node.data?.args as Record<string, any>) ?? {};
        const argValues = Object.values(argsRecord);

        const outputDish = await adapter.execute(upstreamDish, argValues, onStream);
        const dataUrl = await dishToImageDataUrl(outputDish);
        const displayValue = dataUrl ? '' : await dishToString(outputDish);
        const outputData = await dishToTransferable(outputDish);
        const isHtml = outputDish.type === Dish.HTML;

        return {
          nodeId: node.id,
          output: outputData,
          displayValue,
          dataUrl: dataUrl ?? undefined,
          isHtml: isHtml || undefined,
          files: adapter._lastFiles,
          duration: performance.now() - start,
          status: 'success',
        };
      }

      // ---------------------------------------------------------------
      // Magic node -- analyses data with CyberChef's Magic library.
      // ---------------------------------------------------------------
      case 'magic': {
        if (!upstreamDish) {
          return {
            nodeId: node.id,
            output: null,
            displayValue: 'No input data',
            duration: performance.now() - start,
            status: 'success',
          };
        }

        const buf: ArrayBuffer = await Promise.resolve(
          upstreamDish.get(Dish.ARRAY_BUFFER),
        );
        const depth = (node.data?.depth as number) ?? 1;
        const intensive = (node.data?.intensive as boolean) ?? false;
        const extLang = (node.data?.extLang as boolean) ?? false;
        const crib = (node.data?.crib as string) ?? '';

        const suggestions = await runMagic(buf, depth, intensive, extLang, crib);

        // Store structured JSON so MagicNode can render a table
        const displayValue = JSON.stringify(suggestions.slice(0, 20));

        // Pass upstream data through so Magic can be mid-chain
        const outputData = await dishToTransferable(upstreamDish);

        return {
          nodeId: node.id,
          output: outputData,
          displayValue,
          duration: performance.now() - start,
          status: 'success',
        };
      }

      // ---------------------------------------------------------------
      // Note / unknown node types -- no-op pass-through.
      // ---------------------------------------------------------------
      default: {
        const outputData: DishData | null = upstreamDish
          ? await dishToTransferable(upstreamDish)
          : null;

        return {
          nodeId: node.id,
          output: outputData,
          displayValue: '',
          duration: performance.now() - start,
          status: 'success',
        };
      }
    }
  } catch (err: any) {
    return {
      nodeId: node.id,
      output: null,
      displayValue: '',
      duration: performance.now() - start,
      error: err?.message ?? String(err),
      status: 'error',
    };
  }
}
