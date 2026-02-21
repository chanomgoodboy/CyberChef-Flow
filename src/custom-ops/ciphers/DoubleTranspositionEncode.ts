import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { columnarEncrypt } from '../_lib/transposition';

const NAME = 'Double Transposition Encode';

class DoubleTranspositionEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Double transposition cipher applies columnar transposition twice with two different keys for stronger encryption.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Transposition_cipher#Double_transposition';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Key 1', type: 'string', value: 'FIRST' },
      { name: 'Key 2', type: 'string', value: 'SECOND' },
      { name: 'Padding character', type: 'string', value: 'X' },
    ];
  }

  run(input: string, args: any[]): string {
    const key1 = (args[0] as string) || 'FIRST';
    const key2 = (args[1] as string) || 'SECOND';
    const pad = (args[2] as string) || 'X';

    // First transposition
    const intermediate = columnarEncrypt(input, key1, pad);
    // Second transposition
    return columnarEncrypt(intermediate, key2, pad);
  }
}

registerCustomOp(DoubleTranspositionEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Double transposition encode — columnar transposition applied twice.',
  infoURL: 'https://en.wikipedia.org/wiki/Transposition_cipher#Double_transposition',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Key 1', type: 'string', value: 'FIRST' },
    { name: 'Key 2', type: 'string', value: 'SECOND' },
    { name: 'Padding character', type: 'string', value: 'X' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default DoubleTranspositionEncode;
