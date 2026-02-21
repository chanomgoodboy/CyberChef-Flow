import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { leb128encodeString } from '../_lib/leb128';

const NAME = 'LEB128 Encode';

class LEB128Encode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encode integers using LEB128 (Little Endian Base 128) variable-length encoding. ' +
      'Each byte uses 7 data bits + 1 continuation bit. ' +
      'Used in DWARF debugging format and WebAssembly.';
    this.infoURL = 'https://en.wikipedia.org/wiki/LEB128';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Type',
        type: 'option',
        value: ['Unsigned', 'Signed'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    if (!input.trim()) return '';
    const signed = (args[0] as string) === 'Signed';
    return leb128encodeString(input, signed);
  }
}

registerCustomOp(LEB128Encode, {
  name: NAME,
  module: 'Custom',
  description: 'LEB128 encode — variable-length encoding for integers.',
  infoURL: 'https://en.wikipedia.org/wiki/LEB128',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Type', type: 'option', value: ['Unsigned', 'Signed'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default LEB128Encode;
