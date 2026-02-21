import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Base37 Encode';
const B37 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ ';

class Base37Encode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encodes text as a single base-37 number (0-9, A-Z, space). ' +
      'The entire text (including spaces) is treated as a base-37 number ' +
      'and output as its decimal value.';
    this.infoURL = 'https://www.dcode.fr/base-37-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string): string {
    const upper = input.toUpperCase();
    let val = 0n;
    for (const ch of upper) {
      const idx = B37.indexOf(ch);
      if (idx < 0) continue; // skip unmapped chars
      val = val * 37n + BigInt(idx);
    }
    return val.toString();
  }
}

registerCustomOp(Base37Encode, {
  name: NAME,
  module: 'Custom',
  description: 'Base37 encode — text to decimal (0-9A-Z + space cipher).',
  infoURL: 'https://www.dcode.fr/base-37-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default Base37Encode;
