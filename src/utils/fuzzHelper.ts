/**
 * Fuzz test helper — loaded in dev mode only.
 *
 * Exposes window.__FUZZ__ with a fast `runRoundtrip()` function
 * that executes encode→decode on the main thread via OperationAdapter.
 */

import Dish from '@cyberchef/Dish.mjs';
import { OperationAdapter } from '@/adapter/OperationAdapter';
import { getMeta, getAll, init } from '@/adapter/OperationRegistry';
import { resolveArgDefault } from '@/utils/argDefaults';
import type { ArgDefinition } from '@/adapter/types';

init();

export interface FuzzResult {
  ok: boolean;
  output: string;
  encodeOutput?: string;
  error?: string;
}

function defaultArgValues(opName: string): any[] {
  const meta = getMeta(opName);
  if (!meta) return [];
  return meta.args.map((a: ArgDefinition) => resolveArgDefault(a));
}

async function runRoundtrip(
  encodeName: string,
  decodeName: string,
  input: string,
  encodeArgOverrides?: any[],
  decodeArgOverrides?: any[],
): Promise<FuzzResult> {
  try {
    const encoder = await OperationAdapter.create(encodeName);
    const decoder = await OperationAdapter.create(decodeName);

    const encodeArgs = encodeArgOverrides ?? defaultArgValues(encodeName);
    const decodeArgs = decodeArgOverrides ?? defaultArgValues(decodeName);

    const inputDish = new Dish(input, Dish.STRING);
    const encoded = await encoder.execute(inputDish, encodeArgs);

    // Capture intermediate for debugging
    const encodeOutput = await Promise.resolve(encoded.get(Dish.STRING));

    const decoded = await decoder.execute(encoded, decodeArgs);
    const output = await Promise.resolve(decoded.get(Dish.STRING));

    return { ok: output === input, output, encodeOutput, error: undefined };
  } catch (err: any) {
    return { ok: false, output: '', error: err?.message ?? String(err) };
  }
}

function getAllOpNames(): string[] {
  return getAll().map((m) => m.name);
}

function getOpMeta(name: string) {
  const meta = getMeta(name);
  if (!meta) return null;
  return {
    name: meta.name,
    module: meta.module,
    inputType: meta.inputType,
    outputType: meta.outputType,
    args: meta.args.map((a) => ({
      name: a.name,
      type: a.type,
      value: a.value,
    })),
  };
}

export function initFuzzHelper() {
  (window as any).__FUZZ__ = {
    runRoundtrip,
    getAllOpNames,
    getOpMeta,
    defaultArgValues,
  };
}
