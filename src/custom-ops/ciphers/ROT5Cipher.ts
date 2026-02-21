import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'ROT5 Cipher';

class ROT5Cipher extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'ROT5 rotates digits 0-9 by 5 positions. Self-reciprocal: applying twice returns the original. ' +
      'Letters and other characters pass through unchanged.';
    this.infoURL = 'https://www.dcode.fr/rot5-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    let result = '';
    for (const ch of input) {
      const c = ch.charCodeAt(0);
      if (c >= 48 && c <= 57) {
        result += String.fromCharCode(((c - 48 + 5) % 10) + 48);
      } else {
        result += ch;
      }
    }
    return result;
  }
}

registerCustomOp(ROT5Cipher, {
  name: NAME,
  module: 'Custom',
  description: 'ROT5 — rotate digits 0-9 by 5. Self-reciprocal.',
  infoURL: 'https://www.dcode.fr/rot5-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default ROT5Cipher;
