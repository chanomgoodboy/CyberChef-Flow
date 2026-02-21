import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'T9 Decode';

// T9 reverse: digit → possible letters
const T9_REVERSE: Record<string, string> = {
  '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL',
  '6': 'MNO', '7': 'PQRS', '8': 'TUV', '9': 'WXYZ',
  '0': ' ',
};

class T9Decode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes T9 digit sequences back to possible letters. ' +
      'Ambiguous: 2=A/B/C, 3=D/E/F, etc. Shows first letter by default.';
    this.infoURL = 'https://www.dcode.fr/t9-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Variant',
        type: 'option',
        value: ['First letter', 'All possibilities'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const variant = (args[0] as string) || 'First letter';
    const showAll = variant === 'All possibilities';

    const digits = input.replace(/[\s\-]+/g, '');
    let result = '';
    for (const d of digits) {
      const letters = T9_REVERSE[d];
      if (letters) {
        if (showAll) {
          result += `[${letters}]`;
        } else {
          result += letters[0];
        }
      } else {
        result += d;
      }
    }
    return result;
  }
}

registerCustomOp(T9Decode, {
  name: NAME,
  module: 'Custom',
  description: 'T9 decode — phone key digits to letters (predictive text).',
  infoURL: 'https://www.dcode.fr/t9-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Variant', type: 'option', value: ['First letter', 'All possibilities'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default T9Decode;
