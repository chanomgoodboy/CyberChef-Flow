import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { generatePolybiusSquare, polybiusEncode, polybiusDecode } from '../_lib/polybius';

const NAME = 'Two-Square Cipher Encode';

class TwoSquareCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The Two-Square cipher (horizontal variant) uses two keyed 5x5 Polybius squares side by side. Encrypts digraphs by swapping columns between the two squares.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Two-square_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Keyword 1 (left)', type: 'string', value: 'EXAMPLE' },
      { name: 'Keyword 2 (right)', type: 'string', value: 'KEYWORD' },
    ];
  }

  run(input: string, args: any[]): string {
    const kw1 = (args[0] as string) || 'EXAMPLE';
    const kw2 = (args[1] as string) || 'KEYWORD';

    const grid1 = generatePolybiusSquare(kw1, 5, true);
    const grid2 = generatePolybiusSquare(kw2, 5, true);

    const letters = input.toUpperCase().replace(/J/g, 'I').replace(/[^A-IK-Z]/g, '');
    const padded = letters.length % 2 === 1 ? letters + 'X' : letters;

    let result = '';
    for (let i = 0; i < padded.length; i += 2) {
      const c1 = polybiusEncode(padded[i], grid1, 5, true);
      const c2 = polybiusEncode(padded[i + 1], grid2, 5, true);
      if (!c1 || !c2) continue;

      if (c1[0] === c2[0]) {
        // Same row: output unchanged
        result += polybiusDecode(c1[0], c1[1], grid1, 5);
        result += polybiusDecode(c2[0], c2[1], grid2, 5);
      } else {
        // Different rows: swap rows
        result += polybiusDecode(c2[0], c1[1], grid1, 5);
        result += polybiusDecode(c1[0], c2[1], grid2, 5);
      }
    }
    return result;
  }
}

registerCustomOp(TwoSquareCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Two-Square cipher encode — horizontal digraph encryption with 2 keyed squares.',
  infoURL: 'https://en.wikipedia.org/wiki/Two-square_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Keyword 1 (left)', type: 'string', value: 'EXAMPLE' },
    { name: 'Keyword 2 (right)', type: 'string', value: 'KEYWORD' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default TwoSquareCipherEncode;
