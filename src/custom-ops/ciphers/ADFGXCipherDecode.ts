import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { generatePolybiusSquare, polybiusDecode } from '../_lib/polybius';
import { columnarDecrypt } from '../_lib/transposition';

const NAME = 'ADFGX Cipher Decode';
const HEADERS = 'ADFGX';

class ADFGXCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes text encrypted with the ADFGX cipher (5x5 Polybius + columnar transposition).';
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

    // Step 1: Reverse columnar transposition
    const cleaned = input.toUpperCase().replace(/[^ADFGX]/g, '');
    const intermediate = columnarDecrypt(cleaned, transKey);

    // Step 2: Reverse Polybius substitution
    let result = '';
    for (let i = 0; i < intermediate.length - 1; i += 2) {
      const row = HEADERS.indexOf(intermediate[i]);
      const col = HEADERS.indexOf(intermediate[i + 1]);
      if (row >= 0 && col >= 0) {
        result += polybiusDecode(row, col, grid, 5);
      }
    }
    return result;
  }
}

registerCustomOp(ADFGXCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'ADFGX cipher decode — reverse columnar + Polybius 5x5.',
  infoURL: 'https://en.wikipedia.org/wiki/ADFGVX_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Polybius Keyword', type: 'string', value: '' },
    { name: 'Transposition Key', type: 'string', value: 'CARGO' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default ADFGXCipherDecode;
