import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { generatePolybiusSquare, polybiusEncode } from '../_lib/polybius';
import { columnarEncrypt } from '../_lib/transposition';

const NAME = 'ADFGVX Cipher Encode';
const HEADERS = 'ADFGVX';

class ADFGVXCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The ADFGVX cipher extends ADFGX to a 6x6 grid including digits 0-9. Used by the German Army in WWI.';
    this.infoURL = 'https://en.wikipedia.org/wiki/ADFGVX_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Polybius Keyword', type: 'string', value: '' },
      { name: 'Transposition Key', type: 'string', value: 'PRIVACY' },
    ];
  }

  run(input: string, args: any[]): string {
    const polybiusKey = (args[0] as string) || '';
    const transKey = (args[1] as string) || 'PRIVACY';
    const grid = generatePolybiusSquare(polybiusKey, 6, false);

    // Step 1: Polybius substitution → ADFGVX pairs
    let intermediate = '';
    for (const ch of input) {
      const coords = polybiusEncode(ch, grid, 6, false);
      if (coords) {
        intermediate += HEADERS[coords[0]] + HEADERS[coords[1]];
      }
    }

    // Step 2: Columnar transposition (no padding — irregular grid is standard)
    return columnarEncrypt(intermediate, transKey, '');
  }
}

registerCustomOp(ADFGVXCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'ADFGVX cipher encode — Polybius 6x6 + columnar transposition.',
  infoURL: 'https://en.wikipedia.org/wiki/ADFGVX_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Polybius Keyword', type: 'string', value: '' },
    { name: 'Transposition Key', type: 'string', value: 'PRIVACY' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default ADFGVXCipherEncode;
