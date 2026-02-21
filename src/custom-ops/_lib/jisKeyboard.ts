/**
 * JIS Keyboard (Mikaka) — Japanese JIS layout mapping.
 * Maps QWERTY key positions to Japanese kana syllables.
 */

// JIS keyboard: QWERTY position → kana character
export const JIS_MAP: Record<string, string> = {
  // Number row
  '1': 'ぬ', '2': 'ふ', '3': 'あ', '4': 'う', '5': 'え',
  '6': 'お', '7': 'や', '8': 'ゆ', '9': 'よ', '0': 'わ',
  '-': 'ほ', '=': 'へ',
  // Top row (QWERTY positions)
  'Q': 'た', 'W': 'て', 'E': 'い', 'R': 'す', 'T': 'か',
  'Y': 'ん', 'U': 'な', 'I': 'に', 'O': 'ら', 'P': 'せ',
  '[': '゛', ']': '゜',
  // Home row
  'A': 'ち', 'S': 'と', 'D': 'し', 'F': 'は', 'G': 'き',
  'H': 'く', 'J': 'ま', 'K': 'の', 'L': 'り', ';': 'れ',
  "'": 'け',
  // Bottom row
  'Z': 'つ', 'X': 'さ', 'C': 'そ', 'V': 'ひ', 'B': 'こ',
  'N': 'み', 'M': 'も', ',': 'ね', '.': 'る', '/': 'め',
};

// Build reverse map: kana → QWERTY key
export const JIS_REVERSE: Record<string, string> = {};
for (const [key, kana] of Object.entries(JIS_MAP)) {
  JIS_REVERSE[kana] = key;
}
