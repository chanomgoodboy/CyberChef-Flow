import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'ASCII Shift Cipher Encode';

class ASCIIShiftCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Shifts each character\'s ASCII code by N positions. Output is the shifted characters.';
    this.infoURL = 'https://www.dcode.fr/ascii-shift-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Shift', type: 'number', value: 1 },
    ];
  }

  run(input: string, args: any[]): string {
    const shift = (args[0] as number) ?? 1;
    let result = '';
    for (let i = 0; i < input.length; i++) {
      result += String.fromCharCode(input.charCodeAt(i) + shift);
    }
    return result;
  }
}

registerCustomOp(ASCIIShiftCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'ASCII shift cipher encode — shift each character\'s ASCII code by N.',
  infoURL: 'https://www.dcode.fr/ascii-shift-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Shift', type: 'number', value: 1 }],
  flowControl: false,
}, 'Classical Ciphers');

export default ASCIIShiftCipherEncode;
