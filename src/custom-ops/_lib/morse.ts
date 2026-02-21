/** International Morse code alphabet. */
export const MORSE_TABLE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
};

/** Reverse lookup: morse pattern → character. */
export const MORSE_REVERSE: Record<string, string> = {};
for (const [ch, code] of Object.entries(MORSE_TABLE)) {
  MORSE_REVERSE[code] = ch;
}

/**
 * Encode text to Morse code.
 * Letters separated by spaces, words by ' / '.
 * Non-encodable characters are dropped.
 */
export function morseEncode(text: string): string {
  const upper = text.toUpperCase();
  const parts: string[] = [];
  for (const ch of upper) {
    if (ch === ' ') {
      parts.push('/');
    } else if (MORSE_TABLE[ch]) {
      parts.push(MORSE_TABLE[ch]);
    }
  }
  return parts.join(' ');
}

/**
 * Decode Morse code to text.
 * Expects letters separated by spaces, words by ' / '.
 */
export function morseDecode(morse: string): string {
  return morse
    .split(' / ')
    .map((word) =>
      word
        .split(' ')
        .map((code) => MORSE_REVERSE[code] ?? '')
        .join('')
    )
    .join(' ');
}

/**
 * Encode text to a raw Morse string (just dots and dashes, using 'x' as letter separator
 * and 'xx' as word separator). Used by Fractionated Morse.
 */
export function morseEncodeRaw(text: string): string {
  const upper = text.toUpperCase();
  const words = upper.split(/\s+/).filter(Boolean);
  const encodedWords: string[] = [];
  for (const word of words) {
    const letters: string[] = [];
    for (const ch of word) {
      if (MORSE_TABLE[ch]) letters.push(MORSE_TABLE[ch]);
    }
    encodedWords.push(letters.join('x')); // x between letters
  }
  return encodedWords.join('xx'); // xx between words
}

/**
 * Decode a raw Morse string (dots, dashes, x separators) back to text.
 */
export function morseDecodeRaw(raw: string): string {
  return raw
    .split('xx')
    .map((word) =>
      word
        .split('x')
        .map((code) => MORSE_REVERSE[code] ?? '')
        .join('')
    )
    .join(' ');
}
