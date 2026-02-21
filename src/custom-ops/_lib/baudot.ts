/**
 * Baudot / ITA2 5-bit teleprinter code encoding/decoding.
 * Reference: https://en.wikipedia.org/wiki/Baudot_code#ITA2
 *
 * ITA2 has two shift states: LTRS (Letters) and FIGS (Figures).
 * Each character is encoded as a 5-bit value.
 */

// ITA2 code tables
// Index = 5-bit code (0-31), value = character in that mode
const LTRS_TABLE: string[] = [
  '\0',  'E', '\n', 'A', ' ',  'S',  'I', 'U',
  '\r',  'D',  'R',  'J', 'N',  'F',  'C', 'K',
  'T',   'Z',  'L',  'W', 'H',  'Y',  'P', 'Q',
  'O',   'B',  'G',  '',  'M',  'X',  'V', '',
];

const FIGS_TABLE: string[] = [
  '\0',  '3', '\n', '-', ' ',  "'",  '8', '7',
  '\r',  '$',  '4',  '\x07', ',',  '!',  ':', '(',
  '5',   '"',  ')',  '2', '#',  '6',  '0', '1',
  '9',   '?',  '&',  '',  '.',  '/',  ';', '',
];

// Special codes
const NULL_CODE = 0b00000;   // 0
const SPACE_CODE = 0b00100;  // 4
const CR_CODE = 0b00010;     // 2 (actually position 8 = index 8, but in ITA2...)
const LF_CODE = 0b01000;     // 8
const LTRS_CODE = 0b11111;   // 31
const FIGS_CODE = 0b11011;   // 27

// Build reverse lookup: character → [code, shift]
// shift: 'L' = letters, 'F' = figures, 'B' = both
const CHAR_TO_CODE = new Map<string, { code: number; shift: 'L' | 'F' | 'B' }>();

(function init() {
  for (let i = 0; i < 32; i++) {
    const lc = LTRS_TABLE[i];
    const fc = FIGS_TABLE[i];
    if (i === LTRS_CODE || i === FIGS_CODE) continue; // skip shift codes
    if (lc && fc && lc === fc) {
      // Same in both modes (space, CR, LF, NULL)
      if (lc.trim() !== '' || lc === ' ') {
        CHAR_TO_CODE.set(lc, { code: i, shift: 'B' });
      } else if (lc === '\n') {
        CHAR_TO_CODE.set('\n', { code: i, shift: 'B' });
      } else if (lc === '\r') {
        CHAR_TO_CODE.set('\r', { code: i, shift: 'B' });
      }
    } else {
      if (lc && lc !== '' && !CHAR_TO_CODE.has(lc)) {
        CHAR_TO_CODE.set(lc, { code: i, shift: 'L' });
      }
      if (fc && fc !== '' && !CHAR_TO_CODE.has(fc)) {
        CHAR_TO_CODE.set(fc, { code: i, shift: 'F' });
      }
    }
  }
  // Ensure space is mapped
  CHAR_TO_CODE.set(' ', { code: SPACE_CODE, shift: 'B' });
  CHAR_TO_CODE.set('\n', { code: LF_CODE, shift: 'B' });
  CHAR_TO_CODE.set('\r', { code: CR_CODE, shift: 'B' });
})();

/**
 * Encode a string to Baudot/ITA2 5-bit binary groups.
 */
export function baudotEncode(input: string, format: string = 'Binary'): string {
  const codes: number[] = [];
  let currentShift: 'L' | 'F' = 'L';

  // Start with LTRS shift
  codes.push(LTRS_CODE);

  const upper = input.toUpperCase();
  for (const ch of upper) {
    const entry = CHAR_TO_CODE.get(ch);
    if (!entry) continue; // skip unknown characters

    const { code, shift } = entry;
    if (shift === 'B') {
      // Works in either mode
      codes.push(code);
    } else if (shift === 'L') {
      if (currentShift !== 'L') {
        codes.push(LTRS_CODE);
        currentShift = 'L';
      }
      codes.push(code);
    } else {
      if (currentShift !== 'F') {
        codes.push(FIGS_CODE);
        currentShift = 'F';
      }
      codes.push(code);
    }
  }

  if (format === 'Binary') {
    return codes.map(c => c.toString(2).padStart(5, '0')).join(' ');
  } else if (format === 'Decimal') {
    return codes.map(c => c.toString()).join(' ');
  } else {
    // Hex
    return codes.map(c => c.toString(16).padStart(2, '0').toUpperCase()).join(' ');
  }
}

/**
 * Decode Baudot/ITA2 5-bit codes back to text.
 */
export function baudotDecode(input: string, format: string = 'Binary'): string {
  const parts = input.trim().split(/\s+/);
  const codes: number[] = [];

  for (const p of parts) {
    if (!p) continue;
    if (format === 'Binary') {
      codes.push(parseInt(p, 2));
    } else if (format === 'Decimal') {
      codes.push(parseInt(p, 10));
    } else {
      codes.push(parseInt(p, 16));
    }
  }

  let result = '';
  let currentShift: 'L' | 'F' = 'L';

  for (const code of codes) {
    if (code < 0 || code > 31) continue;

    if (code === LTRS_CODE) {
      currentShift = 'L';
      continue;
    }
    if (code === FIGS_CODE) {
      currentShift = 'F';
      continue;
    }
    if (code === NULL_CODE) continue;

    const ch = currentShift === 'L' ? LTRS_TABLE[code] : FIGS_TABLE[code];
    if (ch !== undefined && ch !== '') {
      result += ch;
    }
  }

  return result;
}
