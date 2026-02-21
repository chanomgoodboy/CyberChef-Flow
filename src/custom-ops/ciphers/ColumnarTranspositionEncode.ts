import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { columnarEncrypt } from '../_lib/transposition';

const NAME = 'Columnar Transposition Encode';

class ColumnarTranspositionEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Columnar transposition cipher: writes plaintext into rows of key-width, then reads columns in alphabetical key order.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Transposition_cipher#Columnar_transposition';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Key', type: 'string', value: 'ZEBRAS' },
      { name: 'Padding character', type: 'string', value: 'X' },
    ];
  }

  run(input: string, args: any[]): string {
    const key = (args[0] as string) || 'ZEBRAS';
    const pad = (args[1] as string) || 'X';
    return columnarEncrypt(input, key, pad);
  }
}

registerCustomOp(ColumnarTranspositionEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Columnar transposition encode — write rows, read columns in key order.',
  infoURL: 'https://en.wikipedia.org/wiki/Transposition_cipher#Columnar_transposition',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Key', type: 'string', value: 'ZEBRAS' },
    { name: 'Padding character', type: 'string', value: 'X' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default ColumnarTranspositionEncode;
