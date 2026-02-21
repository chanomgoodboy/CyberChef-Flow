import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { polyalphabeticCipher } from '../_lib/polyalphabetic';

const NAME = 'Rozier Cipher Encode';

class RozierCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'The Rozier cipher is a Vigenere variant using a purely numeric key (digits 0-9 as shifts). ' +
      'Identical to Gronsfeld but traditionally associated with different historical usage.';
    this.infoURL = 'https://www.dcode.fr/rozier-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Key (digits)', type: 'string', value: '31415' },
    ];
  }

  run(input: string, args: any[]): string {
    const keyStr = (args[0] as string) || '31415';
    const keyNums = [...keyStr].map(Number).filter((n) => !isNaN(n));
    if (keyNums.length === 0) return input;
    return polyalphabeticCipher(input, keyNums, (pIdx, kIdx) => pIdx + kIdx);
  }
}

registerCustomOp(RozierCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Rozier cipher encode — Vigenere with numeric key.',
  infoURL: 'https://www.dcode.fr/rozier-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Key (digits)', type: 'string', value: '31415' }],
  flowControl: false,
}, 'Classical Ciphers');

export default RozierCipherEncode;
