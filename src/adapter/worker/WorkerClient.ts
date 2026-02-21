import type { DishData, ExecutionResult } from '../types';
import { executeOperation } from './ExecutionWorker';

/**
 * Promise-based client for executing CyberChef operations.
 *
 * Currently delegates directly to the main-thread ExecutionWorker
 * function.  When true Web Worker support is added, this class will
 * manage the worker lifecycle and message passing while keeping the
 * same public API.
 */
export class WorkerClient {
  /**
   * Execute a single operation and return the result.
   *
   * @param nodeId    Graph node identifier (for correlation).
   * @param opName    Human-readable CyberChef operation name.
   * @param args      Positional argument values.
   * @param dishData  Input data as a transferable {value, type} pair.
   * @returns         A promise that resolves with the ExecutionResult.
   */
  async executeOperation(
    nodeId: string,
    opName: string,
    args: any[],
    dishData: DishData,
  ): Promise<ExecutionResult> {
    return executeOperation(nodeId, opName, args, dishData);
  }

  /**
   * Terminate any background resources.  Currently a no-op; will
   * terminate the Web Worker once one is used.
   */
  dispose(): void {
    // No-op for main-thread execution.
  }
}

/** Shared singleton so callers do not need to manage lifecycle. */
let sharedClient: WorkerClient | null = null;

/**
 * Return (and lazily create) a shared WorkerClient instance.
 */
export function getWorkerClient(): WorkerClient {
  if (!sharedClient) {
    sharedClient = new WorkerClient();
  }
  return sharedClient;
}
