/**
 * basE91 encoding/decoding.
 * Reference: https://base91.sourceforge.net/
 *
 * Uses 91 printable ASCII characters to represent binary data.
 * More efficient than Base64 (~23% smaller for random data).
 */

export const BASE91_TABLE =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
  '!#$%&()*+,./:;<=>?@[]^_`{|}~"';

const DECODE_TABLE = new Int8Array(256).fill(-1);
for (let i = 0; i < BASE91_TABLE.length; i++) {
  DECODE_TABLE[BASE91_TABLE.charCodeAt(i)] = i;
}

/**
 * Encode a byte array to a basE91 string.
 */
export function base91encode(data: Uint8Array): string {
  let result = '';
  let b = 0;   // bit buffer
  let n = 0;   // number of bits in buffer

  for (const byte of data) {
    b |= byte << n;
    n += 8;

    if (n > 13) {
      let v = b & 8191; // 13 bits
      if (v > 88) {
        b >>= 13;
        n -= 13;
      } else {
        v = b & 16383; // 14 bits
        b >>= 14;
        n -= 14;
      }
      result += BASE91_TABLE[v % 91] + BASE91_TABLE[(v / 91) | 0];
    }
  }

  // Remaining bits
  if (n > 0) {
    result += BASE91_TABLE[b % 91];
    if (n > 7 || b > 90) {
      result += BASE91_TABLE[(b / 91) | 0];
    }
  }

  return result;
}

/**
 * Decode a basE91 string to a byte array.
 */
export function base91decode(encoded: string): Uint8Array {
  const output: number[] = [];
  let b = 0;   // bit buffer
  let n = 0;   // number of bits in buffer
  let v = -1;  // accumulator for pair

  for (let i = 0; i < encoded.length; i++) {
    const d = DECODE_TABLE[encoded.charCodeAt(i)];
    if (d === -1) continue; // skip invalid chars

    if (v === -1) {
      v = d;
    } else {
      v += d * 91;
      b |= v << n;
      n += (v & 8191) > 88 ? 13 : 14;
      do {
        output.push(b & 0xFF);
        b >>= 8;
        n -= 8;
      } while (n > 7);
      v = -1;
    }
  }

  // Handle trailing character
  if (v !== -1) {
    output.push((b | (v << n)) & 0xFF);
  }

  return new Uint8Array(output);
}
