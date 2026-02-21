import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { PGP_EVEN_REVERSE, PGP_ODD_REVERSE, PGP_ALL_REVERSE } from '../_lib/pgpWords';

const NAME = 'PGP Word List Decode';

class PGPWordListDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts PGP biometric words back to hex bytes. Even-position words are 2-syllable, ' +
      'odd-position words are 3-syllable.';
    this.infoURL = 'https://en.wikipedia.org/wiki/PGP_word_list';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Output Format',
        type: 'option',
        value: ['Hex', 'Raw bytes'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const format = (args[0] as string) || 'Hex';
    const words = input.trim().split(/\s+/).filter(Boolean);

    const bytes: number[] = [];
    for (let i = 0; i < words.length; i++) {
      const w = words[i].toLowerCase();
      // Try position-aware lookup first
      let byte: number | undefined;
      if (i % 2 === 0) {
        byte = PGP_EVEN_REVERSE[w];
      } else {
        byte = PGP_ODD_REVERSE[w];
      }
      // Fall back to position-unaware
      if (byte === undefined) {
        const entry = PGP_ALL_REVERSE[w];
        if (entry) byte = entry.byte;
      }
      if (byte !== undefined) {
        bytes.push(byte);
      }
    }

    if (format === 'Hex') {
      return bytes.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    }
    return bytes.map((b) => String.fromCharCode(b)).join('');
  }
}

registerCustomOp(PGPWordListDecode, {
  name: NAME,
  module: 'Custom',
  description: 'PGP Word List decode — biometric words to hex bytes.',
  infoURL: 'https://en.wikipedia.org/wiki/PGP_word_list',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Output Format', type: 'option', value: ['Hex', 'Raw bytes'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default PGPWordListDecode;
