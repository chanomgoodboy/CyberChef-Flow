/**
 * Determine the column read-off order from a keyword.
 * Returns an array of column indices sorted by the alphabetical
 * order of the key characters.
 *
 * Example: "ZEBRAS" → [5,2,1,3,0,4] → read columns in order [4,2,1,3,5,0]
 * Actually: sort by char, return original positions.
 */
export function keyOrder(key: string): number[] {
  const upper = key.toUpperCase();
  const indexed = [...upper].map((ch, i) => ({ ch, i }));
  indexed.sort((a, b) => {
    if (a.ch !== b.ch) return a.ch.localeCompare(b.ch);
    return a.i - b.i; // stable: preserve left-to-right for ties
  });
  // order[k] = the column index that is read k-th
  return indexed.map((entry) => entry.i);
}

/**
 * Columnar transposition encrypt.
 *
 * Writes plaintext into rows of width = key length,
 * then reads off columns in key order.
 */
export function columnarEncrypt(plaintext: string, key: string, padding: string = 'X'): string {
  const order = keyOrder(key);
  const numCols = order.length;
  if (numCols === 0) return plaintext;

  // Pad plaintext to fill last row (unless padding is empty → irregular grid)
  let text = plaintext;
  if (padding) {
    while (text.length % numCols !== 0) {
      text += padding;
    }
  }
  const numRows = Math.ceil(text.length / numCols);
  const fullCells = text.length;

  // Fill grid row by row
  const grid: string[][] = [];
  for (let r = 0; r < numRows; r++) {
    grid.push([...text.slice(r * numCols, Math.min((r + 1) * numCols, fullCells))]);
  }

  // Read columns in key order (some columns in last row may be short)
  let result = '';
  for (const col of order) {
    for (let r = 0; r < numRows; r++) {
      if (col < grid[r].length) {
        result += grid[r][col];
      }
    }
  }
  return result;
}

/**
 * Columnar transposition decrypt.
 *
 * Reverses the encrypt: fills columns in key order, then reads rows.
 */
export function columnarDecrypt(ciphertext: string, key: string): string {
  const order = keyOrder(key);
  const numCols = order.length;
  if (numCols === 0) return ciphertext;

  const numRows = Math.ceil(ciphertext.length / numCols);
  const remainder = ciphertext.length % numCols;
  // If remainder is 0, all columns are full (numRows chars each).
  // Otherwise, columns at grid positions 0..(remainder-1) have numRows chars,
  // and the rest have (numRows-1) chars.
  const fullCols = remainder === 0 ? numCols : remainder;

  const colLengths = new Array(numCols).fill(0);
  for (let c = 0; c < numCols; c++) {
    colLengths[c] = c < fullCols ? numRows : numRows - 1;
  }

  // Fill columns in key order
  const columns: string[][] = Array.from({ length: numCols }, () => []);
  let pos = 0;
  for (const col of order) {
    const len = colLengths[col];
    for (let r = 0; r < len; r++) {
      columns[col].push(ciphertext[pos++] ?? '');
    }
  }

  // Read rows
  let result = '';
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      if (r < columns[c].length) {
        result += columns[c][r];
      }
    }
  }
  return result;
}
