import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { bubbleBabbleEncode } from '../_lib/bubbleBabble';

const NAME = 'Bubble Babble Encode';

class BubbleBabbleEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encode data using Bubble Babble, a method for representing binary data as pronounceable strings. ' +
      'Commonly used for SSH fingerprints. Produces "xAAAAA-BBBBB-...-xAAAAx" format with CVCVC syllable groups.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Bubble_Babble';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    if (!input) return 'xexax'; // empty input → checksum-only
    const bytes = new TextEncoder().encode(input);
    return bubbleBabbleEncode(bytes);
  }
}

registerCustomOp(BubbleBabbleEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Bubble Babble encode — convert data to pronounceable SSH fingerprint format.',
  infoURL: 'https://en.wikipedia.org/wiki/Bubble_Babble',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default BubbleBabbleEncode;
