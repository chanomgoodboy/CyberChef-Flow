import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { PRIMES } from './PrimeNumbersCipherEncode';

const NAME = 'Prime Multiplication Encode';

class PrimeMultiplicationEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Multiplies each letter position (A=1..Z=26) by a prime number key. ' +
      'A=1×key, B=2×key, C=3×key...';
    this.infoURL = 'https://www.dcode.fr/prime-number-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Prime Key', type: 'number', value: 7 },
      { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'Dash'] },
    ];
  }

  run(input: string, args: any[]): string {
    const key = (args[0] as number) ?? 7;
    const sepName = (args[1] as string) || 'Space';
    const sep = sepName === 'Comma' ? ',' : sepName === 'Dash' ? '-' : ' ';

    const parts: string[] = [];
    for (const ch of input) {
      const code = ch.toUpperCase().charCodeAt(0);
      if (code >= 65 && code <= 90) {
        parts.push(String((code - 64) * key));
      } else if (ch === ' ') {
        parts.push('/');
      }
    }
    return parts.join(sep);
  }
}

registerCustomOp(PrimeMultiplicationEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Prime Multiplication encode — letter position × prime key.',
  infoURL: 'https://www.dcode.fr/prime-number-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Prime Key', type: 'number', value: 7 },
    { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'Dash'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default PrimeMultiplicationEncode;
