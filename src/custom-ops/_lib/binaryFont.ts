/**
 * Binary Character Shapes — 5×5 bitmap font for A-Z.
 * Each letter is represented as 5 rows of 5 bits.
 * Each row is stored as a decimal number (0-31).
 */

export const BINARY_FONT: Record<string, number[]> = {
  A: [4, 10, 31, 17, 17],     // ..#.. .#.#. ##### #...# #...#
  B: [30, 17, 30, 17, 30],    // ####. #...# ####. #...# ####.
  C: [15, 16, 16, 16, 15],    // .#### #.... #.... #.... .####
  D: [30, 17, 17, 17, 30],    // ####. #...# #...# #...# ####.
  E: [31, 16, 30, 16, 31],    // ##### #.... ####. #.... #####
  F: [31, 16, 30, 16, 16],    // ##### #.... ####. #.... #....
  G: [15, 16, 19, 17, 15],    // .#### #.... #..## #...# .####
  H: [17, 17, 31, 17, 17],    // #...# #...# ##### #...# #...#
  I: [14, 4, 4, 4, 14],       // .###. ..#.. ..#.. ..#.. .###.
  J: [7, 2, 2, 18, 12],       // ..### ..#.. ..#.. #..#. .##..
  K: [17, 18, 28, 18, 17],    // #...# #..#. ###.. #..#. #...#
  L: [16, 16, 16, 16, 31],    // #.... #.... #.... #.... #####
  M: [17, 27, 21, 17, 17],    // #...# ##.## #.#.# #...# #...#
  N: [17, 25, 21, 19, 17],    // #...# ##..# #.#.# #..## #...#
  O: [14, 17, 17, 17, 14],    // .###. #...# #...# #...# .###.
  P: [30, 17, 30, 16, 16],    // ####. #...# ####. #.... #....
  Q: [14, 17, 17, 19, 15],    // .###. #...# #...# #..## .####
  R: [30, 17, 30, 18, 17],    // ####. #...# ####. #..#. #...#
  S: [15, 16, 14, 1, 30],     // .#### #.... .###. ....# ####.
  T: [31, 4, 4, 4, 4],        // ##### ..#.. ..#.. ..#.. ..#..
  U: [17, 17, 17, 17, 14],    // #...# #...# #...# #...# .###.
  V: [17, 17, 17, 10, 4],     // #...# #...# #...# .#.#. ..#..
  W: [17, 17, 21, 27, 17],    // #...# #...# #.#.# ##.## #...#
  X: [17, 10, 4, 10, 17],     // #...# .#.#. ..#.. .#.#. #...#
  Y: [17, 10, 4, 4, 4],       // #...# .#.#. ..#.. ..#.. ..#..
  Z: [31, 2, 4, 8, 31],       // ##### ...#. ..#.. .#... #####
};

/**
 * Render a letter as a visual 5×5 binary grid.
 */
export function renderLetter(ch: string): string {
  const rows = BINARY_FONT[ch.toUpperCase()];
  if (!rows) return '';
  return rows.map((r) => r.toString(2).padStart(5, '0')).join('\n');
}

/**
 * Encode a letter as its 5 row values (decimal numbers).
 */
export function encodeLetter(ch: string): number[] | null {
  return BINARY_FONT[ch.toUpperCase()] ?? null;
}

/**
 * Decode 5 row values back to a letter.
 */
export function decodeLetter(rows: number[]): string | null {
  if (rows.length !== 5) return null;
  for (const [letter, pattern] of Object.entries(BINARY_FONT)) {
    if (pattern.every((v, i) => v === rows[i])) return letter;
  }
  return null;
}
