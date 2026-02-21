import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { hexagramEncode } from '../_lib/hexagram';

const NAME = 'Hexagram Encode';

class HexagramEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encode data using I Ching hexagram symbols (U+4DC0-U+4DFF). ' +
      'Each hexagram represents a 6-bit value, packing binary data into 64 unique symbols.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Hexagram_(I_Ching)';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    if (!input) return '';
    const bytes = new TextEncoder().encode(input);
    return hexagramEncode(bytes);
  }
}

registerCustomOp(HexagramEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Hexagram encode — encode data as I Ching hexagram symbols.',
  infoURL: 'https://en.wikipedia.org/wiki/Hexagram_(I_Ching)',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default HexagramEncode;
