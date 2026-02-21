// Types
export type {
  ArgDefinition,
  OperationMeta,
  CategoryInfo,
  DishData,
  ExecutionRequest,
  ExecutionResult,
} from './types';

// Operation registry (discover & look up CyberChef operations)
export {
  init as initRegistry,
  getAll as getAllOperations,
  getByName as getOperationClass,
  loadOperation,
  getCategories,
  getMeta as getOperationMeta,
} from './OperationRegistry';

// Operation adapter (execute a single operation)
export { OperationAdapter } from './OperationAdapter';

// Dish utilities
export {
  Dish,
  createDish,
  cloneDish,
  dishToString,
  dishToTransferable,
  dishFromTransferable,
  getDishTypeLabel,
} from './DishBridge';

// Execution
export { executeOperation } from './worker/ExecutionWorker';
export { WorkerClient, getWorkerClient } from './worker/WorkerClient';
