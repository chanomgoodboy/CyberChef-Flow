import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { columnarDecrypt } from '../_lib/transposition';

const NAME = 'Double Transposition Decode';

class DoubleTranspositionDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes double transposition cipher by reversing two columnar transpositions.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Transposition_cipher#Double_transposition';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Key 1', type: 'string', value: 'FIRST' },
      { name: 'Key 2', type: 'string', value: 'SECOND' },
    ];
  }

  run(input: string, args: any[]): string {
    const key1 = (args[0] as string) || 'FIRST';
    const key2 = (args[1] as string) || 'SECOND';

    // Reverse order: decrypt key2 first, then key1
    const intermediate = columnarDecrypt(input, key2);
    return columnarDecrypt(intermediate, key1);
  }
}

registerCustomOp(DoubleTranspositionDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Double transposition decode — reverse two columnar transpositions.',
  infoURL: 'https://en.wikipedia.org/wiki/Transposition_cipher#Double_transposition',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Key 1', type: 'string', value: 'FIRST' },
    { name: 'Key 2', type: 'string', value: 'SECOND' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default DoubleTranspositionDecode;
