import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Pigpen Cipher Encode';

// Text representation of Pigpen symbols using ASCII art notation.
// Grid 1 (no dot): A-I in tic-tac-toe grid
// X grid (no dot): J-M in X shapes
// Grid 2 (with dot): N-S (dotted tic-tac-toe)
// X grid (with dot): T-Z (dotted X)
const ENCODE_MAP: Record<string, string> = {
  A: '|_|', B: '|_', C: '_|',
  D: '|.|', E: '|.', F: '.|',
  G: '|^|', H: '|^', I: '^|',
  J: '>', K: '^', L: '<',
  M: '>.', N: '^.', O: '<.',
  P: '|_|.', Q: '|_.', R: '_|.',
  S: '|.|.', T: '|..', U: '.|.',
  V: '|^|.', W: '|^.', X: '^|.',
  Y: '>..',  Z: '^..',
};

class PigpenCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Encodes text using the Pigpen (Freemason) cipher. Outputs a text representation of the Pigpen symbols separated by spaces.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Pigpen_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, args: any[]): string {
    const result: string[] = [];
    for (const ch of input) {
      const upper = ch.toUpperCase();
      if (ENCODE_MAP[upper]) {
        result.push(ENCODE_MAP[upper]);
      } else if (ch === ' ') {
        result.push('/');
      } else {
        result.push(ch);
      }
    }
    return result.join(' ');
  }
}

registerCustomOp(PigpenCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Pigpen (Freemason) cipher encode — letters to symbol text representation.',
  infoURL: 'https://en.wikipedia.org/wiki/Pigpen_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default PigpenCipherEncode;
