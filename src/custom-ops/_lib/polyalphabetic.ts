import { mod, ALPHABET } from './alphabet';

/**
 * Generic polyalphabetic cipher engine.
 *
 * @param input - Plaintext or ciphertext
 * @param key - Key string (letters only) or array of numeric shifts
 * @param shiftFn - Given (plainIndex, keyIndex) returns the output index (0-25)
 * @param alphabet - Alphabet to use (default A-Z)
 */
export function polyalphabeticCipher(
  input: string,
  key: string | number[],
  shiftFn: (pIdx: number, kIdx: number) => number,
  alphabet: string = ALPHABET,
): string {
  const keyIndices: number[] =
    typeof key === 'string'
      ? [...key.toUpperCase()].map((ch) => alphabet.indexOf(ch)).filter((i) => i >= 0)
      : key;

  if (keyIndices.length === 0) return input;

  const m = alphabet.length;
  let keyPos = 0;
  let result = '';

  for (const ch of input) {
    const upper = ch.toUpperCase();
    const idx = alphabet.indexOf(upper);
    if (idx < 0) {
      result += ch; // non-alphabetic passthrough
      continue;
    }
    const kIdx = keyIndices[keyPos % keyIndices.length];
    const outIdx = mod(shiftFn(idx, kIdx), m);
    const outCh = alphabet[outIdx];
    result += ch === upper ? outCh : outCh.toLowerCase();
    keyPos++;
  }

  return result;
}
