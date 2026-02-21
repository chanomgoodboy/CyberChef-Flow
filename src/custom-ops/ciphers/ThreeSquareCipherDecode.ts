import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { generatePolybiusSquare, polybiusEncode, polybiusDecode } from '../_lib/polybius';

const NAME = 'Three-Square Cipher Decode';

class ThreeSquareCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes the Three-Square cipher by reversing the three-square pair lookup.';
    this.infoURL = 'https://www.dcode.fr/three-square-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Keyword 1 (top-left)', type: 'string', value: 'FIRST' },
      { name: 'Keyword 2 (bottom-right)', type: 'string', value: 'SECOND' },
      { name: 'Keyword 3 (top-right)', type: 'string', value: 'THIRD' },
    ];
  }

  run(input: string, args: any[]): string {
    const kw1 = (args[0] as string) || 'FIRST';
    const kw2 = (args[1] as string) || 'SECOND';
    const kw3 = (args[2] as string) || 'THIRD';
    const grid1 = generatePolybiusSquare(kw1, 5, true);
    const grid2 = generatePolybiusSquare(kw2, 5, true);
    const grid3 = generatePolybiusSquare(kw3, 5, true);

    const text = input.toUpperCase().replace(/J/g, 'I').replace(/[^A-IK-Z]/g, '');
    if (!text) return '';

    let padded = text;
    if (padded.length % 2 !== 0) padded += 'X';

    let result = '';
    for (let i = 0; i < padded.length; i += 2) {
      // Ciphertext pair comes from grid3
      const ct1 = polybiusEncode(padded[i], grid3, 5, true);
      const ct2 = polybiusEncode(padded[i + 1], grid3, 5, true);
      if (!ct1 || !ct2) continue;

      // Reverse: ct1 = (row from grid1, col from grid2)
      // ct2 = (row from grid2, col from grid1)
      // So: plaintext first letter has row=ct1[0] in grid1, col=ct2[1] in grid1
      // plaintext second letter has row=ct2[0] in grid2, col=ct1[1] in grid2
      result += polybiusDecode(ct1[0], ct2[1], grid1, 5);
      result += polybiusDecode(ct2[0], ct1[1], grid2, 5);
    }
    return result;
  }
}

registerCustomOp(ThreeSquareCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Three-Square cipher decode — reverse three-square pair lookup.',
  infoURL: 'https://www.dcode.fr/three-square-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Keyword 1 (top-left)', type: 'string', value: 'FIRST' },
    { name: 'Keyword 2 (bottom-right)', type: 'string', value: 'SECOND' },
    { name: 'Keyword 3 (top-right)', type: 'string', value: 'THIRD' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default ThreeSquareCipherDecode;
