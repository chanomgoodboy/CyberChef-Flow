import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { generatePolybiusSquare, polybiusEncode, polybiusDecode } from '../_lib/polybius';

const NAME = 'Nihilist Cipher Decode';

class NihilistCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes text encrypted with the Nihilist cipher by subtracting key Polybius coordinates.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Nihilist_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Polybius Keyword', type: 'string', value: '' },
      { name: 'Cipher Key', type: 'string', value: 'RUSSIAN' },
      { name: 'Separator', type: 'string', value: ' ' },
    ];
  }

  run(input: string, args: any[]): string {
    const polybiusKey = (args[0] as string) || '';
    const cipherKey = ((args[1] as string) || 'RUSSIAN').toUpperCase().replace(/[^A-Z]/g, '');
    const sep = (args[2] as string) ?? ' ';
    const grid = generatePolybiusSquare(polybiusKey, 5, true);

    // Convert cipher key to Polybius numbers
    const keyNums: number[] = [];
    for (const ch of cipherKey) {
      const coords = polybiusEncode(ch, grid, 5, true);
      if (coords) keyNums.push((coords[0] + 1) * 10 + (coords[1] + 1));
    }
    if (keyNums.length === 0) return input;

    // Parse numbers from input
    const numbers = input.trim().split(sep).filter(Boolean).map(Number);

    let result = '';
    for (let i = 0; i < numbers.length; i++) {
      const kNum = keyNums[i % keyNums.length];
      const pNum = numbers[i] - kNum;
      const row = Math.floor(pNum / 10) - 1;
      const col = (pNum % 10) - 1;
      if (row >= 0 && row < 5 && col >= 0 && col < 5) {
        result += polybiusDecode(row, col, grid, 5);
      }
    }
    return result;
  }
}

registerCustomOp(NihilistCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Nihilist cipher decode — subtract key coordinates from ciphertext numbers.',
  infoURL: 'https://en.wikipedia.org/wiki/Nihilist_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Polybius Keyword', type: 'string', value: '' },
    { name: 'Cipher Key', type: 'string', value: 'RUSSIAN' },
    { name: 'Separator', type: 'string', value: ' ' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default NihilistCipherDecode;
