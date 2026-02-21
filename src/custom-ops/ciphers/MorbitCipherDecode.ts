import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { MORSE_REVERSE } from '../_lib/morse';

const NAME = 'Morbit Cipher Decode';

const MORSE_PAIRS = ['..', '.-', '.x', '-.', '--', '-x', 'x.', 'x-', 'xx'];

function buildReversePairMap(numericKey: string): Record<string, string> {
  const digits = [...numericKey].filter((d) => d >= '1' && d <= '9');
  if (digits.length !== 9) {
    const map: Record<string, string> = {};
    for (let i = 0; i < 9; i++) map[String(i + 1)] = MORSE_PAIRS[i];
    return map;
  }

  const indexed = digits.map((d, i) => ({ d, i }));
  indexed.sort((a, b) => {
    if (a.d !== b.d) return a.d.localeCompare(b.d);
    return a.i - b.i;
  });

  const map: Record<string, string> = {};
  for (let i = 0; i < 9; i++) {
    map[digits[indexed[i].i]] = MORSE_PAIRS[i];
  }
  return map;
}

class MorbitCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes Morbit cipher by converting digits back to Morse pairs and then to text.';
    this.infoURL = 'https://www.dcode.fr/morbit-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Key (9 digits)', type: 'string', value: '319825764' },
    ];
  }

  run(input: string, args: any[]): string {
    const key = (args[0] as string) || '319825764';
    const reverseMap = buildReversePairMap(key);

    // Convert digits to Morse pairs
    const digitsOnly = input.replace(/[^1-9]/g, '');
    let morseStream = '';
    for (const d of digitsOnly) {
      morseStream += reverseMap[d] ?? '';
    }

    // Remove trailing x's
    morseStream = morseStream.replace(/x+$/, '');

    // Parse Morse: split on 'xx' for words, 'x' for letters
    const words = morseStream.split('xx');
    const decoded = words.map((word) => {
      return word.split('x').map((code) => MORSE_REVERSE[code] ?? '').join('');
    });
    return decoded.join(' ');
  }
}

registerCustomOp(MorbitCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Morbit cipher decode — digits to Morse pairs to text.',
  infoURL: 'https://www.dcode.fr/morbit-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Key (9 digits)', type: 'string', value: '319825764' }],
  flowControl: false,
}, 'Classical Ciphers');

export default MorbitCipherDecode;
