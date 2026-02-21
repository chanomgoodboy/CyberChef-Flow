import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Base26 Encode';

class Base26Encode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encodes text as base-26 numbers. Each word is treated as a base-26 ' +
      'number (A=0..Z=25) and output as its decimal value. ' +
      'Non-letter characters are ignored within words.';
    this.infoURL = 'https://www.dcode.fr/base-26-cipher';
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
      const letters = word.replace(/[^A-Za-z]/g, '').toUpperCase();
      if (letters.length === 0) { results.push('?'); continue; }
      let val = 0n;
      for (const ch of letters) {
        val = val * 26n + BigInt(ch.charCodeAt(0) - 65);
      }
      results.push(val.toString());
    }

    return results.join(sep);
  }
}

registerCustomOp(Base26Encode, {
  name: NAME,
  module: 'Custom',
  description: 'Base26 encode — text words to decimal (A=0..Z=25 base-26 cipher).',
  infoURL: 'https://www.dcode.fr/base-26-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'Line feed'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default Base26Encode;
