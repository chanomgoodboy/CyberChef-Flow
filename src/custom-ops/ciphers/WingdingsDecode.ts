import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { wingdingsDecode } from '../_lib/wingdings';

const NAME = 'Wingdings Decode';

class WingdingsDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Convert Wingdings Unicode symbols back to ASCII text. ' +
      'Reverses the Wingdings character mapping.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Wingdings';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    if (!input) return '';
    return wingdingsDecode(input);
  }
}

registerCustomOp(WingdingsDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Wingdings decode — convert Wingdings Unicode symbols back to text.',
  infoURL: 'https://en.wikipedia.org/wiki/Wingdings',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default WingdingsDecode;
