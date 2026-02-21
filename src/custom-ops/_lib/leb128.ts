/**
 * LEB128 (Little Endian Base 128) encoding/decoding.
 * Reference: https://en.wikipedia.org/wiki/LEB128
 *
 * Variable-length encoding for integers. Each byte uses 7 bits for data
 * and 1 bit (MSB) as a continuation flag.
 * Used in DWARF debug format, WebAssembly, etc.
 */

/**
 * Encode an unsigned integer to ULEB128 bytes.
 */
export function uleb128encode(value: number): number[] {
  if (value < 0) throw new Error('ULEB128 requires non-negative integers');
  const bytes: number[] = [];
  do {
    let byte = value & 0x7F;
    value = Math.floor(value / 128); // Use division for large numbers
    if (value > 0) byte |= 0x80; // set continuation bit
    bytes.push(byte);
  } while (value > 0);
  return bytes;
}

/**
 * Decode ULEB128 bytes to an unsigned integer.
 */
export function uleb128decode(bytes: number[]): { value: number; bytesRead: number } {
  let result = 0;
  let shift = 0;
  let i = 0;
  for (; i < bytes.length; i++) {
    const byte = bytes[i];
    result |= (byte & 0x7F) * Math.pow(2, shift); // Use multiplication for large shifts
    shift += 7;
    if ((byte & 0x80) === 0) {
      i++;
      break;
    }
  }
  return { value: result, bytesRead: i };
}

/**
 * Encode a signed integer to SLEB128 bytes.
 */
export function sleb128encode(value: number): number[] {
  const bytes: number[] = [];
  let more = true;
  while (more) {
    let byte = value & 0x7F;
    value >>= 7;
    // If the sign bit (bit 6) of byte is set and value is -1, or
    // sign bit is clear and value is 0, we're done.
    if ((value === 0 && (byte & 0x40) === 0) || (value === -1 && (byte & 0x40) !== 0)) {
      more = false;
    } else {
      byte |= 0x80;
    }
    bytes.push(byte);
  }
  return bytes;
}

/**
 * Decode SLEB128 bytes to a signed integer.
 */
export function sleb128decode(bytes: number[]): { value: number; bytesRead: number } {
  let result = 0;
  let shift = 0;
  let i = 0;
  let byte: number;
  do {
    byte = bytes[i];
    result |= (byte & 0x7F) << shift;
    shift += 7;
    i++;
  } while (byte & 0x80);

  // Sign extend
  if (shift < 32 && (byte & 0x40) !== 0) {
    result |= -(1 << shift);
  }
  return { value: result, bytesRead: i };
}

/**
 * Encode a string of numbers to LEB128 hex representation.
 */
export function leb128encodeString(input: string, signed: boolean = false): string {
  const numbers = input.trim().split(/[\s,]+/).filter(Boolean);
  const results: string[] = [];

  for (const numStr of numbers) {
    const n = parseInt(numStr, 10);
    if (isNaN(n)) throw new Error(`Invalid number: "${numStr}"`);
    const bytes = signed ? sleb128encode(n) : uleb128encode(n);
    results.push(bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' '));
  }

  return results.join('\n');
}

/**
 * Decode LEB128 hex back to numbers.
 */
export function leb128decodeString(input: string, signed: boolean = false): string {
  const hexStr = input.trim().replace(/\n/g, ' ');
  const hexParts = hexStr.split(/\s+/).filter(Boolean);
  const bytes = hexParts.map(h => parseInt(h, 16));

  const numbers: number[] = [];
  let offset = 0;
  while (offset < bytes.length) {
    const { value, bytesRead } = signed
      ? sleb128decode(bytes.slice(offset))
      : uleb128decode(bytes.slice(offset));
    numbers.push(value);
    offset += bytesRead;
  }

  return numbers.join(' ');
}
