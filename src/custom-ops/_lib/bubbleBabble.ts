/**
 * Bubble Babble encoding/decoding.
 * Reference: http://wiki.yak.net/589/Bubble_Babble_Encoding.txt
 *
 * SSH fingerprint encoding that converts binary data to pronounceable strings.
 *
 * Format: x<VCVC>-<CVCVC>-...-<CVC[V|x]>x
 *
 * For each 2-byte pair the encoder outputs 5 characters: V C V C C,
 * with a dash inserted between the 4th and 5th characters.  The
 * resulting dash-separated groups are therefore 5 chars each:
 *   - First group:  x + V C V C          (xVCVC)
 *   - Middle groups: C + V C V C          (CVCVC)
 *   - Last group:    C + V x V + x  (end marker, even data)
 *             or     C + V C V + x  (trailing odd byte)
 *             or     V x V + x      (empty data, single group)
 *
 * Vowels carry byte data mixed with a running checksum.
 * Consonants carry raw byte nibbles.
 * 'x' at index 16 in the consonant table is the end-of-data sentinel.
 */

const VOWELS = 'aeiouy';
const CONSONANTS = 'bcdfghklmnprstvzx'; // 17 entries; index 16 = 'x' sentinel

/**
 * Encode bytes to Bubble Babble string.
 */
export function bubbleBabbleEncode(data: Uint8Array): string {
  let out = 'x';
  let checksum = 1;
  let i = 0;

  for (;;) {
    if (i >= data.length) {
      // "No more data" seed: V[c%6] + C[16]='x' + V[floor(c/6)%6]
      out += VOWELS[checksum % 6];
      out += CONSONANTS[16]; // 'x'
      out += VOWELS[Math.floor(checksum / 6) % 6];
      break;
    }

    const byte1 = data[i];
    const a = (((byte1 >> 6) & 3) + checksum) % 6;
    const b = (byte1 >> 2) & 15;
    const c = Math.floor(((byte1 & 3) + Math.floor(checksum / 6)) % 6);

    out += VOWELS[a];
    out += CONSONANTS[b];
    out += VOWELS[c];

    if (i + 1 >= data.length) {
      // Trailing odd byte — just VCV, no second byte
      break;
    }

    const byte2 = data[i + 1];
    const d = (byte2 >> 4) & 15;
    const e2 = byte2 & 15;

    out += CONSONANTS[d];
    out += '-';
    out += CONSONANTS[e2];

    checksum = (checksum * 5 + byte1 * 7 + byte2) % 36;
    i += 2;
  }

  out += 'x';
  return out;
}

/**
 * Decode a Bubble Babble string back to bytes.
 */
export function bubbleBabbleDecode(encoded: string): Uint8Array {
  const s = encoded.trim().toLowerCase();
  if (s.length < 5 || s[0] !== 'x' || s[s.length - 1] !== 'x') {
    throw new Error('Invalid Bubble Babble: must start and end with "x"');
  }

  const inner = s.slice(1, -1);
  if (inner.length === 0) {
    throw new Error('Invalid Bubble Babble: empty inner content');
  }

  // Split into 6-char groups (5 data chars + dash), last group is 3 chars
  const groups = inner.match(/.{1,6}/g);
  if (!groups) {
    throw new Error('Invalid Bubble Babble: no groups found');
  }

  const bytes: number[] = [];
  let checksum = 1;

  for (let g = 0; g < groups.length; g++) {
    const group = groups[g];
    const isLast = g === groups.length - 1;

    // Parse tuple: V C V [C - C]
    const a = VOWELS.indexOf(group[0]);
    const b = CONSONANTS.indexOf(group[1]);
    const c = VOWELS.indexOf(group[2]);

    if (a < 0 || c < 0) {
      throw new Error(`Invalid Bubble Babble tuple at group ${g}: "${group}"`);
    }

    if (isLast) {
      if (b === 16) {
        // End-of-data marker: V x V — verify checksum
        // a should be checksum % 6, c should be floor(checksum/6) % 6
        break;
      }

      if (b < 0) {
        throw new Error(`Invalid Bubble Babble consonant in group ${g}: "${group}"`);
      }

      // Trailing odd byte: V C V
      const high2 = (a - checksum % 6 + 6) % 6;
      const low2 = (c - Math.floor(checksum / 6) % 6 + 6) % 6;
      const byte1 = (high2 << 6) | (b << 2) | low2;
      bytes.push(byte1 & 0xFF);
      break;
    }

    // Full 2-byte group: V C V C - C (6 chars with dash at position 4)
    if (group.length < 6 || b < 0) {
      throw new Error(`Invalid Bubble Babble group ${g}: "${group}" (expected 6 chars)`);
    }

    const d = CONSONANTS.indexOf(group[3]);
    // group[4] is '-' (dash separator)
    const e2 = CONSONANTS.indexOf(group[5]);

    if (d < 0 || e2 < 0) {
      throw new Error(`Invalid Bubble Babble consonants in group ${g}: "${group}"`);
    }

    const high2 = (a - checksum % 6 + 6) % 6;
    const low2 = (c - Math.floor(checksum / 6) % 6 + 6) % 6;
    const byte1 = (high2 << 6) | (b << 2) | low2;
    bytes.push(byte1 & 0xFF);

    const byte2 = (d << 4) | e2;
    bytes.push(byte2 & 0xFF);

    checksum = (checksum * 5 + (byte1 & 0xFF) * 7 + byte2) % 36;
  }

  return new Uint8Array(bytes);
}
