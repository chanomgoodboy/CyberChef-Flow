/**
 * Static registry of operations to try with crib/secret values.
 * Used by the worker's handleCribAnalyze to brute-force known secrets
 * against common keyed operations.
 */

import { getAll } from '@/adapter/OperationRegistry';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CribOpDef {
  /** Operation name (exact match in registry). */
  op: string;
  /** Maps a secret string to the operation's arg array. */
  buildArgs: (secret: string) => any[];
}

/* ------------------------------------------------------------------ */
/*  Hardcoded tier-1 operations                                        */
/* ------------------------------------------------------------------ */

const HARDCODED_OPS: CribOpDef[] = [
  // XOR with UTF-8 key
  {
    op: 'XOR',
    buildArgs: (secret) => [
      { option: 'UTF8', string: secret },
      'Standard',
      false,
    ],
  },
  // XOR with Hex key
  {
    op: 'XOR',
    buildArgs: (secret) => {
      const hex = Array.from(new TextEncoder().encode(secret))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return [{ option: 'Hex', string: hex }, 'Standard', false];
    },
  },
  // RC4
  {
    op: 'RC4',
    buildArgs: (secret) => [
      { option: 'UTF8', string: secret },
      'Latin1',
      'Latin1',
    ],
  },
  // Vigenere Decode
  {
    op: 'Vigenère Decode',
    buildArgs: (secret) => [secret],
  },
];

/* ------------------------------------------------------------------ */
/*  Auto-discover classical cipher decode ops                          */
/* ------------------------------------------------------------------ */

let discovered: CribOpDef[] | null = null;

function discoverClassicalOps(): CribOpDef[] {
  if (discovered) return discovered;
  discovered = [];

  const allMetas = getAll();
  for (const meta of allMetas) {
    // Only "Classical Ciphers" category ops with Decode/Decipher in name
    if (meta.module !== '' && meta.module !== 'Default') continue;

    // Check all metas: look for ops in categories matching classical ciphers
    const nameMatch =
      meta.name.includes('Decode') ||
      meta.name.includes('Decipher') ||
      meta.name.includes('Cipher');
    if (!nameMatch) continue;

    // Must have a first arg named Key or Keyword of type string/shortString/toggleString
    if (meta.args.length === 0) continue;
    const firstArg = meta.args[0];
    const argNameMatch =
      firstArg.name === 'Key' ||
      firstArg.name === 'Keyword' ||
      firstArg.name === 'Passphrase';
    const argTypeMatch =
      firstArg.type === 'string' ||
      firstArg.type === 'shortString' ||
      firstArg.type === 'toggleString';
    if (!argNameMatch || !argTypeMatch) continue;

    // Skip if already in hardcoded list
    if (HARDCODED_OPS.some((h) => h.op === meta.name)) continue;

    discovered.push({
      op: meta.name,
      buildArgs: (secret) => {
        // Build args with secret as first value, rest as defaults
        const args: any[] = meta.args.map((a) => a.value);
        if (firstArg.type === 'toggleString') {
          args[0] = { option: 'UTF8', string: secret };
        } else {
          args[0] = secret;
        }
        return args;
      },
    });
  }

  return discovered;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/** Return the full list of crib operations to try. */
export function getCribOps(): CribOpDef[] {
  return [...HARDCODED_OPS, ...discoverClassicalOps()];
}

/** Set of operation names that are crib ops (for badge detection). */
let cribOpNames: Set<string> | null = null;

export function isCribOp(opName: string): boolean {
  if (!cribOpNames) {
    cribOpNames = new Set(getCribOps().map((d) => d.op));
  }
  return cribOpNames.has(opName);
}
