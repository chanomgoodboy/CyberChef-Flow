/**
 * I Ching Hexagram encoding.
 * Reference: https://en.wikipedia.org/wiki/Hexagram_(I_Ching)
 *
 * The 64 I Ching hexagrams at U+4DC0..U+4DFF can represent 6-bit values (0-63).
 * This allows encoding binary data using hexagram symbols.
 */

const HEXAGRAM_START = 0x4DC0;

/**
 * Encode bytes to hexagram string. Each byte is split into two 6-bit values,
 * or each 6-bit group from the input maps to one hexagram.
 */
export function hexagramEncode(data: Uint8Array): string {
  const chars: string[] = [];
  let bits = 0;
  let numBits = 0;

  for (const byte of data) {
    bits = (bits << 8) | byte;
    numBits += 8;

    while (numBits >= 6) {
      numBits -= 6;
      const val = (bits >> numBits) & 0x3F;
      chars.push(String.fromCodePoint(HEXAGRAM_START + val));
    }
  }

  // Handle remaining bits (pad with zeros)
  if (numBits > 0) {
    const val = (bits << (6 - numBits)) & 0x3F;
    chars.push(String.fromCodePoint(HEXAGRAM_START + val));
  }

  return chars.join('');
}

/**
 * Decode hexagram string back to bytes.
 */
export function hexagramDecode(input: string): Uint8Array {
  const values: number[] = [];
  for (const ch of input) {
    const cp = ch.codePointAt(0)!;
    if (cp >= HEXAGRAM_START && cp < HEXAGRAM_START + 64) {
      values.push(cp - HEXAGRAM_START);
    }
    // Skip non-hexagram characters
  }

  // Convert 6-bit values back to bytes
  const bytes: number[] = [];
  let bits = 0;
  let numBits = 0;

  for (const val of values) {
    bits = (bits << 6) | val;
    numBits += 6;

    while (numBits >= 8) {
      numBits -= 8;
      bytes.push((bits >> numBits) & 0xFF);
    }
  }

  return new Uint8Array(bytes);
}
