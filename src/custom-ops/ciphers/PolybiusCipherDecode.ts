import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { generatePolybiusSquare, polybiusDecode } from '../_lib/polybius';

const NAME = 'Polybius Square Decode';

class PolybiusCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes text encoded with a 5x5 Polybius square. Expects pairs of row/column digits.';
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

    // Extract digit pairs
    const cleaned = sep ? input.split(sep).join('') : input;
    const digits = cleaned.replace(/[^1-5]/g, '');

    let result = '';
    for (let i = 0; i < digits.length - 1; i += 2) {
      const row = parseInt(digits[i]) - 1;
      const col = parseInt(digits[i + 1]) - 1;
      result += polybiusDecode(row, col, grid, 5);
    }
    return result;
  }
}

registerCustomOp(PolybiusCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Polybius square decode — row/column pairs back to letters.',
  infoURL: 'https://en.wikipedia.org/wiki/Polybius_square',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Keyword', type: 'string', value: '' },
    { name: 'Separator', type: 'string', value: ' ' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default PolybiusCipherDecode;
