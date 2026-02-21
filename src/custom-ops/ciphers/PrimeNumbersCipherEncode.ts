import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Prime Numbers Cipher Encode';

// First 26 primes: A=2, B=3, C=5, ... Z=101
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101];

class PrimeNumbersCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts each letter to the corresponding prime number. ' +
      'A=2 (1st prime), B=3 (2nd prime), C=5 (3rd prime), ...Z=101 (26th prime).';
    this.infoURL = 'https://www.dcode.fr/prime-number-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Separator',
        type: 'option',
        value: ['Space', 'Comma', 'Dash'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const sepName = (args[0] as string) || 'Space';
    const sep = sepName === 'Comma' ? ',' : sepName === 'Dash' ? '-' : ' ';

    const parts: string[] = [];
    for (const ch of input) {
      const code = ch.toUpperCase().charCodeAt(0);
      if (code >= 65 && code <= 90) {
        parts.push(String(PRIMES[code - 65]));
      } else if (ch === ' ') {
        parts.push('/');
      }
    }
    return parts.join(sep);
  }
}

registerCustomOp(PrimeNumbersCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Prime Numbers Cipher encode — letters to nth primes (A=2, B=3, C=5...).',
  infoURL: 'https://www.dcode.fr/prime-number-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'Dash'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default PrimeNumbersCipherEncode;
export { PRIMES };
