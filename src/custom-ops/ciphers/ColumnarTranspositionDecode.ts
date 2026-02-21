import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { columnarDecrypt } from '../_lib/transposition';

const NAME = 'Columnar Transposition Decode';

class ColumnarTranspositionDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes text encrypted with columnar transposition by reversing the column read-off.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Transposition_cipher#Columnar_transposition';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Key', type: 'string', value: 'ZEBRAS' },
    ];
  }

  run(input: string, args: any[]): string {
    const key = (args[0] as string) || 'ZEBRAS';
    return columnarDecrypt(input, key);
  }
}

registerCustomOp(ColumnarTranspositionDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Columnar transposition decode — reverse column read-off.',
  infoURL: 'https://en.wikipedia.org/wiki/Transposition_cipher#Columnar_transposition',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Key', type: 'string', value: 'ZEBRAS' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default ColumnarTranspositionDecode;
