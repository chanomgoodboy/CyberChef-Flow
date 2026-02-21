import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'K7 Code Decode';

class K7CodeDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes cassette tape counter positions back to letters.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Tape Length', type: 'option', value: ['C-60 (000-300)', 'C-90 (000-450)', 'C-120 (000-600)'] },
    ];
  }

  run(input: string, args: any[]): string {
    const tapeName = (args[0] as string) || 'C-60 (000-300)';

    let maxCounter = 300;
    if (tapeName.includes('C-90')) maxCounter = 450;
    else if (tapeName.includes('C-120')) maxCounter = 600;

    const step = maxCounter / 26;

    const groups = input.trim().split(/\s*\/\s*/);
    const decoded: string[] = [];

    for (const group of groups) {
      const tokens = group.trim().split(/[\s,]+/).filter(Boolean);
      let word = '';
      for (const tok of tokens) {
        const n = parseInt(tok, 10);
        if (!isNaN(n)) {
          const pos = Math.round(n / step);
          if (pos >= 1 && pos <= 26) {
            word += String.fromCharCode(64 + pos);
          } else {
            word += '?';
          }
        }
      }
      decoded.push(word);
    }
    return decoded.join(' ');
  }
}

registerCustomOp(K7CodeDecode, {
  name: NAME,
  module: 'Custom',
  description: 'K7 Code decode — tape counter positions to letters.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Tape Length', type: 'option', value: ['C-60 (000-300)', 'C-90 (000-450)', 'C-120 (000-600)'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default K7CodeDecode;
