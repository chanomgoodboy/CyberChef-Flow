import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { leb128decodeString } from '../_lib/leb128';

const NAME = 'LEB128 Decode';

class LEB128Decode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decode LEB128 (Little Endian Base 128) encoded hex bytes back to integers. ' +
      'Input should be space-separated hex bytes.';
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
    return leb128decodeString(input, signed);
  }
}

registerCustomOp(LEB128Decode, {
  name: NAME,
  module: 'Custom',
  description: 'LEB128 decode — convert variable-length encoded bytes back to integers.',
  infoURL: 'https://en.wikipedia.org/wiki/LEB128',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Type', type: 'option', value: ['Unsigned', 'Signed'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default LEB128Decode;
