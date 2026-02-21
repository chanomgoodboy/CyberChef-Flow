import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'K6 Code Encode';

// British K6 phone booth dial layout (different from US)
// Dial positions 2-9, with letters grouped differently
const K6_MAP: Record<string, string> = {
  A: '2', B: '2', C: '2',
  D: '3', E: '3', F: '3',
  G: '4', H: '4', I: '4',
  J: '5', K: '5', L: '5',
  M: '6', N: '6', O: '6',
  P: '7', Q: '7', R: '7', S: '7',
  T: '8', U: '8', V: '8',
  W: '9', X: '9', Y: '9', Z: '9',
};

// Multi-tap: position within the key group
const K6_POS: Record<string, number> = {
  A: 1, B: 2, C: 3,
  D: 1, E: 2, F: 3,
  G: 1, H: 2, I: 3,
  J: 1, K: 2, L: 3,
  M: 1, N: 2, O: 3,
  P: 1, Q: 2, R: 3, S: 4,
  T: 1, U: 2, V: 3,
  W: 1, X: 2, Y: 3, Z: 4,
};

class K6CodeEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encodes letters using the British K6 phone booth dial layout. ' +
      'Each letter maps to a digit (its key) and position number.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Format', type: 'option', value: ['Key-Position (e.g. 2-1)', 'Multi-tap (e.g. 2)', 'Key only'] },
    ];
  }

  run(input: string, args: any[]): string {
    const format = (args[0] as string) || 'Key-Position (e.g. 2-1)';
    const parts: string[] = [];

    for (const ch of input) {
      const upper = ch.toUpperCase();
      if (K6_MAP[upper]) {
        if (format.startsWith('Key-Position')) {
          parts.push(`${K6_MAP[upper]}-${K6_POS[upper]}`);
        } else if (format.startsWith('Multi-tap')) {
          parts.push(K6_MAP[upper].repeat(K6_POS[upper]));
        } else {
          parts.push(K6_MAP[upper]);
        }
      } else if (ch === ' ') {
        parts.push('/');
      }
    }
    return parts.join(' ');
  }
}

registerCustomOp(K6CodeEncode, {
  name: NAME,
  module: 'Custom',
  description: 'K6 Code encode — British K6 phone dial layout encoding.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Format', type: 'option', value: ['Key-Position (e.g. 2-1)', 'Multi-tap (e.g. 2)', 'Key only'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default K6CodeEncode;
