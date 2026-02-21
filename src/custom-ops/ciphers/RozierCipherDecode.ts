import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { polyalphabeticCipher } from '../_lib/polyalphabetic';

const NAME = 'Rozier Cipher Decode';

class RozierCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes Rozier cipher (Vigenere with numeric key).';
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
    return polyalphabeticCipher(input, keyNums, (pIdx, kIdx) => pIdx - kIdx);
  }
}

registerCustomOp(RozierCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Rozier cipher decode — Vigenere with numeric key.',
  infoURL: 'https://www.dcode.fr/rozier-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Key (digits)', type: 'string', value: '31415' }],
  flowControl: false,
}, 'Classical Ciphers');

export default RozierCipherDecode;
