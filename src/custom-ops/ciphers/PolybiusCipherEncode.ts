import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { generatePolybiusSquare, polybiusEncode } from '../_lib/polybius';

const NAME = 'Polybius Square Encode';

class PolybiusCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Encodes text using a 5x5 Polybius square. Each letter is replaced by its row and column number. I and J share a cell.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Polybius_square';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Keyword', type: 'string', value: '' },
      { name: 'Separator', type: 'string', value: ' ' },
    ];
  }

  run(input: string, args: any[]): string {
    const keyword = (args[0] as string) || '';
    const sep = (args[1] as string) ?? ' ';
    const grid = generatePolybiusSquare(keyword, 5, true);
    const pairs: string[] = [];

    for (const ch of input) {
      const coords = polybiusEncode(ch, grid, 5, true);
      if (coords) {
        pairs.push(`${coords[0] + 1}${coords[1] + 1}`);
      } else if (/\s/.test(ch)) {
        pairs.push(ch);
      }
    }
    return pairs.join(sep);
  }
}

registerCustomOp(PolybiusCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Polybius square encode — each letter becomes its row/column pair.',
  infoURL: 'https://en.wikipedia.org/wiki/Polybius_square',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Keyword', type: 'string', value: '' },
    { name: 'Separator', type: 'string', value: ' ' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default PolybiusCipherEncode;
