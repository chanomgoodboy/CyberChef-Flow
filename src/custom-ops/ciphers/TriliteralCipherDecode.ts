import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Triliteral Cipher Decode';

class TriliteralCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes 3-digit base-3 numbers back to letters. 000=A, 001=B, etc.';
    this.infoURL = 'https://www.dcode.fr/triliteral-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Alphabet size',
        type: 'option',
        value: ['26 letters', '24 letters (I=J, U=V)'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const alphabetSize = (args[0] as string) || '26 letters';
    const use24 = alphabetSize.startsWith('24');
    const alpha = use24 ? 'ABCDEFGHIKLMNOPQRSTUWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Extract groups of 3 digits (0-2)
    const clean = input.replace(/[\s,]+/g, '');
    let result = '';
    for (let i = 0; i + 2 < clean.length; i += 3) {
      const d2 = parseInt(clean[i]);
      const d1 = parseInt(clean[i + 1]);
      const d0 = parseInt(clean[i + 2]);
      if (d2 > 2 || d1 > 2 || d0 > 2) { result += '?'; continue; }
      const idx = d2 * 9 + d1 * 3 + d0;
      if (idx < alpha.length) {
        result += alpha[idx];
      } else {
        result += '?';
      }
    }
    return result;
  }
}

registerCustomOp(TriliteralCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Triliteral Cipher decode — 3-digit base-3 numbers to letters.',
  infoURL: 'https://www.dcode.fr/triliteral-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Alphabet size', type: 'option', value: ['26 letters', '24 letters (I=J, U=V)'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default TriliteralCipherDecode;
