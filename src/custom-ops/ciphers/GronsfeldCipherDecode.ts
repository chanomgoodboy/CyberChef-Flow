import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { polyalphabeticCipher } from '../_lib/polyalphabetic';

const NAME = 'Gronsfeld Cipher Decode';

class GronsfeldCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes text encrypted with the Gronsfeld cipher using a numeric key (digits 0-9).';
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
    return polyalphabeticCipher(input, keyNums, (pIdx, kIdx) => pIdx - kIdx);
  }
}

registerCustomOp(GronsfeldCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Gronsfeld cipher decode — Vigenere with a numeric key.',
  infoURL: 'https://en.wikipedia.org/wiki/Gronsfeld_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Key (digits)', type: 'string', value: '31415' }],
  flowControl: false,
}, 'Classical Ciphers');

export default GronsfeldCipherDecode;
