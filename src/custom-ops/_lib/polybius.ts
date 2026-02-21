import { keywordAlphabet } from './alphabet';

/**
 * Generate a Polybius square (grid) from a keyword.
 *
 * @param keyword - Keyword for keyed alphabet
 * @param size - Grid size (5 for standard I=J, 6 for ADFGVX with digits)
 * @param mergeIJ - Whether to merge I and J (standard 5x5)
 * @returns The grid as a flat string (row-major), length = size*size
 */
export function generatePolybiusSquare(
  keyword: string,
  size: number = 5,
  mergeIJ: boolean = true,
): string {
  if (size === 6) {
    // 6x6 includes digits 0-9
    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const kw = keyword.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const seen = new Set<string>();
    let result = '';
    for (const ch of kw) {
      if (!seen.has(ch)) { seen.add(ch); result += ch; }
    }
    for (const ch of alpha) {
      if (!seen.has(ch)) { seen.add(ch); result += ch; }
    }
    return result;
  }

  // 5x5 with optional I=J merge
  let alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (mergeIJ) {
    alpha = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // no J
  }
  const kw = keyword.toUpperCase().replace(/[^A-Z]/g, '');
  const normalised = mergeIJ ? kw.replace(/J/g, 'I') : kw;
  const seen = new Set<string>();
  let result = '';
  for (const ch of normalised) {
    if (!seen.has(ch)) { seen.add(ch); result += ch; }
  }
  for (const ch of alpha) {
    if (!seen.has(ch)) { seen.add(ch); result += ch; }
  }
  return result;
}

/**
 * Encode a single character to its Polybius coordinates.
 * Returns [row, col] (0-indexed).
 */
export function polybiusEncode(
  ch: string,
  grid: string,
  size: number,
  mergeIJ: boolean = true,
): [number, number] | null {
  let c = ch.toUpperCase();
  if (mergeIJ && c === 'J') c = 'I';
  const idx = grid.indexOf(c);
  if (idx < 0) return null;
  return [Math.floor(idx / size), idx % size];
}

/**
 * Decode Polybius coordinates to a character.
 */
export function polybiusDecode(
  row: number,
  col: number,
  grid: string,
  size: number,
): string {
  return grid[row * size + col] ?? '';
}
