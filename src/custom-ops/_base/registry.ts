import type { OperationMeta, CategoryInfo } from '@/adapter/types';

/** Map from operation name → class constructor. */
const customOps = new Map<string, new () => any>();

/** Map from operation name → metadata. */
const customMetas = new Map<string, OperationMeta>();

/** Map from category name → operation names. */
const customCategories = new Map<string, string[]>();

/**
 * Register a custom operation. Called at module load time (side-effect import).
 */
export function registerCustomOp(
  OpClass: new () => any,
  meta: OperationMeta,
  category: string,
): void {
  customOps.set(meta.name, OpClass);
  customMetas.set(meta.name, meta);

  const existing = customCategories.get(category) ?? [];
  existing.push(meta.name);
  customCategories.set(category, existing);
}

/** Return metadata for all registered custom operations. */
export function getCustomMetas(): OperationMeta[] {
  return Array.from(customMetas.values());
}

/** Return categories contributed by custom operations. */
export function getCustomCategories(): CategoryInfo[] {
  const cats: CategoryInfo[] = [];
  for (const [name, ops] of customCategories) {
    cats.push({ name, ops });
  }
  return cats;
}

/** Return the class constructor for a custom operation, or undefined. */
export function getCustomOpClass(name: string): (new () => any) | undefined {
  return customOps.get(name);
}

/** Check if a name belongs to a custom operation. */
export function isCustomOp(name: string): boolean {
  return customOps.has(name);
}
