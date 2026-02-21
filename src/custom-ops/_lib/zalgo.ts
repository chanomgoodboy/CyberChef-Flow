/**
 * Zalgo text generation/cleaning.
 * Reference: https://en.wikipedia.org/wiki/Zalgo_text
 *
 * Zalgo text adds combining diacritical marks above, middle, and below
 * base characters to create the "corrupted text" effect.
 */

// Combining marks above (U+0300-U+036F range)
const MARKS_ABOVE = [
  0x030D, 0x030E, 0x0304, 0x0305, 0x033F, 0x0311, 0x0306, 0x0310,
  0x0352, 0x0357, 0x0351, 0x0307, 0x0308, 0x030A, 0x0342, 0x0343,
  0x0344, 0x034A, 0x034B, 0x034C, 0x0303, 0x0302, 0x030C, 0x0350,
  0x0300, 0x0301, 0x030B, 0x030F, 0x0312, 0x0313, 0x0314, 0x033D,
  0x0309, 0x0363, 0x0364, 0x0365, 0x0366, 0x0367, 0x0368, 0x0369,
  0x036A, 0x036B, 0x036C, 0x036D, 0x036E, 0x036F, 0x033E, 0x035B,
];

// Combining marks middle (overlay)
const MARKS_MIDDLE = [
  0x0315, 0x031B, 0x0340, 0x0341, 0x0358, 0x0321, 0x0322, 0x0327,
  0x0328, 0x0334, 0x0335, 0x0336, 0x034F, 0x035C, 0x035D, 0x035E,
  0x035F, 0x0360, 0x0362, 0x0338, 0x0337,
];

// Combining marks below
const MARKS_BELOW = [
  0x0316, 0x0317, 0x0318, 0x0319, 0x031C, 0x031D, 0x031E, 0x031F,
  0x0320, 0x0324, 0x0325, 0x0326, 0x0329, 0x032A, 0x032B, 0x032C,
  0x032D, 0x032E, 0x032F, 0x0330, 0x0331, 0x0332, 0x0333, 0x0339,
  0x033A, 0x033B, 0x033C, 0x0345, 0x0347, 0x0348, 0x0349, 0x034D,
  0x034E, 0x0353, 0x0354, 0x0355, 0x0356, 0x0359, 0x035A, 0x0323,
];

function randomPick(arr: number[]): number {
  return arr[Math.floor(Math.random() * arr.length)];
}

export type ZalgoIntensity = 'mini' | 'normal' | 'max';

/**
 * Add Zalgo combining marks to text.
 */
export function zalgoEncode(input: string, intensity: ZalgoIntensity = 'normal'): string {
  const [minMarks, maxMarks] = intensity === 'mini' ? [1, 3]
    : intensity === 'max' ? [8, 20]
    : [3, 8]; // normal

  let result = '';
  for (const ch of input) {
    result += ch;
    // Skip if already a combining mark
    const cp = ch.codePointAt(0)!;
    if (cp >= 0x0300 && cp <= 0x036F) continue;
    if (cp >= 0x1AB0 && cp <= 0x1AFF) continue;
    if (cp >= 0x1DC0 && cp <= 0x1DFF) continue;
    if (cp >= 0x20D0 && cp <= 0x20FF) continue;
    if (cp >= 0xFE20 && cp <= 0xFE2F) continue;
    // Skip whitespace/newlines
    if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') continue;

    const numAbove = Math.floor(Math.random() * (maxMarks - minMarks + 1)) + minMarks;
    const numMiddle = Math.floor(Math.random() * Math.ceil(maxMarks / 2));
    const numBelow = Math.floor(Math.random() * (maxMarks - minMarks + 1)) + minMarks;

    for (let i = 0; i < numAbove; i++) result += String.fromCodePoint(randomPick(MARKS_ABOVE));
    for (let i = 0; i < numMiddle; i++) result += String.fromCodePoint(randomPick(MARKS_MIDDLE));
    for (let i = 0; i < numBelow; i++) result += String.fromCodePoint(randomPick(MARKS_BELOW));
  }

  return result;
}

/**
 * Remove Zalgo combining marks from text.
 */
export function zalgoDecode(input: string): string {
  // Remove all combining diacritical marks
  // This covers the main Unicode combining mark ranges
  return input.replace(/[\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/g, '');
}
