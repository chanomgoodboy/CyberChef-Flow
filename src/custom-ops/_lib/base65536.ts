/**
 * Base65536 encoding/decoding.
 * Reference: https://github.com/qntm/base65536
 *
 * Encodes binary data using a large repertoire of Unicode code points,
 * packing 16 bits (2 bytes) per character. Uses carefully chosen "safe"
 * Unicode ranges from CJK, Yi, Linear A/B, Egyptian Hieroglyphs, etc.
 *
 * For a trailing single byte, a separate 256-char "padding" repertoire is used.
 */

const BITS_PER_CHAR = 16;
const BITS_PER_BYTE = 8;

// Compressed representation of inclusive ranges used by the encoding.
// pairStrings[0] = 16-bit (2-byte) repertoire = 65536 code points
// pairStrings[1] = 8-bit (1-byte padding) repertoire = 256 code points
const pairStrings = [
  '㐀䳿一黿ꄀꏿꔀꗿ𐘀𐛿𒀀𒋿𓀀𓏿𔐀𔗿𖠀𖧿𠀀𨗿',
  'ᔀᗿ',
];

// Build lookup tables
const lookupE: Record<number, Record<number, string>> = {};
const lookupD: Record<string, [number, number]> = {};

pairStrings.forEach((pairString, r) => {
  const numZBits = BITS_PER_CHAR - BITS_PER_BYTE * r; // 0→16, 1→8
  lookupE[numZBits] = {};
  let z2 = 0;
  const chars = [...pairString];
  for (let pi = 0; pi < chars.length; pi += 2) {
    const first = chars[pi].codePointAt(0)!;
    const last = chars[pi + 1].codePointAt(0)!;
    for (let codePoint = first; codePoint <= last; codePoint++) {
      const chr = String.fromCodePoint(codePoint);
      // SPECIAL CASE: flip bytes (Base65536 was constructed with bytes in wrong order originally)
      const z = numZBits === BITS_PER_CHAR ? 256 * (z2 % 256) + (z2 >> 8) : z2;
      lookupE[numZBits][z] = chr;
      lookupD[chr] = [numZBits, z];
      z2++;
    }
  }
});

/**
 * Encode a byte array to a Base65536 string.
 */
export function base65536encode(data: Uint8Array): string {
  let str = '';
  let z = 0;
  let numZBits = 0;

  for (let i = 0; i < data.length; i++) {
    const uint8 = data[i];
    // Take most significant bit first
    for (let j = BITS_PER_BYTE - 1; j >= 0; j--) {
      const bit = (uint8 >> j) & 1;
      z = (z << 1) + bit;
      numZBits++;

      if (numZBits === BITS_PER_CHAR) {
        str += lookupE[numZBits][z];
        z = 0;
        numZBits = 0;
      }
    }
  }

  if (numZBits !== 0) {
    // Trailing byte — use 8-bit repertoire
    str += lookupE[numZBits][z];
  }

  return str;
}

/**
 * Decode a Base65536 string back to bytes.
 */
export function base65536decode(encoded: string): Uint8Array {
  const uint8Array = new Uint8Array(Math.ceil([...encoded].length * BITS_PER_CHAR / BITS_PER_BYTE));
  let numUint8s = 0;
  let uint8 = 0;
  let numUint8Bits = 0;
  let shouldBeNoMoreChars = false;

  for (const chr of encoded) {
    if (shouldBeNoMoreChars) {
      throw new Error('Secondary character found before end of input');
    }

    const entry = lookupD[chr];
    if (entry === undefined) {
      // Skip whitespace
      if (chr.trim() === '') continue;
      throw new Error(`Unrecognised Base65536 character: ${chr}`);
    }

    const [numZBits, z] = entry;

    // Take most significant bit first
    for (let j = numZBits - 1; j >= 0; j--) {
      const bit = (z >> j) & 1;
      uint8 = (uint8 << 1) + bit;
      numUint8Bits++;

      if (numUint8Bits === BITS_PER_BYTE) {
        uint8Array[numUint8s] = uint8;
        numUint8s++;
        uint8 = 0;
        numUint8Bits = 0;
      }
    }

    if (numZBits !== BITS_PER_CHAR) {
      shouldBeNoMoreChars = true;
    }
  }

  return new Uint8Array(uint8Array.buffer, 0, numUint8s);
}
