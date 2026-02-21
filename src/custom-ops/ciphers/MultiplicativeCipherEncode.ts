import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { mod, ALPHABET } from '../_lib/alphabet';

const NAME = 'Multiplicative Cipher Encode';

class MultiplicativeCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The multiplicative cipher encrypts each letter by multiplying its position by a key value modulo 26. The key must be coprime with 26.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Multiplicative_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Multiplier (a)', type: 'number', value: 7 },
    ];
  }

  run(input: string, args: any[]): string {
    const a = (args[0] as number) || 7;
    let result = '';
    for (const ch of input) {
      const upper = ch.toUpperCase();
      const idx = ALPHABET.indexOf(upper);
      if (idx < 0) {
        result += ch;
        continue;
      }
      const enc = mod(idx * a, 26);
      const outCh = ALPHABET[enc];
      result += ch === upper ? outCh : outCh.toLowerCase();
    }
    return result;
  }
}

registerCustomOp(MultiplicativeCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Multiplicative cipher encode — C = (P * a) mod 26.',
  infoURL: 'https://en.wikipedia.org/wiki/Multiplicative_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Multiplier (a)', type: 'number', value: 7 }],
  flowControl: false,
}, 'Classical Ciphers');

export default MultiplicativeCipherEncode;
