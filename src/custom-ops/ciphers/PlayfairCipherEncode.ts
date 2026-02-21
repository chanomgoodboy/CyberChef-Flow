import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { generatePolybiusSquare } from '../_lib/polybius';

const NAME = 'Playfair Cipher Encode';

class PlayfairCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The Playfair cipher encrypts pairs of letters (digraphs) using a 5x5 keyed grid. Same-row pairs shift right, same-column pairs shift down, rectangle pairs swap columns.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Playfair_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Keyword', type: 'string', value: 'PLAYFAIR' },
      { name: 'Padding letter', type: 'string', value: 'X' },
    ];
  }

  run(input: string, args: any[]): string {
    const keyword = (args[0] as string) || 'PLAYFAIR';
    const padChar = ((args[1] as string) || 'X').toUpperCase()[0] || 'X';
    const grid = generatePolybiusSquare(keyword, 5, true);

    // Prepare digraphs
    let text = input.toUpperCase().replace(/J/g, 'I').replace(/[^A-IK-Z]/g, '');
    const digraphs: [string, string][] = [];
    let i = 0;
    while (i < text.length) {
      const a = text[i];
      const b = i + 1 < text.length ? text[i + 1] : padChar;
      if (a === b) {
        digraphs.push([a, padChar]);
        i++;
      } else {
        digraphs.push([a, b]);
        i += 2;
      }
    }

    // Encrypt each digraph
    let result = '';
    for (const [a, b] of digraphs) {
      const posA = grid.indexOf(a);
      const posB = grid.indexOf(b);
      if (posA < 0 || posB < 0) continue;

      const rowA = Math.floor(posA / 5), colA = posA % 5;
      const rowB = Math.floor(posB / 5), colB = posB % 5;

      if (rowA === rowB) {
        // Same row: shift right
        result += grid[rowA * 5 + (colA + 1) % 5];
        result += grid[rowB * 5 + (colB + 1) % 5];
      } else if (colA === colB) {
        // Same column: shift down
        result += grid[((rowA + 1) % 5) * 5 + colA];
        result += grid[((rowB + 1) % 5) * 5 + colB];
      } else {
        // Rectangle: swap columns
        result += grid[rowA * 5 + colB];
        result += grid[rowB * 5 + colA];
      }
    }
    return result;
  }
}

registerCustomOp(PlayfairCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Playfair cipher encode — digraph encryption with a 5x5 keyed grid.',
  infoURL: 'https://en.wikipedia.org/wiki/Playfair_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Keyword', type: 'string', value: 'PLAYFAIR' },
    { name: 'Padding letter', type: 'string', value: 'X' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default PlayfairCipherEncode;
