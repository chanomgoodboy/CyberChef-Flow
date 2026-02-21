import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Base37 Decode';
const B37 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ ';

class Base37Decode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes a decimal number back to text via base-37 (0-9, A-Z, space). ' +
      'The decimal value is converted to its base-37 representation to recover the original text.';
    this.infoURL = 'https://www.dcode.fr/base-37-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string): string {
    const trimmed = input.trim();
    try {
      let n = BigInt(trimmed);
      if (n < 0n) return '?';
      if (n === 0n) return '0';
      let result = '';
      while (n > 0n) {
        result = B37[Number(n % 37n)] + result;
        n = n / 37n;
      }
      return result;
    } catch {
      return '?';
    }
  }
}

registerCustomOp(Base37Decode, {
  name: NAME,
  module: 'Custom',
  description: 'Base37 decode — decimal to text (0-9A-Z + space cipher).',
  infoURL: 'https://www.dcode.fr/base-37-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default Base37Decode;
