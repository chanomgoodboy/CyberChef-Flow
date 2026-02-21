import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Base26 Decode';

class Base26Decode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes decimal numbers back to text via base-26. Each decimal number ' +
      'is converted to its base-26 letter representation (A=0..Z=25).';
    this.infoURL = 'https://www.dcode.fr/base-26-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Separator',
        type: 'option',
        value: ['Space', 'Comma', 'Line feed', 'Auto'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const sepName = (args[0] as string) || 'Space';
    let tokens: string[];
    if (sepName === 'Auto') {
      tokens = input.trim().split(/[\s,]+/).filter(Boolean);
    } else {
      const sep = sepName === 'Comma' ? ',' : sepName === 'Line feed' ? '\n' : ' ';
      tokens = input.split(sep).filter(Boolean);
    }

    const results: string[] = [];
    for (const tok of tokens) {
      const trimmed = tok.trim();
      try {
        let n = BigInt(trimmed);
        if (n < 0n) { results.push('?'); continue; }
        if (n === 0n) { results.push('A'); continue; }
        let word = '';
        while (n > 0n) {
          word = String.fromCharCode(Number(n % 26n) + 65) + word;
          n = n / 26n;
        }
        results.push(word);
      } catch {
        results.push('?');
      }
    }

    return results.join(' ');
  }
}

registerCustomOp(Base26Decode, {
  name: NAME,
  module: 'Custom',
  description: 'Base26 decode — decimal numbers to text (A=0..Z=25 base-26 cipher).',
  infoURL: 'https://www.dcode.fr/base-26-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'Line feed', 'Auto'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default Base26Decode;
