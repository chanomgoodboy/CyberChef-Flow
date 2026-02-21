import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { generatePolybiusSquare, polybiusEncode } from '../_lib/polybius';

const NAME = 'Nihilist Cipher Encode';

class NihilistCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The Nihilist cipher extends the Polybius square by adding the Polybius coordinates of a key to the coordinates of the plaintext. Used by Russian Nihilists in the 1880s.';
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

    const results: string[] = [];
    let keyPos = 0;
    for (const ch of input) {
      const coords = polybiusEncode(ch, grid, 5, true);
      if (coords) {
        const pNum = (coords[0] + 1) * 10 + (coords[1] + 1);
        const kNum = keyNums[keyPos % keyNums.length];
        results.push(String(pNum + kNum));
        keyPos++;
      }
    }
    return results.join(sep);
  }
}

registerCustomOp(NihilistCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Nihilist cipher encode — Polybius coordinates added to key coordinates.',
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

export default NihilistCipherEncode;
