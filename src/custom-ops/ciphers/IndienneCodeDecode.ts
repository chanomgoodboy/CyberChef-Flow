import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Indienne Code Decode';

class IndienneCodeDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes Indienne Code (Compagnie des Indes) 2-digit codes back to letters.';
    this.infoURL = 'https://www.dcode.fr/indienne-code';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Keyword', type: 'string', value: 'INDIENNE' },
    ];
  }

  run(input: string, args: any[]): string {
    const keyword = ((args[0] as string) || 'INDIENNE').toUpperCase();

    // Build keyed alphabet (I=J, 25 letters)
    const seen = new Set<string>();
    const alpha: string[] = [];
    for (const ch of keyword + 'ABCDEFGHIKLMNOPQRSTUVWXYZ') {
      const c = ch === 'J' ? 'I' : ch;
      if (/[A-Z]/.test(c) && !seen.has(c)) {
        seen.add(c);
        alpha.push(c);
      }
    }

    const decMap: Record<string, string> = {};
    for (let i = 0; i < 25; i++) {
      const r = Math.floor(i / 5) + 1;
      const c = (i % 5) + 1;
      decMap[`${r}${c}`] = alpha[i];
    }

    const groups = input.trim().split(/\s*\/\s*/);
    const decoded: string[] = [];

    for (const group of groups) {
      const tokens = group.trim().split(/[\s,]+/).filter(Boolean);
      let word = '';
      for (const tok of tokens) {
        // Handle concatenated pairs (no separator)
        if (tok.length > 2 && /^\d+$/.test(tok)) {
          for (let i = 0; i + 1 < tok.length; i += 2) {
            const pair = tok.slice(i, i + 2);
            word += decMap[pair] ?? '?';
          }
        } else {
          word += decMap[tok] ?? tok;
        }
      }
      decoded.push(word);
    }
    return decoded.join(' ');
  }
}

registerCustomOp(IndienneCodeDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Indienne Code decode — 2-digit codes to letters.',
  infoURL: 'https://www.dcode.fr/indienne-code',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Keyword', type: 'string', value: 'INDIENNE' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default IndienneCodeDecode;
