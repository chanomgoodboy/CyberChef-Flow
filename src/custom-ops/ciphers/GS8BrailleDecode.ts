import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'GS8 Braille Decode';

class GS8BrailleDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes 8-dot Braille characters (U+2800-U+28FF) back to bytes.';
    this.infoURL = 'https://www.dcode.fr/braille-alphabet';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    let result = '';
    for (const ch of input) {
      const cp = ch.codePointAt(0)!;
      if (cp >= 0x2800 && cp <= 0x28FF) {
        result += String.fromCharCode(cp - 0x2800);
      }
    }
    return result;
  }
}

registerCustomOp(GS8BrailleDecode, {
  name: NAME,
  module: 'Custom',
  description: 'GS8 Braille (8-dot) decode — Braille characters to bytes.',
  infoURL: 'https://www.dcode.fr/braille-alphabet',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default GS8BrailleDecode;
