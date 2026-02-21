import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Base36 Decode';
const B36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

class Base36Decode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes decimal numbers back to text via base-36. Each decimal number ' +
      'is converted to its base-36 representation (0-9, A-Z) to recover the original word.';
    this.infoURL = 'https://www.dcode.fr/base-36-cipher';
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
        if (n === 0n) { results.push('0'); continue; }
        let word = '';
        while (n > 0n) {
          word = B36[Number(n % 36n)] + word;
          n = n / 36n;
        }
        results.push(word.toLowerCase());
      } catch {
        results.push('?');
      }
    }

    return results.join(' ');
  }
}

registerCustomOp(Base36Decode, {
  name: NAME,
  module: 'Custom',
  description: 'Base36 decode — decimal numbers to text words (base-36 cipher).',
  infoURL: 'https://www.dcode.fr/base-36-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'Line feed', 'Auto'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default Base36Decode;
