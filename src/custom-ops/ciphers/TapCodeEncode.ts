import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Tap Code Encode';

// Tap code uses a 5x5 Polybius grid where K is replaced by C
const TAP_GRID = 'ABCDEFGHILMNOPQRSTUVWXYZ'; // No J or K (K→C)

class TapCodeEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Encodes text using Tap Code, a cipher used by prisoners to communicate by tapping. Each letter is represented as two groups of taps (row, column) in a 5x5 grid. K is encoded as C.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Tap_code';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Tap character', type: 'string', value: '.' },
      { name: 'Group separator', type: 'string', value: ' ' },
      { name: 'Letter separator', type: 'string', value: '  ' },
    ];
  }

  run(input: string, args: any[]): string {
    const tap = (args[0] as string) || '.';
    const groupSep = (args[1] as string) ?? ' ';
    const letterSep = (args[2] as string) ?? '  ';

    const results: string[] = [];
    for (const ch of input) {
      let c = ch.toUpperCase();
      if (c === 'K') c = 'C';
      if (c === 'J') c = 'I';
      const idx = TAP_GRID.indexOf(c);
      if (idx < 0) {
        if (ch === ' ') results.push('/');
        continue;
      }
      const row = Math.floor(idx / 5) + 1;
      const col = (idx % 5) + 1;
      results.push(tap.repeat(row) + groupSep + tap.repeat(col));
    }
    return results.join(letterSep);
  }
}

registerCustomOp(TapCodeEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Tap Code encode — letters to tap patterns (row, col).',
  infoURL: 'https://en.wikipedia.org/wiki/Tap_code',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Tap character', type: 'string', value: '.' },
    { name: 'Group separator', type: 'string', value: ' ' },
    { name: 'Letter separator', type: 'string', value: '  ' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default TapCodeEncode;
