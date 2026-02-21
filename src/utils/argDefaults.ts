import { getMeta } from '@/adapter/OperationRegistry';
import type { ArgDefinition } from '@/adapter/types';

const OPTION_TYPES = new Set([
  'option',
  'editableOption',
  'editableOptionShort',
  'argSelector',
]);

/**
 * Resolve a single CyberChef arg definition to its default scalar value.
 * For option-type args the `value` field is an array of choices --
 * we pick the first choice's scalar value.
 */
/** CyberChef uses `[Section]` / `[/Section]` as disabled group headers in option lists. */
function isSectionHeader(v: unknown): boolean {
  return typeof v === 'string' && /^\[.+\]$/.test(v);
}

export function resolveArgDefault(def: ArgDefinition): any {
  if (OPTION_TYPES.has(def.type) && Array.isArray(def.value)) {
    // Skip bracket-wrapped section headers (e.g. "[ASCII]", "[Metric]")
    const first = def.value.find((v) =>
      typeof v === 'object' ? true : !isSectionHeader(v),
    ) ?? def.value[0];
    if (typeof first === 'object' && first !== null) {
      return first.value ?? first.name ?? '';
    }
    return first ?? '';
  }
  if (def.type === 'populateOption' && Array.isArray(def.value)) {
    return def.value[0]?.name ?? '';
  }
  if (def.type === 'toggleString') {
    return { string: def.value ?? '', option: def.toggleValues?.[0] ?? '' };
  }
  return def.value;
}

/**
 * Build a complete default-args Record for an operation.
 *
 * @param opName   Operation name (e.g. "To Base64")
 * @param overrides  Optional positional overrides array -- values at
 *                   each index replace the corresponding arg default.
 */
export function buildDefaultArgs(
  opName: string,
  overrides?: any[],
): Record<string, any> {
  const meta = getMeta(opName);
  if (!meta) return {};

  const argValues: Record<string, any> = {};
  for (let i = 0; i < meta.args.length; i++) {
    const def = meta.args[i];
    if (overrides && i < overrides.length && overrides[i] !== undefined && overrides[i] !== null) {
      argValues[def.name] = overrides[i];
    } else {
      argValues[def.name] = resolveArgDefault(def);
    }
  }
  return argValues;
}
