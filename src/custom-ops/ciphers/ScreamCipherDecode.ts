import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Scream Cipher Decode';

const DIACRITICS = [
  'A', '\u00C0', '\u00C1', '\u00C2', '\u00C3', '\u00C4', '\u00C5',
  '\u0100', '\u0102', '\u0104', '\u01CD', '\u01DE', '\u01E0', '\u0200',
  '\u0202', '\u0226', '\u023A', '\u1E00', '\u1EA0', '\u1EA2', '\u1EA4',
  '\u1EA6', '\u1EA8', '\u1EAA', '\u1EAC', '\u1EAE',
];

const REVERSE: Record<string, string> = {};
for (let i = 0; i < 26; i++) {
  const letter = String.fromCharCode(65 + i);
  REVERSE[DIACRITICS[i]] = letter;
  REVERSE[DIACRITICS[i].toLowerCase()] = letter.toLowerCase();
}

class ScreamCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes Scream Cipher by mapping diacriticed A variants back to letters.';
    this.infoURL = 'https://www.dcode.fr/scream-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    let result = '';
    for (const ch of input) {
      const mapped = REVERSE[ch];
      result += mapped ?? ch;
    }
    return result;
  }
}

registerCustomOp(ScreamCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Scream Cipher decode — diacriticed A variants back to letters.',
  infoURL: 'https://www.dcode.fr/scream-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default ScreamCipherDecode;
