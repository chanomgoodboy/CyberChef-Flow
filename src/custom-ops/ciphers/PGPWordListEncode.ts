import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { PGP_EVEN, PGP_ODD } from '../_lib/pgpWords';

const NAME = 'PGP Word List Encode';

class PGPWordListEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts hex bytes to PGP biometric words. Even-position bytes use 2-syllable words, ' +
      'odd-position bytes use 3-syllable words.';
    this.infoURL = 'https://en.wikipedia.org/wiki/PGP_word_list';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Input Format',
        type: 'option',
        value: ['Hex', 'Raw bytes'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const format = (args[0] as string) || 'Hex';
    let bytes: number[];

    if (format === 'Hex') {
      const clean = input.replace(/0x/gi, '').replace(/[\s:,]+/g, '');
      if (!/^[0-9A-Fa-f]*$/.test(clean) || clean.length % 2 !== 0) {
        return 'Error: Invalid hex input';
      }
      bytes = [];
      for (let i = 0; i < clean.length; i += 2) {
        bytes.push(parseInt(clean.slice(i, i + 2), 16));
      }
    } else {
      bytes = [];
      for (let i = 0; i < input.length; i++) {
        bytes.push(input.charCodeAt(i) & 0xFF);
      }
    }

    const words: string[] = [];
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if (b < 0 || b > 255) continue;
      words.push(i % 2 === 0 ? PGP_EVEN[b] : PGP_ODD[b]);
    }

    return words.join(' ');
  }
}

registerCustomOp(PGPWordListEncode, {
  name: NAME,
  module: 'Custom',
  description: 'PGP Word List encode — hex bytes to biometric words.',
  infoURL: 'https://en.wikipedia.org/wiki/PGP_word_list',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Input Format', type: 'option', value: ['Hex', 'Raw bytes'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default PGPWordListEncode;
