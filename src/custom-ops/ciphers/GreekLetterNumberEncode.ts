import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Greek Letter Number Encode';

const GREEK_SYMBOLS = 'αβγδεζηθικλμνξοπρστυφχψω';
const GREEK_NAMES = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
  'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi',
  'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega',
];

class GreekLetterNumberEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts numbers to Greek letters. 1=α(Alpha), 2=β(Beta), ...24=ω(Omega). ' +
      'Output as symbols or names.';
    this.infoURL = 'https://www.dcode.fr/greek-number-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Format',
        type: 'option',
        value: ['Symbol', 'Name'],
      },
      {
        name: 'Separator',
        type: 'option',
        value: ['Space', 'Comma', 'None'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const format = (args[0] as string) || 'Symbol';
    const sepName = (args[1] as string) || 'Space';
    const sep = sepName === 'Comma' ? ',' : sepName === 'None' ? '' : ' ';

    const parts: string[] = [];
    for (const ch of input) {
      const upper = ch.toUpperCase();
      const code = upper.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        const pos = code - 65; // 0-25
        const greekIdx = pos % 24;
        if (format === 'Name') {
          parts.push(GREEK_NAMES[greekIdx]);
        } else {
          const sym = GREEK_SYMBOLS[greekIdx];
          parts.push(ch === upper ? sym.toUpperCase() : sym);
        }
      } else {
        parts.push(ch);
      }
    }
    return parts.join(sep);
  }
}

registerCustomOp(GreekLetterNumberEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Greek Letter Number encode — letters to Greek alphabet equivalents.',
  infoURL: 'https://www.dcode.fr/greek-number-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Format', type: 'option', value: ['Symbol', 'Name'] },
    { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'None'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default GreekLetterNumberEncode;
export { GREEK_SYMBOLS, GREEK_NAMES };
