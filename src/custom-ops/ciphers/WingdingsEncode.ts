import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { wingdingsEncode } from '../_lib/wingdings';

const NAME = 'Wingdings Encode';

class WingdingsEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Convert ASCII text to Wingdings font symbols using Unicode equivalents. ' +
      'Each printable ASCII character maps to a decorative symbol.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Wingdings';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    if (!input) return '';
    return wingdingsEncode(input);
  }
}

registerCustomOp(WingdingsEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Wingdings encode — convert text to Wingdings Unicode symbols.',
  infoURL: 'https://en.wikipedia.org/wiki/Wingdings',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default WingdingsEncode;
