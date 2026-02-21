import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { polyalphabeticCipher } from '../_lib/polyalphabetic';
import { ALPHABET } from '../_lib/alphabet';

const NAME = 'Trithemius Cipher Decode';

class TrithemiusCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes text encrypted with the Trithemius cipher (progressive polyalphabetic shift).';
    this.infoURL = 'https://en.wikipedia.org/wiki/Tabula_recta';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, args: any[]): string {
    return polyalphabeticCipher(input, ALPHABET, (pIdx, kIdx) => pIdx - kIdx);
  }
}

registerCustomOp(TrithemiusCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Trithemius cipher decode — progressive polyalphabetic shift.',
  infoURL: 'https://en.wikipedia.org/wiki/Tabula_recta',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default TrithemiusCipherDecode;
