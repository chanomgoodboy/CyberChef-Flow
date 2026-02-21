import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'ROT18 Cipher';

class ROT18Cipher extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'ROT18 applies ROT13 to letters and ROT5 to digits simultaneously. ' +
      'Self-reciprocal: applying twice returns the original.';
    this.infoURL = 'https://www.dcode.fr/rot-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    let result = '';
    for (const ch of input) {
      const c = ch.charCodeAt(0);
      if (c >= 65 && c <= 90) {
        result += String.fromCharCode(((c - 65 + 13) % 26) + 65);
      } else if (c >= 97 && c <= 122) {
        result += String.fromCharCode(((c - 97 + 13) % 26) + 97);
      } else if (c >= 48 && c <= 57) {
        result += String.fromCharCode(((c - 48 + 5) % 10) + 48);
      } else {
        result += ch;
      }
    }
    return result;
  }
}

registerCustomOp(ROT18Cipher, {
  name: NAME,
  module: 'Custom',
  description: 'ROT18 — ROT13 on letters + ROT5 on digits. Self-reciprocal.',
  infoURL: 'https://www.dcode.fr/rot-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default ROT18Cipher;
