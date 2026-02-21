import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'D3 Code Encode';

/**
 * D3 Code — French resistance cipher using 3-digit groups from a keyed table.
 * Similar to Polybius but uses a 10×10 grid (digits 0-9 as coordinates).
 * Letters A-Z + digits 0-9 = 36 symbols in a 6×6 portion of the grid.
 */
class D3CodeEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encodes text using the D3 Code (French resistance). Each character maps to a 3-digit group ' +
      'based on a keyed grid.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Keyword', type: 'string', value: 'RESISTANCE' },
      { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'None'] },
    ];
  }

  run(input: string, args: any[]): string {
    const keyword = ((args[0] as string) || 'RESISTANCE').toUpperCase();
    const sepName = (args[1] as string) || 'Space';
    const sep = sepName === 'Comma' ? ',' : sepName === 'None' ? '' : ' ';

    // Build keyed alphabet: 26 letters + 10 digits = 36 symbols
    const seen = new Set<string>();
    const alpha: string[] = [];
    for (const ch of keyword + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
      if (!seen.has(ch) && /[A-Z0-9]/.test(ch)) {
        seen.add(ch);
        alpha.push(ch);
      }
    }

    // Map to 3-digit codes: hundreds = row, tens = col, units = checksum
    const encMap: Record<string, string> = {};
    for (let i = 0; i < alpha.length; i++) {
      const r = Math.floor(i / 6);
      const c = i % 6;
      const check = (r + c) % 10;
      encMap[alpha[i]] = `${r}${c}${check}`;
    }

    const parts: string[] = [];
    for (const ch of input.toUpperCase()) {
      if (encMap[ch]) {
        parts.push(encMap[ch]);
      } else if (ch === ' ') {
        parts.push('/');
      }
    }
    return parts.join(sep);
  }
}

registerCustomOp(D3CodeEncode, {
  name: NAME,
  module: 'Custom',
  description: 'D3 Code encode — text to 3-digit resistance code groups.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Keyword', type: 'string', value: 'RESISTANCE' },
    { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'None'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default D3CodeEncode;
