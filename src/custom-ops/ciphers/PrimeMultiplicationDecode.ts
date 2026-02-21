import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Prime Multiplication Decode';

class PrimeMultiplicationDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Divides each number by the prime key to recover letter positions. ' +
      'Reverse of Prime Multiplication Encode.';
    this.infoURL = 'https://www.dcode.fr/prime-number-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Prime Key', type: 'number', value: 7 },
      { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'Dash', 'Auto'] },
    ];
  }

  run(input: string, args: any[]): string {
    const key = (args[0] as number) ?? 7;
    const sepName = (args[1] as string) || 'Space';

    if (key === 0) return 'Error: Key cannot be zero';

    const groups = input.trim().split(/\s*\/\s*/);
    const decoded: string[] = [];

    for (const group of groups) {
      let tokens: string[];
      if (sepName === 'Auto') {
        tokens = group.trim().split(/[\s,\-]+/).filter(Boolean);
      } else {
        const sep = sepName === 'Comma' ? ',' : sepName === 'Dash' ? '-' : ' ';
        tokens = group.split(sep).filter(Boolean);
      }
      let word = '';
      for (const tok of tokens) {
        const n = parseInt(tok.trim(), 10);
        if (!isNaN(n) && n % key === 0) {
          const pos = n / key;
          if (pos >= 1 && pos <= 26) {
            word += String.fromCharCode(64 + pos);
          } else {
            word += tok;
          }
        } else {
          word += tok;
        }
      }
      decoded.push(word);
    }
    return decoded.join(' ');
  }
}

registerCustomOp(PrimeMultiplicationDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Prime Multiplication decode — divide numbers by prime key.',
  infoURL: 'https://www.dcode.fr/prime-number-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Prime Key', type: 'number', value: 7 },
    { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'Dash', 'Auto'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default PrimeMultiplicationDecode;
