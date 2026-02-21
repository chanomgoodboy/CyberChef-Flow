import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Unicode Shift Encode';

class UnicodeShiftEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Shifts all Unicode code points by N. Each character\'s code point is increased by the shift value.';
    this.infoURL = 'https://www.dcode.fr/unicode-shift-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Shift',
        type: 'number',
        value: 1,
      },
    ];
  }

  run(input: string, args: any[]): string {
    const shift = (args[0] as number) ?? 1;
    let result = '';
    for (const ch of input) {
      const cp = ch.codePointAt(0)!;
      const newCp = cp + shift;
      if (newCp > 0 && newCp <= 0x10FFFF) {
        result += String.fromCodePoint(newCp);
      } else {
        result += ch;
      }
    }
    return result;
  }
}

registerCustomOp(UnicodeShiftEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Unicode Shift encode — shift all code points by N.',
  infoURL: 'https://www.dcode.fr/unicode-shift-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Shift', type: 'number', value: 1 }],
  flowControl: false,
}, 'Classical Ciphers');

export default UnicodeShiftEncode;
