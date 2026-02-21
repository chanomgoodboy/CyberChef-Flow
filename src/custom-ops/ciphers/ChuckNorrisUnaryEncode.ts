import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { chuckNorrisEncode } from '../_lib/chuckNorris';

const NAME = 'Chuck Norris Unary Encode';

class ChuckNorrisUnaryEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encode text using Chuck Norris unary encoding. Each character is converted to 7-bit binary, ' +
      'then runs of identical bits are encoded as groups: "00" prefix for 1-bits, "0" prefix for 0-bits, ' +
      'followed by 0s for the run length.';
    this.infoURL = 'https://www.dcode.fr/chuck-norris-unary';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    if (!input) return '';
    return chuckNorrisEncode(input);
  }
}

registerCustomOp(ChuckNorrisUnaryEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Chuck Norris unary encode — represent binary as groups of 0s.',
  infoURL: 'https://www.dcode.fr/chuck-norris-unary',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default ChuckNorrisUnaryEncode;
