import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { MORSE_TABLE } from '../_lib/morse';

const NAME = 'Morbit Cipher Encode';

/**
 * Morbit cipher: Morse pairs (.-, -., .., --, .x, -x, x., x-, xx) are assigned
 * to digits via a numeric key.
 */
const MORSE_PAIRS = ['..', '.-', '.x', '-.', '--', '-x', 'x.', 'x-', 'xx'];

function buildPairMap(numericKey: string): Record<string, string> {
  // The key provides the order for assigning pairs to digits 1-9
  // Parse key digits, use their sorted order to assign pairs
  const digits = [...numericKey].filter((d) => d >= '1' && d <= '9');
  if (digits.length !== 9) {
    // Default: use digits 1-9 in order
    const map: Record<string, string> = {};
    for (let i = 0; i < 9; i++) map[MORSE_PAIRS[i]] = String(i + 1);
    return map;
  }

  // Create indexed pairs sorted by key digit order
  const indexed = digits.map((d, i) => ({ d, i }));
  indexed.sort((a, b) => {
    if (a.d !== b.d) return a.d.localeCompare(b.d);
    return a.i - b.i;
  });

  const map: Record<string, string> = {};
  for (let i = 0; i < 9; i++) {
    map[MORSE_PAIRS[i]] = digits[indexed[i].i];
  }
  return map;
}

class MorbitCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Morbit cipher encodes text to Morse, groups into pairs of Morse symbols, and assigns each pair a digit based on a numeric key (digits 1-9).';
    this.infoURL = 'https://www.dcode.fr/morbit-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Key (9 digits)', type: 'string', value: '319825764' },
    ];
  }

  run(input: string, args: any[]): string {
    const key = (args[0] as string) || '319825764';
    const pairMap = buildPairMap(key);

    // Encode to Morse stream with 'x' separators
    const upper = input.toUpperCase();
    let morseStream = '';
    let firstLetter = true;
    for (const ch of upper) {
      if (ch === ' ') {
        morseStream += 'xx'; // word separator
        firstLetter = true;
      } else if (MORSE_TABLE[ch]) {
        if (!firstLetter) morseStream += 'x'; // letter separator
        morseStream += MORSE_TABLE[ch];
        firstLetter = false;
      }
    }

    // Pad to even length
    if (morseStream.length % 2 !== 0) morseStream += 'x';

    // Group by 2 and substitute
    let result = '';
    for (let i = 0; i < morseStream.length; i += 2) {
      const pair = morseStream.slice(i, i + 2);
      result += pairMap[pair] ?? '?';
    }
    return result;
  }
}

registerCustomOp(MorbitCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Morbit cipher encode — Morse pairs to digits via numeric key.',
  infoURL: 'https://www.dcode.fr/morbit-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Key (9 digits)', type: 'string', value: '319825764' }],
  flowControl: false,
}, 'Classical Ciphers');

export default MorbitCipherEncode;
