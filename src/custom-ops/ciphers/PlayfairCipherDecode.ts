import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { generatePolybiusSquare } from '../_lib/polybius';
import { mod } from '../_lib/alphabet';

const NAME = 'Playfair Cipher Decode';

class PlayfairCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes text encrypted with the Playfair cipher. Same-row pairs shift left, same-column pairs shift up, rectangle pairs swap columns.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Playfair_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Keyword', type: 'string', value: 'PLAYFAIR' },
    ];
  }

  run(input: string, args: any[]): string {
    const keyword = (args[0] as string) || 'PLAYFAIR';
    const grid = generatePolybiusSquare(keyword, 5, true);

    const text = input.toUpperCase().replace(/J/g, 'I').replace(/[^A-IK-Z]/g, '');

    let result = '';
    for (let i = 0; i < text.length - 1; i += 2) {
      const a = text[i];
      const b = text[i + 1];
      const posA = grid.indexOf(a);
      const posB = grid.indexOf(b);
      if (posA < 0 || posB < 0) continue;

      const rowA = Math.floor(posA / 5), colA = posA % 5;
      const rowB = Math.floor(posB / 5), colB = posB % 5;

      if (rowA === rowB) {
        // Same row: shift left
        result += grid[rowA * 5 + mod(colA - 1, 5)];
        result += grid[rowB * 5 + mod(colB - 1, 5)];
      } else if (colA === colB) {
        // Same column: shift up
        result += grid[mod(rowA - 1, 5) * 5 + colA];
        result += grid[mod(rowB - 1, 5) * 5 + colB];
      } else {
        // Rectangle: swap columns
        result += grid[rowA * 5 + colB];
        result += grid[rowB * 5 + colA];
      }
    }
    return result;
  }
}

registerCustomOp(PlayfairCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Playfair cipher decode — reverse digraph decryption.',
  infoURL: 'https://en.wikipedia.org/wiki/Playfair_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Keyword', type: 'string', value: 'PLAYFAIR' }],
  flowControl: false,
}, 'Classical Ciphers');

export default PlayfairCipherDecode;
