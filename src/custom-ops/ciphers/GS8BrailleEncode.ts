import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'GS8 Braille Encode';

class GS8BrailleEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encodes bytes as 8-dot Braille characters (U+2800-U+28FF). ' +
      'Each byte maps directly to a Braille pattern, supporting the full 0-255 range.';
    this.infoURL = 'https://www.dcode.fr/braille-alphabet';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    let result = '';
    for (let i = 0; i < input.length; i++) {
      const b = input.charCodeAt(i) & 0xFF;
      result += String.fromCodePoint(0x2800 + b);
    }
    return result;
  }
}

registerCustomOp(GS8BrailleEncode, {
  name: NAME,
  module: 'Custom',
  description: 'GS8 Braille (8-dot) encode — bytes to Braille characters.',
  infoURL: 'https://www.dcode.fr/braille-alphabet',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default GS8BrailleEncode;
