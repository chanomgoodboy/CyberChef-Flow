import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { chuckNorrisDecode } from '../_lib/chuckNorris';

const NAME = 'Chuck Norris Unary Decode';

class ChuckNorrisUnaryDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decode Chuck Norris unary encoding back to text. Parses groups of 0s: ' +
      '"00" prefix indicates 1-bits, "0" prefix indicates 0-bits.';
    this.infoURL = 'https://www.dcode.fr/chuck-norris-unary';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    if (!input.trim()) return '';
    return chuckNorrisDecode(input);
  }
}

registerCustomOp(ChuckNorrisUnaryDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Chuck Norris unary decode — convert groups of 0s back to text.',
  infoURL: 'https://www.dcode.fr/chuck-norris-unary',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default ChuckNorrisUnaryDecode;
