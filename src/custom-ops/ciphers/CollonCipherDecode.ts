import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { generatePolybiusSquare, polybiusEncode, polybiusDecode } from '../_lib/polybius';

const NAME = 'Collon Cipher Decode';

class CollonCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes the Collon cipher by reversing the column-first Polybius recombination.';
    this.infoURL = 'https://www.dcode.fr/collon-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Keyword', type: 'string', value: 'CIPHER' },
      { name: 'Group size', type: 'number', value: 5 },
    ];
  }

  run(input: string, args: any[]): string {
    const keyword = (args[0] as string) || 'CIPHER';
    const groupSize = Math.max(1, (args[1] as number) || 5);
    const grid = generatePolybiusSquare(keyword, 5, true);

    const text = input.toUpperCase().replace(/J/g, 'I').replace(/[^A-IK-Z]/g, '');
    if (!text) return '';

    const coords: [number, number][] = [];
    for (const ch of text) {
      const c = polybiusEncode(ch, grid, 5, true);
      if (c) coords.push(c);
    }

    let result = '';
    for (let g = 0; g < coords.length; g += groupSize) {
      const group = coords.slice(g, g + groupSize);
      const n = group.length;

      // Flatten: each encoded char gives (row, col)
      const flat: number[] = [];
      for (const [r, c] of group) {
        flat.push(r, c);
      }

      // Reverse: first n values are columns, next n are rows
      const cols = flat.slice(0, n);
      const rows = flat.slice(n, 2 * n);

      for (let i = 0; i < n; i++) {
        result += polybiusDecode(rows[i], cols[i], grid, 5);
      }
    }
    return result;
  }
}

registerCustomOp(CollonCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Collon cipher decode — reverse column-first Polybius recombination.',
  infoURL: 'https://www.dcode.fr/collon-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Keyword', type: 'string', value: 'CIPHER' },
    { name: 'Group size', type: 'number', value: 5 },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default CollonCipherDecode;
