import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { mod, modInverse, ALPHABET } from '../_lib/alphabet';

const NAME = 'Multiplicative Cipher Decode';

class MultiplicativeCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes text encrypted with the multiplicative cipher using the modular inverse of the key.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Multiplicative_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Multiplier (a)', type: 'number', value: 7 },
    ];
  }

  run(input: string, args: any[]): string {
    const a = (args[0] as number) || 7;
    const aInv = modInverse(a, 26);
    if (aInv < 0) {
      throw new Error(`Key ${a} has no modular inverse mod 26. Key must be coprime with 26.`);
    }
    let result = '';
    for (const ch of input) {
      const upper = ch.toUpperCase();
      const idx = ALPHABET.indexOf(upper);
      if (idx < 0) {
        result += ch;
        continue;
      }
      const dec = mod(idx * aInv, 26);
      const outCh = ALPHABET[dec];
      result += ch === upper ? outCh : outCh.toLowerCase();
    }
    return result;
  }
}

registerCustomOp(MultiplicativeCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Multiplicative cipher decode — P = (C * a^-1) mod 26.',
  infoURL: 'https://en.wikipedia.org/wiki/Multiplicative_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Multiplier (a)', type: 'number', value: 7 }],
  flowControl: false,
}, 'Classical Ciphers');

export default MultiplicativeCipherDecode;
