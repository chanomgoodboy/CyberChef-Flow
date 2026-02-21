import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Indienne Code Encode';

/**
 * Indienne Code — 18th century French cipher used by the Compagnie des Indes.
 * Uses a keyed substitution with number pairs. Each letter maps to a 2-digit code
 * based on a key-derived grid.
 */
class IndienneCodeEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encodes text using the Indienne Code (Compagnie des Indes cipher). ' +
      'Each letter is mapped to a 2-digit number via a keyed 5×5 grid (I=J).';
    this.infoURL = 'https://www.dcode.fr/indienne-code';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Keyword', type: 'string', value: 'INDIENNE' },
      { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'None'] },
    ];
  }

  run(input: string, args: any[]): string {
    const keyword = ((args[0] as string) || 'INDIENNE').toUpperCase();
    const sepName = (args[1] as string) || 'Space';
    const sep = sepName === 'Comma' ? ',' : sepName === 'None' ? '' : ' ';

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

    const encMap: Record<string, string> = {};
    for (let i = 0; i < 25; i++) {
      const r = Math.floor(i / 5) + 1;
      const c = (i % 5) + 1;
      encMap[alpha[i]] = `${r}${c}`;
    }

    const parts: string[] = [];
    for (const ch of input.toUpperCase()) {
      const c = ch === 'J' ? 'I' : ch;
      if (encMap[c]) {
        parts.push(encMap[c]);
      } else if (ch === ' ') {
        parts.push('/');
      }
    }
    return parts.join(sep);
  }
}

registerCustomOp(IndienneCodeEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Indienne Code encode — letters to 2-digit keyed grid codes.',
  infoURL: 'https://www.dcode.fr/indienne-code',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Keyword', type: 'string', value: 'INDIENNE' },
    { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'None'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default IndienneCodeEncode;
