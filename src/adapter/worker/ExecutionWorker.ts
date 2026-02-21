import Dish from '@cyberchef/Dish.mjs';
import { OperationAdapter } from '../OperationAdapter';
import { dishFromTransferable, dishToTransferable } from '../DishBridge';
import type { DishData, ExecutionResult } from '../types';

/**
 * Execute a CyberChef operation on the main thread.
 *
 * This is intentionally a simple async function rather than a true Web
 * Worker.  Web Workers cannot use Vite's `import.meta.glob` for eager
 * module loading, so we defer worker-based execution to a future
 * iteration.  The public API (accepting and returning serialisable
 * DishData) is already worker-compatible, so migrating later will be
 * transparent to callers.
 *
 * @param nodeId    The graph node id (passed through for tracking).
 * @param opName    Human-readable operation name.
 * @param args      Positional argument values.
 * @param dishData  Serialisable {value, type} representing the input Dish.
 * @returns         An ExecutionResult with the output DishData and timing.
 */
export async function executeOperation(
  nodeId: string,
  opName: string,
  args: any[],
  dishData: DishData,
): Promise<ExecutionResult> {
  const start = performance.now();

  try {
    const adapter = await OperationAdapter.create(opName);
    const inputDish = dishFromTransferable(dishData);
    const outputDish = await adapter.execute(inputDish, args);
    const duration = performance.now() - start;

    const outputData = await dishToTransferable(outputDish);

    // Attempt to produce a short string preview for display.
    let presentedValue: string | undefined;
    try {
      const previewStr: string = await Promise.resolve(
        outputDish.get(Dish.STRING),
      );
      presentedValue =
        previewStr.length > 1024
          ? previewStr.slice(0, 1024) + '\u2026'
          : previewStr;
    } catch {
      // Some types cannot be converted to string; that is fine.
    }

    return {
      nodeId,
      dishData: outputData,
      duration,
      presentedValue,
    };
  } catch (err: any) {
    const duration = performance.now() - start;
    return {
      nodeId,
      dishData: { value: null, type: Dish.STRING },
      duration,
      error: err?.message ?? String(err),
    };
  }
}
