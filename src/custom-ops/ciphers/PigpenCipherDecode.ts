import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Pigpen Cipher Decode';

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

// Build reverse map
const DECODE_MAP = new Map<string, string>();
for (const [letter, symbol] of Object.entries(ENCODE_MAP)) {
  DECODE_MAP.set(symbol, letter);
}

class PigpenCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes text representation of Pigpen (Freemason) cipher symbols back to letters.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Pigpen_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, args: any[]): string {
    const tokens = input.split(/\s+/);
    let result = '';
    for (const token of tokens) {
      if (token === '/') {
        result += ' ';
      } else if (DECODE_MAP.has(token)) {
        result += DECODE_MAP.get(token)!;
      } else {
        result += token;
      }
    }
    return result;
  }
}

registerCustomOp(PigpenCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Pigpen (Freemason) cipher decode — symbol text representation to letters.',
  infoURL: 'https://en.wikipedia.org/wiki/Pigpen_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default PigpenCipherDecode;
