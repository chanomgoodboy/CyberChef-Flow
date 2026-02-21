import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { polyalphabeticCipher } from '../_lib/polyalphabetic';
import { ALPHABET } from '../_lib/alphabet';

const NAME = 'Trithemius Cipher Encode';

class TrithemiusCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The Trithemius cipher is a polyalphabetic cipher where the key is the alphabet itself (ABCDEF...Z), equivalent to Vigenere with a progressive shift starting at 0.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Tabula_recta';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, args: any[]): string {
    return polyalphabeticCipher(input, ALPHABET, (pIdx, kIdx) => pIdx + kIdx);
  }
}

registerCustomOp(TrithemiusCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Trithemius cipher encode — progressive polyalphabetic shift.',
  infoURL: 'https://en.wikipedia.org/wiki/Tabula_recta',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default TrithemiusCipherEncode;
