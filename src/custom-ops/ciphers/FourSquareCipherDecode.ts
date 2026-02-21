import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { generatePolybiusSquare, polybiusEncode, polybiusDecode } from '../_lib/polybius';

const NAME = 'Four-Square Cipher Decode';

class FourSquareCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes text encrypted with the Four-Square cipher using two keyed 5x5 squares.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Four-square_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Keyword 1 (top-right)', type: 'string', value: 'EXAMPLE' },
      { name: 'Keyword 2 (bottom-left)', type: 'string', value: 'KEYWORD' },
    ];
  }

  run(input: string, args: any[]): string {
    const kw1 = (args[0] as string) || 'EXAMPLE';
    const kw2 = (args[1] as string) || 'KEYWORD';

    const plain = generatePolybiusSquare('', 5, true);
    const keyed1 = generatePolybiusSquare(kw1, 5, true);
    const keyed2 = generatePolybiusSquare(kw2, 5, true);

    const letters = input.toUpperCase().replace(/J/g, 'I').replace(/[^A-IK-Z]/g, '');
    const padded = letters.length % 2 === 1 ? letters + 'X' : letters;

    let result = '';
    for (let i = 0; i < padded.length; i += 2) {
      // Ciphertext pair comes from keyed squares
      const c1 = polybiusEncode(padded[i], keyed1, 5, true);
      const c2 = polybiusEncode(padded[i + 1], keyed2, 5, true);
      if (!c1 || !c2) continue;

      // Reverse: plain square top-left (row from keyed1, col from keyed2)
      result += polybiusDecode(c1[0], c2[1], plain, 5);
      // Plain square bottom-right (row from keyed2, col from keyed1)
      result += polybiusDecode(c2[0], c1[1], plain, 5);
    }
    return result;
  }
}

registerCustomOp(FourSquareCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Four-Square cipher decode — reverse digraph decryption with 4 Polybius squares.',
  infoURL: 'https://en.wikipedia.org/wiki/Four-square_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Keyword 1 (top-right)', type: 'string', value: 'EXAMPLE' },
    { name: 'Keyword 2 (bottom-left)', type: 'string', value: 'KEYWORD' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default FourSquareCipherDecode;
