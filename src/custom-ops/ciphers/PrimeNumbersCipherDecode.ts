import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Prime Numbers Cipher Decode';

const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101];
const PRIME_REVERSE: Record<number, string> = {};
for (let i = 0; i < 26; i++) {
  PRIME_REVERSE[PRIMES[i]] = String.fromCharCode(65 + i);
}

class PrimeNumbersCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts prime numbers back to letters. 2=A, 3=B, 5=C, ...101=Z.';
    this.infoURL = 'https://www.dcode.fr/prime-number-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Separator',
        type: 'option',
        value: ['Space', 'Comma', 'Dash', 'Auto'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const sepName = (args[0] as string) || 'Space';
    const groups = input.trim().split(/\s*\/\s*/);
    const decoded: string[] = [];
    for (const group of groups) {
      let inner: string[];
      if (sepName === 'Auto') {
        inner = group.trim().split(/[\s,\-]+/).filter(Boolean);
      } else {
        const sep = sepName === 'Comma' ? ',' : sepName === 'Dash' ? '-' : ' ';
        inner = group.split(sep).filter(Boolean);
      }
      let word = '';
      for (const tok of inner) {
        const t = tok.trim();
        const n = parseInt(t, 10);
        if (!isNaN(n) && PRIME_REVERSE[n]) {
          word += PRIME_REVERSE[n];
        } else {
          word += t;
        }
      }
      decoded.push(word);
    }
    return decoded.join(' ');
  }
}

registerCustomOp(PrimeNumbersCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Prime Numbers Cipher decode — prime numbers to letters.',
  infoURL: 'https://www.dcode.fr/prime-number-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'Dash', 'Auto'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default PrimeNumbersCipherDecode;
