/**
 * Chuck Norris Unary encoding/decoding.
 * Reference: https://www.dcode.fr/chuck-norris-unary
 *
 * Each character is converted to its 7-bit ASCII binary, then the binary
 * is encoded as alternating groups of 0s:
 * - "0" prefix  = group of 1-bits
 * - "00" prefix = group of 0-bits
 * The count of 0s after the prefix gives the run length.
 */

/**
 * Encode a string to Chuck Norris unary format.
 */
export function chuckNorrisEncode(input: string): string {
  // Convert to 7-bit binary string
  let bits = '';
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i) & 0x7F;
    bits += code.toString(2).padStart(7, '0');
  }

  if (bits.length === 0) return '';

  // Run-length encode
  const groups: string[] = [];
  let i = 0;
  while (i < bits.length) {
    const bit = bits[i];
    let run = 0;
    while (i < bits.length && bits[i] === bit) {
      run++;
      i++;
    }
    // Prefix: "0" for 1-bits, "00" for 0-bits
    const prefix = bit === '1' ? '0' : '00';
    // Count: that many 0s
    const count = '0'.repeat(run);
    groups.push(prefix + ' ' + count);
  }

  return groups.join(' ');
}

/**
 * Decode Chuck Norris unary format back to text.
 */
export function chuckNorrisDecode(input: string): string {
  const tokens = input.trim().split(/\s+/);
  if (tokens.length === 0 || (tokens.length === 1 && tokens[0] === '')) return '';

  let bits = '';
  let i = 0;
  while (i < tokens.length) {
    const prefix = tokens[i];
    if (i + 1 >= tokens.length) break;
    const count = tokens[i + 1];

    let bit: string;
    if (prefix === '0') {
      bit = '1';
    } else if (prefix === '00') {
      bit = '0';
    } else {
      throw new Error(`Invalid Chuck Norris prefix: "${prefix}"`);
    }

    // Validate count is all 0s
    if (!/^0+$/.test(count)) {
      throw new Error(`Invalid Chuck Norris count: "${count}"`);
    }

    bits += bit.repeat(count.length);
    i += 2;
  }

  // Convert 7-bit groups to characters
  let result = '';
  for (let j = 0; j + 7 <= bits.length; j += 7) {
    const charCode = parseInt(bits.slice(j, j + 7), 2);
    result += String.fromCharCode(charCode);
  }

  return result;
}
