import type { OperationMeta, CategoryInfo } from './types';
import categoriesJson from '@cyberchef/config/Categories.json';
import operationConfigJson from '@cyberchef/config/OperationConfig.json';
import {
  getCustomMetas,
  getCustomCategories,
  getCustomOpClass,
  isCustomOp,
} from '@/custom-ops/_base/registry';

// Side-effect: register all custom cipher operations
import '@/custom-ops/ciphers';
// Side-effect: register all esoteric language interpreters
import '@/custom-ops/esolangs';
// Side-effect: register all backend tool operations
import '@/custom-ops/backend';

/**
 * Names of flow control operations excluded from the registry.
 * Fork and Register are kept — they are useful as regular operations.
 */
const FLOW_CONTROL_OPS = new Set([
  'Label',
  'Jump',
  'Conditional Jump',
  'Return',
  'Comment',
  'Subsection',
  'Magic', // CyberWeb has its own Magic node
]);

/**
 * Use the pre-generated OperationConfig.json for metadata instead of
 * eagerly importing all 465 operation modules (which is slow and
 * crashes due to browser-incompatible transitive deps).
 *
 * Operation classes are loaded lazily on first execution.
 */

const operationConfig = operationConfigJson as unknown as Record<
  string,
  {
    module: string;
    description: string;
    infoURL?: string | null;
    inputType: string;
    outputType: string;
    flowControl: boolean;
    manualBake?: boolean;
    args: any[];
    className?: string;
  }
>;

/** Flat array of metadata for every registered operation. */
let operationMetas: OperationMeta[] = [];

/** Category list mirroring CyberChef's Categories.json, filtered. */
let categories: CategoryInfo[] = [];

/** Cache of lazily-loaded operation class constructors. */
const operationClasses = new Map<string, new () => any>();

/** Whether the registry has been initialised. */
let initialised = false;

/**
 * Build the metadata arrays from OperationConfig.json.
 * This is synchronous and fast — no dynamic imports.
 */
export function init(): void {
  if (initialised) return;

  const metas: OperationMeta[] = [];
  const registeredNames = new Set<string>();

  for (const [name, config] of Object.entries(operationConfig)) {
    if (FLOW_CONTROL_OPS.has(name)) continue;

    registeredNames.add(name);
    metas.push({
      name,
      module: config.module ?? '',
      description: config.description ?? '',
      infoURL: config.infoURL ?? null,
      inputType: config.inputType ?? 'string',
      outputType: config.outputType ?? 'string',
      args: config.args ?? [],
      flowControl: false,
    });
  }

  // Patch: add extra built-in regexes to "Regular expression" populateOption
  const regexMeta = metas.find((m) => m.name === 'Regular expression');
  if (regexMeta && regexMeta.args.length > 0 && regexMeta.args[0].type === 'populateOption') {
    const popValues = regexMeta.args[0].value as { name: string; value: string }[];
    if (!popValues.some((v) => v.name === 'Base64')) {
      popValues.push({
        name: 'Base64',
        value: '[A-Za-z0-9+/]{20,}={0,2}',
      });
    }
  }

  // Append custom operation metadata
  operationMetas = [...metas, ...getCustomMetas()];

  categories = (categoriesJson as CategoryInfo[]).map((cat) => ({
    name: cat.name,
    ops: cat.ops.filter((op) => registeredNames.has(op)),
  }));

  // Append custom categories
  categories = [...categories, ...getCustomCategories()];

  initialised = true;
}

/**
 * Return metadata for all registered operations.
 */
export function getAll(): OperationMeta[] {
  init();
  return operationMetas;
}

/**
 * Lazily load and return an operation class constructor by name.
 * Uses dynamic import.meta.glob with lazy loading.
 */
const operationModules = import.meta.glob<{ default: any }>(
  '@cyberchef/operations/*.mjs',
);

/** Map from operation name to module path, built lazily. */
let nameToPath: Map<string, string> | null = null;

function buildNameToPath(): Map<string, string> {
  if (nameToPath) return nameToPath;
  nameToPath = new Map();

  // Index glob keys by filename (without .mjs extension)
  const pathsByFilename = new Map<string, string>();
  for (const p of Object.keys(operationModules)) {
    const filename = p.split('/').pop()?.replace('.mjs', '') ?? '';
    pathsByFilename.set(filename, p);
  }

  for (const [name, config] of Object.entries(operationConfig)) {
    // Prefer the className field written by generate-config.mjs
    if (config.className) {
      const path = pathsByFilename.get(config.className);
      if (path) { nameToPath.set(name, path); continue; }
    }
    // Fallback: strip spaces/special chars (works for simple cases)
    const guessed = name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9_]/g, '');
    const path = pathsByFilename.get(guessed);
    if (path) { nameToPath.set(name, path); }
  }

  return nameToPath;
}

/**
 * Look up an operation class constructor by its human-readable name.
 * Loads the module lazily on first access.
 */
export async function loadOperation(
  name: string,
): Promise<(new () => any) | undefined> {
  // Check cache first
  const cached = operationClasses.get(name);
  if (cached) return cached;

  // Custom operations are already loaded synchronously
  const customClass = getCustomOpClass(name);
  if (customClass) {
    operationClasses.set(name, customClass);
    return customClass;
  }

  const paths = buildNameToPath();
  const modulePath = paths.get(name);
  if (!modulePath) return undefined;

  const loader = operationModules[modulePath];
  if (!loader) return undefined;

  try {
    const mod = await loader();
    const OpClass = mod.default;
    if (OpClass) {
      operationClasses.set(name, OpClass);
      return OpClass;
    }
  } catch (err) {
    console.warn(`[OperationRegistry] Failed to load "${name}":`, err);
  }
  return undefined;
}

/**
 * Synchronous lookup — only returns if the operation was already loaded.
 */
export function getByName(name: string): (new () => any) | undefined {
  return operationClasses.get(name);
}

/**
 * Return the full category list.
 */
export function getCategories(): CategoryInfo[] {
  init();
  return categories;
}

/**
 * Return the metadata for a single operation, or `undefined`.
 */
export function getMeta(name: string): OperationMeta | undefined {
  init();
  return operationMetas.find((m) => m.name === name);
}
