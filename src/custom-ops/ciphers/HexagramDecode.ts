import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { hexagramDecode } from '../_lib/hexagram';

const NAME = 'Hexagram Decode';

class HexagramDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decode I Ching hexagram symbols (U+4DC0-U+4DFF) back to original data. ' +
      'Each hexagram represents a 6-bit value.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Hexagram_(I_Ching)';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    if (!input) return '';
    const bytes = hexagramDecode(input);
    return new TextDecoder().decode(bytes);
  }
}

registerCustomOp(HexagramDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Hexagram decode — decode I Ching hexagram symbols back to data.',
  infoURL: 'https://en.wikipedia.org/wiki/Hexagram_(I_Ching)',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default HexagramDecode;
