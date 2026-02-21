import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { generatePolybiusSquare, polybiusEncode } from '../_lib/polybius';
import { columnarEncrypt } from '../_lib/transposition';

const NAME = 'ADFGX Cipher Encode';
const HEADERS = 'ADFGX';

class ADFGXCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The ADFGX cipher combines a 5x5 Polybius square substitution with columnar transposition. Used by the German Army in WWI.';
    this.infoURL = 'https://en.wikipedia.org/wiki/ADFGVX_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Polybius Keyword', type: 'string', value: '' },
      { name: 'Transposition Key', type: 'string', value: 'CARGO' },
    ];
  }

  run(input: string, args: any[]): string {
    const polybiusKey = (args[0] as string) || '';
    const transKey = (args[1] as string) || 'CARGO';
    const grid = generatePolybiusSquare(polybiusKey, 5, true);

    // Step 1: Polybius substitution → ADFGX pairs
    let intermediate = '';
    for (const ch of input) {
      const coords = polybiusEncode(ch, grid, 5, true);
      if (coords) {
        intermediate += HEADERS[coords[0]] + HEADERS[coords[1]];
      }
    }

    // Step 2: Columnar transposition (no padding — irregular grid is standard)
    return columnarEncrypt(intermediate, transKey, '');
  }
}

registerCustomOp(ADFGXCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'ADFGX cipher encode — Polybius 5x5 + columnar transposition.',
  infoURL: 'https://en.wikipedia.org/wiki/ADFGVX_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Polybius Keyword', type: 'string', value: '' },
    { name: 'Transposition Key', type: 'string', value: 'CARGO' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default ADFGXCipherEncode;
