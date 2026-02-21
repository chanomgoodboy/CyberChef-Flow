/**
 * Straddling Checkerboard — used in the VIC cipher and other Cold War ciphers.
 *
 * A 3-row, 10-column grid where:
 * - Row 0 (header): 8 letters assigned to single digits (the 2 blank positions
 *   become the row prefixes for rows 1 and 2)
 * - Rows 1-2: remaining 18 letters + 2 digits/symbols, each encoded as
 *   a 2-digit number (prefix + column)
 *
 * The key determines letter ordering; the two "spare" column positions in
 * row 0 determine the prefixes for rows 1 and 2.
 */

/**
 * Build a straddling checkerboard from a keyword and column order.
 *
 * @param keyword  — up to 26 unique letters (keyword + remaining alphabet)
 * @param blanks   — two column indices (0-9) that are blank in the header row
 * @returns encode/decode maps
 */
export function buildCheckerboard(
  keyword: string,
  blanks: [number, number] = [2, 6],
): { encode: Record<string, string>; decode: Record<string, string> } {
  // Build unique alphabet from keyword
  const seen = new Set<string>();
  const alpha: string[] = [];
  for (const ch of (keyword + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ').toUpperCase()) {
    if (/[A-Z]/.test(ch) && !seen.has(ch)) {
      seen.add(ch);
      alpha.push(ch);
    }
  }

  const [b1, b2] = blanks[0] < blanks[1] ? blanks : [blanks[1], blanks[0]];
  const prefix1 = String(b1);
  const prefix2 = String(b2);

  const encode: Record<string, string> = {};
  const decode: Record<string, string> = {};

  let idx = 0;

  // Row 0: 8 letters at non-blank columns → single digit
  for (let col = 0; col < 10; col++) {
    if (col === b1 || col === b2) continue;
    if (idx < alpha.length) {
      const letter = alpha[idx++];
      const code = String(col);
      encode[letter] = code;
      decode[code] = letter;
    }
  }

  // Row 1: 10 letters → prefix1 + column
  for (let col = 0; col < 10; col++) {
    if (idx < alpha.length) {
      const letter = alpha[idx++];
      const code = prefix1 + String(col);
      encode[letter] = code;
      decode[code] = letter;
    }
  }

  // Row 2: remaining letters → prefix2 + column
  for (let col = 0; col < 10; col++) {
    if (idx < alpha.length) {
      const letter = alpha[idx++];
      const code = prefix2 + String(col);
      encode[letter] = code;
      decode[code] = letter;
    }
  }

  return { encode, decode };
}

/**
 * Encode text using a straddling checkerboard.
 */
export function checkerboardEncode(
  text: string,
  encodeMap: Record<string, string>,
): string {
  let result = '';
  for (const ch of text.toUpperCase()) {
    if (encodeMap[ch]) {
      result += encodeMap[ch];
    }
    // Skip non-alphabetic characters
  }
  return result;
}

/**
 * Decode digits using a straddling checkerboard.
 */
export function checkerboardDecode(
  digits: string,
  decodeMap: Record<string, string>,
  blanks: [number, number] = [2, 6],
): string {
  const [b1, b2] = blanks[0] < blanks[1] ? blanks : [blanks[1], blanks[0]];
  const prefixes = new Set([String(b1), String(b2)]);
  let result = '';
  let i = 0;

  while (i < digits.length) {
    const d = digits[i];
    if (!/\d/.test(d)) { i++; continue; }

    if (prefixes.has(d) && i + 1 < digits.length) {
      // 2-digit code
      const code = digits.slice(i, i + 2);
      result += decodeMap[code] ?? '?';
      i += 2;
    } else {
      // 1-digit code
      result += decodeMap[d] ?? '?';
      i += 1;
    }
  }

  return result;
}

/**
 * Simple columnar transposition.
 */
export function columnarTranspose(text: string, key: number[]): string {
  const cols = key.length;
  const rows = Math.ceil(text.length / cols);
  const grid: string[][] = [];

  for (let r = 0; r < rows; r++) {
    grid.push([]);
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      grid[r].push(idx < text.length ? text[idx] : '');
    }
  }

  // Read columns in key order
  const order = key.map((_, i) => i).sort((a, b) => key[a] - key[b]);
  let result = '';
  for (const col of order) {
    for (let r = 0; r < rows; r++) {
      result += grid[r][col];
    }
  }
  return result;
}

/**
 * Reverse columnar transposition.
 */
export function columnarUntranspose(text: string, key: number[]): string {
  const cols = key.length;
  const rows = Math.ceil(text.length / cols);
  const extra = text.length % cols || cols;

  const order = key.map((_, i) => i).sort((a, b) => key[a] - key[b]);

  // Physical columns 0..extra-1 have `rows` chars, the rest have `rows-1`
  const colLengths: number[] = [];
  for (let c = 0; c < cols; c++) {
    colLengths.push(c < extra ? rows : rows - 1);
  }

  // Fill columns in key order (ciphertext was written column-by-column in key order)
  const columns: string[][] = new Array(cols).fill(null).map(() => []);
  let pos = 0;
  for (const col of order) {
    for (let r = 0; r < colLengths[col]; r++) {
      columns[col].push(pos < text.length ? text[pos++] : '');
    }
  }

  // Read row by row
  let result = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r < columns[c].length) {
        result += columns[c][r];
      }
    }
  }
  return result;
}

/**
 * Derive numeric key from a keyword string.
 * Letters are numbered by their alphabetical rank (ties broken left-to-right).
 */
export function keyToNumbers(keyword: string): number[] {
  const chars = [...keyword.toUpperCase()];
  const indexed = chars.map((ch, i) => ({ ch, i }));
  indexed.sort((a, b) => a.ch < b.ch ? -1 : a.ch > b.ch ? 1 : a.i - b.i);
  const result = new Array(chars.length);
  indexed.forEach((item, rank) => { result[item.i] = rank; });
  return result;
}
