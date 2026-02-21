import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'LSPK90 Clockwise Decode';

/**
 * Primary LSPK90 encode table — same as LSPK90Encode.ts.
 * The decode table is built by inverting this.
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

/**
 * Alternative representations (dcode.fr uses different forms depending
 * on context / separator mode). Keys are ciphertext tokens, values are
 * the plaintext character they decode to.
 */
const ALTERNATIVES: Record<string, string> = {
  '<>': '0',
  'LL|': 'E',
  '[/]': 'S',
};

/** Build decode map: ciphertext → plaintext character */
function buildDecodeMap(): Map<string, string> {
  const map = new Map<string, string>();
  // Primary table (inverted)
  for (const [plain, cipher] of Object.entries(ENCODE_TABLE)) {
    map.set(cipher, plain);
  }
  // Alternatives (don't override primary entries)
  for (const [cipher, plain] of Object.entries(ALTERNATIVES)) {
    if (!map.has(cipher)) {
      map.set(cipher, plain);
    }
  }
  return map;
}

const DECODE_MAP = buildDecodeMap();
const MAX_TOKEN_LEN = Math.max(...[...DECODE_MAP.keys()].map((k) => k.length));

class LSPK90Decode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes LSPK90 (Leet Speak 90° Clockwise) by reversing the ASCII art substitution. ' +
      'Works best with space-separated tokens. Unspaced input uses greedy longest-match parsing.';
    this.infoURL =
      'https://www.dcode.fr/lspk90-cw-leet-speak-90-degrees-clockwise';
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
    const sepMode = (args[0] as string) || 'Space';

    if (sepMode === 'Space') {
      return this.decodeSpaced(input);
    }
    return this.decodeUnspaced(input);
  }

  private decodeSpaced(input: string): string {
    return input
      .split(' ')
      .map((token) => {
        if (token === '') return ' ';
        const plain = DECODE_MAP.get(token);
        return plain ?? token;
      })
      .join('');
  }

  private decodeUnspaced(input: string): string {
    const result: string[] = [];
    let i = 0;
    while (i < input.length) {
      let matched = false;
      // Greedy: try longest token first
      for (let len = Math.min(MAX_TOKEN_LEN, input.length - i); len >= 2; len--) {
        const token = input.substring(i, i + len);
        const plain = DECODE_MAP.get(token);
        if (plain !== undefined) {
          result.push(plain);
          i += len;
          matched = true;
          break;
        }
      }
      if (!matched) {
        // Single character passthrough
        result.push(input[i]);
        i++;
      }
    }
    return result.join('');
  }
}

registerCustomOp(LSPK90Decode, {
  name: NAME,
  module: 'Custom',
  description:
    'LSPK90 Clockwise decode — reverse Leet Speak 90° substitution cipher.',
  infoURL: 'https://www.dcode.fr/lspk90-cw-leet-speak-90-degrees-clockwise',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Separator', type: 'option', value: ['Space', 'None'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default LSPK90Decode;
