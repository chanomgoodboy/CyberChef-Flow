import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { bubbleBabbleDecode } from '../_lib/bubbleBabble';

const NAME = 'Bubble Babble Decode';

class BubbleBabbleDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decode Bubble Babble pronounceable encoding back to original data. ' +
      'Parses "xAAAAA-BBBBB-...-xAAAAx" format with CVCVC syllable groups.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Bubble_Babble';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    if (!input || !input.trim()) return '';
    const bytes = bubbleBabbleDecode(input.trim());
    return new TextDecoder().decode(bytes);
  }
}

registerCustomOp(BubbleBabbleDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Bubble Babble decode — convert pronounceable SSH fingerprint format back to data.',
  infoURL: 'https://en.wikipedia.org/wiki/Bubble_Babble',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default BubbleBabbleDecode;
