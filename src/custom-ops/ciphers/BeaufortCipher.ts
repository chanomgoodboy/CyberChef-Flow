import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { polyalphabeticCipher } from '../_lib/polyalphabetic';

const NAME = 'Beaufort Cipher';

class BeaufortCipher extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The Beaufort cipher is a polyalphabetic substitution cipher similar to Vigenere but using the formula C = (K - P) mod 26. It is reciprocal: encryption and decryption are the same operation.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Beaufort_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Key', type: 'string', value: 'FORTIFICATION' },
    ];
  }

  run(input: string, args: any[]): string {
    const key = (args[0] as string) || 'FORTIFICATION';
    // Beaufort: C = (K - P) mod 26 — reciprocal
    return polyalphabeticCipher(input, key, (pIdx, kIdx) => kIdx - pIdx);
  }
}

registerCustomOp(BeaufortCipher, {
  name: NAME,
  module: 'Custom',
  description: 'Beaufort cipher — reciprocal polyalphabetic (C = K - P mod 26).',
  infoURL: 'https://en.wikipedia.org/wiki/Beaufort_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Key', type: 'string', value: 'FORTIFICATION' }],
  flowControl: false,
}, 'Classical Ciphers');

export default BeaufortCipher;
