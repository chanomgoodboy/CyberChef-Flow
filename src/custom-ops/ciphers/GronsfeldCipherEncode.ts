import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { polyalphabeticCipher } from '../_lib/polyalphabetic';

const NAME = 'Gronsfeld Cipher Encode';

class GronsfeldCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The Gronsfeld cipher is a polyalphabetic cipher identical to Vigenere but uses a numeric key (digits 0-9) instead of a keyword.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Gronsfeld_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Key (digits)', type: 'string', value: '31415' },
    ];
  }

  run(input: string, args: any[]): string {
    const keyStr = (args[0] as string) || '31415';
    const keyNums = [...keyStr].map(Number).filter((n) => !isNaN(n));
    return polyalphabeticCipher(input, keyNums, (pIdx, kIdx) => pIdx + kIdx);
  }
}

registerCustomOp(GronsfeldCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Gronsfeld cipher encode — Vigenere with a numeric key.',
  infoURL: 'https://en.wikipedia.org/wiki/Gronsfeld_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Key (digits)', type: 'string', value: '31415' }],
  flowControl: false,
}, 'Classical Ciphers');

export default GronsfeldCipherEncode;
