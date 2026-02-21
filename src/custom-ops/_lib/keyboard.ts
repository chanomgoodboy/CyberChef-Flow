/** QWERTY keyboard layout rows. */
export const QWERTY_ROWS = [
  '`1234567890-=',
  'qwertyuiop[]\\',
  "asdfghjkl;'",
  'zxcvbnm,./',
];

export const QWERTY_ROWS_UPPER = [
  '~!@#$%^&*()_+',
  'QWERTYUIOP{}|',
  'ASDFGHJKL:"',
  'ZXCVBNM<>?',
];

/** AZERTY keyboard layout rows. */
export const AZERTY_ROWS = [
  '&1234567890-',
  'azertyuiop^$',
  'qsdfghjklm*',
  'wxcvbn,;:!',
];

/** DVORAK keyboard layout rows. */
export const DVORAK_ROWS = [
  '`1234567890[]',
  "',.-pyfgcrl/=\\",
  'aoeuidhtns-',
  ';qjkxbmwvz',
];

/** All layout names. */
export type KeyboardLayout = 'QWERTY' | 'AZERTY' | 'DVORAK';

function getLayoutRows(layout: KeyboardLayout): string[] {
  switch (layout) {
    case 'QWERTY': return QWERTY_ROWS;
    case 'AZERTY': return AZERTY_ROWS;
    case 'DVORAK': return DVORAK_ROWS;
  }
}

/**
 * Find a character's position on a keyboard layout.
 * Returns [row, col] or null.
 */
export function findKeyPosition(
  ch: string,
  layout: KeyboardLayout = 'QWERTY',
): [number, number] | null {
  const rows = getLayoutRows(layout);
  for (let r = 0; r < rows.length; r++) {
    const idx = rows[r].indexOf(ch.toLowerCase());
    if (idx >= 0) return [r, idx];
  }
  return null;
}

/**
 * Shift a character left or right on the keyboard.
 * @param shift positive = right, negative = left
 */
export function shiftKey(ch: string, shift: number, layout: KeyboardLayout = 'QWERTY'): string {
  const rows = getLayoutRows(layout);
  const isUpper = ch === ch.toUpperCase() && ch !== ch.toLowerCase();
  const lower = ch.toLowerCase();
  for (let r = 0; r < rows.length; r++) {
    const idx = rows[r].indexOf(lower);
    if (idx >= 0) {
      const row = rows[r];
      const newIdx = idx + shift;
      if (newIdx < 0 || newIdx >= row.length) return ch; // off edge, return unchanged
      const result = row[newIdx];
      return isUpper ? result.toUpperCase() : result;
    }
  }
  return ch; // not found on keyboard
}

/**
 * Convert a character typed on one layout to what it would produce on another.
 * Maps by physical key position.
 */
export function convertLayout(ch: string, from: KeyboardLayout, to: KeyboardLayout): string {
  if (from === to) return ch;
  const fromRows = getLayoutRows(from);
  const toRows = getLayoutRows(to);
  const isUpper = ch === ch.toUpperCase() && ch !== ch.toLowerCase();
  const lower = ch.toLowerCase();

  for (let r = 0; r < fromRows.length; r++) {
    const idx = fromRows[r].indexOf(lower);
    if (idx >= 0) {
      if (r < toRows.length && idx < toRows[r].length) {
        const result = toRows[r][idx];
        return isUpper ? result.toUpperCase() : result;
      }
      return ch;
    }
  }
  return ch; // not found
}
