import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Scream Cipher Encode';

// Diacritic variants of 'A' for letters A-Z
const DIACRITICS = [
  'A', '\u00C0', '\u00C1', '\u00C2', '\u00C3', '\u00C4', '\u00C5',
  '\u0100', '\u0102', '\u0104', '\u01CD', '\u01DE', '\u01E0', '\u0200',
  '\u0202', '\u0226', '\u023A', '\u1E00', '\u1EA0', '\u1EA2', '\u1EA4',
  '\u1EA6', '\u1EA8', '\u1EAA', '\u1EAC', '\u1EAE',
];

class ScreamCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Each letter is replaced by the letter A with a unique diacritic. ' +
      'A=A, B=\u00C0, C=\u00C1, D=\u00C2, etc. Output looks like screaming.';
    this.infoURL = 'https://www.dcode.fr/scream-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    let result = '';
    for (const ch of input) {
      const upper = ch.toUpperCase();
      const code = upper.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        const diac = DIACRITICS[code - 65];
        result += ch === upper ? diac : diac.toLowerCase();
      } else {
        result += ch;
      }
    }
    return result;
  }
}

registerCustomOp(ScreamCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Scream Cipher encode — each letter becomes A with a unique diacritic.',
  infoURL: 'https://www.dcode.fr/scream-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default ScreamCipherEncode;
export { DIACRITICS };
