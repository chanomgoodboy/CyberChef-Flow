import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'D3 Code Decode';

class D3CodeDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes D3 Code (French resistance) 3-digit groups back to text.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Keyword', type: 'string', value: 'RESISTANCE' },
    ];
  }

  run(input: string, args: any[]): string {
    const keyword = ((args[0] as string) || 'RESISTANCE').toUpperCase();

    const seen = new Set<string>();
    const alpha: string[] = [];
    for (const ch of keyword + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
      if (!seen.has(ch) && /[A-Z0-9]/.test(ch)) {
        seen.add(ch);
        alpha.push(ch);
      }
    }

    const decMap: Record<string, string> = {};
    for (let i = 0; i < alpha.length; i++) {
      const r = Math.floor(i / 6);
      const c = i % 6;
      const check = (r + c) % 10;
      decMap[`${r}${c}${check}`] = alpha[i];
    }

    const groups = input.trim().split(/\s*\/\s*/);
    const decoded: string[] = [];

    for (const group of groups) {
      const tokens = group.trim().split(/[\s,]+/).filter(Boolean);
      let word = '';
      for (const tok of tokens) {
        if (tok.length === 3 && /^\d{3}$/.test(tok)) {
          word += decMap[tok] ?? '?';
        } else if (tok.length > 3 && /^\d+$/.test(tok) && tok.length % 3 === 0) {
          // Concatenated 3-digit groups
          for (let i = 0; i < tok.length; i += 3) {
            word += decMap[tok.slice(i, i + 3)] ?? '?';
          }
        } else {
          word += tok;
        }
      }
      decoded.push(word);
    }
    return decoded.join(' ');
  }
}

registerCustomOp(D3CodeDecode, {
  name: NAME,
  module: 'Custom',
  description: 'D3 Code decode — 3-digit groups to text.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Keyword', type: 'string', value: 'RESISTANCE' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default D3CodeDecode;
