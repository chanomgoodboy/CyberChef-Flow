import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Triliteral Cipher Encode';

class TriliteralCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encodes each letter as a 3-digit base-3 number. ' +
      '26-letter: A=000, B=001, C=002, ...Z=222. ' +
      '24-letter (I=J, U=V): A=000, B=001, ...X=212.';
    this.infoURL = 'https://www.dcode.fr/triliteral-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Alphabet size',
        type: 'option',
        value: ['26 letters', '24 letters (I=J, U=V)'],
      },
      {
        name: 'Separator',
        type: 'option',
        value: ['Space', 'None', 'Comma'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const alphabetSize = (args[0] as string) || '26 letters';
    const sepName = (args[1] as string) || 'Space';
    const sep = sepName === 'Comma' ? ',' : sepName === 'None' ? '' : ' ';
    const use24 = alphabetSize.startsWith('24');

    const parts: string[] = [];
    for (const ch of input) {
      let upper = ch.toUpperCase();
      const code = upper.charCodeAt(0);
      if (code < 65 || code > 90) continue;

      let idx: number;
      if (use24) {
        if (upper === 'J') upper = 'I';
        if (upper === 'V') upper = 'U';
        const alpha24 = 'ABCDEFGHIKLMNOPQRSTUWXYZ';
        idx = alpha24.indexOf(upper);
      } else {
        idx = code - 65;
      }

      if (idx >= 0) {
        const d2 = Math.floor(idx / 9);
        const d1 = Math.floor((idx % 9) / 3);
        const d0 = idx % 3;
        parts.push(`${d2}${d1}${d0}`);
      }
    }
    return parts.join(sep);
  }
}

registerCustomOp(TriliteralCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Triliteral Cipher encode — letters to 3-digit base-3 numbers.',
  infoURL: 'https://www.dcode.fr/triliteral-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Alphabet size', type: 'option', value: ['26 letters', '24 letters (I=J, U=V)'] },
    { name: 'Separator', type: 'option', value: ['Space', 'None', 'Comma'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default TriliteralCipherEncode;
