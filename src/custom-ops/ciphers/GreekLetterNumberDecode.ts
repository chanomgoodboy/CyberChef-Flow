import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Greek Letter Number Decode';

const GREEK_LOWER = 'αβγδεζηθικλμνξοπρστυφχψω';
const GREEK_UPPER = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';
const GREEK_NAMES_UPPER = [
  'ALPHA', 'BETA', 'GAMMA', 'DELTA', 'EPSILON', 'ZETA', 'ETA', 'THETA',
  'IOTA', 'KAPPA', 'LAMBDA', 'MU', 'NU', 'XI', 'OMICRON', 'PI',
  'RHO', 'SIGMA', 'TAU', 'UPSILON', 'PHI', 'CHI', 'PSI', 'OMEGA',
];

class GreekLetterNumberDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts Greek letters or names back to Latin letters. ' +
      'α/Alpha=A, β/Beta=B, ...ω/Omega=X (maps to first 24 Latin letters).';
    this.infoURL = 'https://www.dcode.fr/greek-number-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    // First try to match Greek names (word-based)
    let working = input;

    // Replace Greek names (longest first to avoid partial matches)
    const sorted = [...GREEK_NAMES_UPPER].sort((a, b) => b.length - a.length);
    for (const name of sorted) {
      const idx = GREEK_NAMES_UPPER.indexOf(name);
      const letter = String.fromCharCode(65 + idx);
      const re = new RegExp(name, 'gi');
      working = working.replace(re, letter);
    }

    // Replace Greek Unicode symbols
    let result = '';
    for (const ch of working) {
      const lowerIdx = GREEK_LOWER.indexOf(ch);
      const upperIdx = GREEK_UPPER.indexOf(ch);
      if (lowerIdx >= 0) {
        result += String.fromCharCode(97 + lowerIdx); // lowercase
      } else if (upperIdx >= 0) {
        result += String.fromCharCode(65 + upperIdx); // uppercase
      } else {
        result += ch;
      }
    }
    return result;
  }
}

registerCustomOp(GreekLetterNumberDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Greek Letter Number decode — Greek letters/names to Latin letters.',
  infoURL: 'https://www.dcode.fr/greek-number-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default GreekLetterNumberDecode;
