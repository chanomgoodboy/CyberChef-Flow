import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'ALT Codes Decode';

class ALTCodesDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts Windows ALT codes (decimal numbers or ALT+NNN) back to characters.';
    this.infoURL = 'https://www.dcode.fr/alt-codes';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    // Match ALT+NNN or plain numbers
    const tokens = input.split(/[\s,]+/).filter(Boolean);
    let result = '';
    for (const tok of tokens) {
      const clean = tok.replace(/^ALT\+/i, '');
      const n = parseInt(clean, 10);
      if (!isNaN(n) && n >= 0 && n <= 0x10FFFF) {
        result += String.fromCodePoint(n);
      } else {
        result += tok;
      }
    }
    return result;
  }
}

registerCustomOp(ALTCodesDecode, {
  name: NAME,
  module: 'Custom',
  description: 'ALT Codes decode — decimal codes / ALT+NNN to characters.',
  infoURL: 'https://www.dcode.fr/alt-codes',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default ALTCodesDecode;
