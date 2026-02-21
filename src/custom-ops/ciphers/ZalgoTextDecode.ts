import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { zalgoDecode } from '../_lib/zalgo';

const NAME = 'Zalgo Text Decode';

class ZalgoTextDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Remove Zalgo combining diacritical marks from text, restoring the clean original. ' +
      'Strips all combining marks from the Unicode Combining Diacritical Marks block.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Zalgo_text';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    if (!input) return '';
    return zalgoDecode(input);
  }
}

registerCustomOp(ZalgoTextDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Zalgo text clean — remove combining marks to restore original text.',
  infoURL: 'https://en.wikipedia.org/wiki/Zalgo_text',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default ZalgoTextDecode;
