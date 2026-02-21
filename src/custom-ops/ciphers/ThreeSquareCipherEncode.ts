import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { generatePolybiusSquare, polybiusEncode, polybiusDecode } from '../_lib/polybius';

const NAME = 'Three-Square Cipher Encode';

class ThreeSquareCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The Three-Square cipher uses three keyed 5x5 Polybius squares. Input is processed in pairs. The first letter\'s row in square 1 and second letter\'s column in square 2 select a character from square 3.';
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
      const c1 = polybiusEncode(padded[i], grid1, 5, true);
      const c2 = polybiusEncode(padded[i + 1], grid2, 5, true);
      if (!c1 || !c2) continue;

      // Output: (row of first letter in grid1, col of second letter in grid2) → grid3
      // Plus: (row of second letter in grid2, col of first letter in grid1) → grid3
      result += polybiusDecode(c1[0], c2[1], grid3, 5);
      result += polybiusDecode(c2[0], c1[1], grid3, 5);
    }
    return result;
  }
}

registerCustomOp(ThreeSquareCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Three-Square cipher encode — three keyed 5x5 squares, pair encryption.',
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

export default ThreeSquareCipherEncode;
