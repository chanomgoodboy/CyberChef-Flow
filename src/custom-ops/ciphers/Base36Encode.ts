import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Base36 Encode';
const B36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

class Base36Encode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encodes text as base-36 numbers. Each word is treated as a base-36 ' +
      'number (0-9, A-Z) and output as its decimal value. ' +
      'Words are separated by the chosen separator.';
    this.infoURL = 'https://www.dcode.fr/base-36-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Separator',
        type: 'option',
        value: ['Space', 'Comma', 'Line feed'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const sepName = (args[0] as string) || 'Space';
    const sep = sepName === 'Comma' ? ',' : sepName === 'Line feed' ? '\n' : ' ';

    const words = input.trim().split(/\s+/).filter(Boolean);
    const results: string[] = [];

    for (const word of words) {
      const upper = word.toUpperCase();
      let val = 0n;
      let valid = true;
      for (const ch of upper) {
        const idx = B36.indexOf(ch);
        if (idx < 0) { valid = false; break; }
        val = val * 36n + BigInt(idx);
      }
      results.push(valid ? val.toString() : '?');
    }

    return results.join(sep);
  }
}

registerCustomOp(Base36Encode, {
  name: NAME,
  module: 'Custom',
  description: 'Base36 encode — text words to decimal (base-36 cipher).',
  infoURL: 'https://www.dcode.fr/base-36-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'Line feed'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default Base36Encode;
