import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'LSPK90 Clockwise Encode';

/**
 * LSPK90 (Leet Speak 90° Clockwise) substitution table.
 * Each letter/digit is replaced by 1-3 ASCII characters that visually
 * resemble the original character when rotated 90° clockwise.
 * Table derived from dcode.fr reference implementation.
 */
const ENCODE_TABLE: Record<string, string> = {
  A: '<{',
  B: '^^',
  C: '|_|',
  D: '/\\',
  E: '\\|/',
  F: 'LL',
  G: 'LD',
  H: '][',
  I: "'--",
  J: "'\u00AF7",
  K: '_V_',
  L: '_|',
  M: 'E',
  N: 'Z',
  O: '()',
  P: '/\\_',
  Q: "O'",
  R: '^<',
  S: 'v^',
  T: '|--',
  U: ']',
  V: '>',
  W: '3',
  X: '><',
  Y: '>-',
  Z: 'N',
  '0': '{}',
  '1': '\u00AF\u00AF',
  '2': '(V',
  '3': '/|\\',
  '4': '_+',
  '5': 'V|',
  '6': 'L0',
  '7': '|\u00AF\u00AF',
  '8': '(X)',
  '9': '0\u00AF|',
};

class LSPK90Encode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encodes text using LSPK90 (Leet Speak 90° Clockwise), a polygrammic substitution ' +
      'where each character is replaced by ASCII symbols that look like it when rotated 90° CW. ' +
      'Proposed by Michel Kern.';
    this.infoURL = 'https://www.dcode.fr/lspk90-cw-leet-speak-90-degrees-clockwise';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Separator',
        type: 'option',
        value: ['Space', 'None'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const sep = (args[0] as string) === 'None' ? '' : ' ';
    const groups: string[] = [];

    for (const ch of input) {
      const upper = ch.toUpperCase();
      const encoded = ENCODE_TABLE[upper];
      if (encoded) {
        groups.push(encoded);
      } else {
        // Non-encodable characters pass through
        groups.push(ch);
      }
    }

    return groups.join(sep);
  }
}

registerCustomOp(LSPK90Encode, {
  name: NAME,
  module: 'Custom',
  description:
    'LSPK90 Clockwise encode — Leet Speak 90° substitution cipher.',
  infoURL: 'https://www.dcode.fr/lspk90-cw-leet-speak-90-degrees-clockwise',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Separator', type: 'option', value: ['Space', 'None'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default LSPK90Encode;
