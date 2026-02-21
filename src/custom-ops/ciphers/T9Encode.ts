import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'T9 Encode';

// T9: each letter maps to one digit (unlike multi-tap which uses repeated digits)
const T9_MAP: Record<string, string> = {
  A: '2', B: '2', C: '2',
  D: '3', E: '3', F: '3',
  G: '4', H: '4', I: '4',
  J: '5', K: '5', L: '5',
  M: '6', N: '6', O: '6',
  P: '7', Q: '7', R: '7', S: '7',
  T: '8', U: '8', V: '8',
  W: '9', X: '9', Y: '9', Z: '9',
  ' ': '0',
};

class T9Encode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encodes text using T9 predictive text input. Each letter maps to a single ' +
      'phone key digit: ABC=2, DEF=3, GHI=4, JKL=5, MNO=6, PQRS=7, TUV=8, WXYZ=9, space=0.';
    this.infoURL = 'https://www.dcode.fr/t9-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Separator',
        type: 'option',
        value: ['None', 'Space', 'Dash'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const sepName = (args[0] as string) || 'None';
    const sep = sepName === 'Space' ? ' ' : sepName === 'Dash' ? '-' : '';

    const parts: string[] = [];
    for (const ch of input) {
      const upper = ch.toUpperCase();
      const digit = T9_MAP[upper];
      if (digit) {
        parts.push(digit);
      }
    }
    return parts.join(sep);
  }
}

registerCustomOp(T9Encode, {
  name: NAME,
  module: 'Custom',
  description: 'T9 encode — letters to phone key digits (predictive text).',
  infoURL: 'https://www.dcode.fr/t9-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Separator', type: 'option', value: ['None', 'Space', 'Dash'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default T9Encode;
