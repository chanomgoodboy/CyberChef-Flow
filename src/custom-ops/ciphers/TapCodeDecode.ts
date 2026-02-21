import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Tap Code Decode';

const TAP_GRID = 'ABCDEFGHILMNOPQRSTUVWXYZ'; // No J or K

class TapCodeDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes Tap Code (prisoner cipher) back to text. Expects groups of taps separated by spaces, with double spaces between letters.';
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

    const letters = input.split(letterSep);
    let result = '';

    for (const letter of letters) {
      if (letter.trim() === '/' || letter.trim() === '') {
        if (letter.trim() === '/') result += ' ';
        continue;
      }
      const groups = letter.split(groupSep);
      if (groups.length !== 2) continue;

      const row = groups[0].split(tap).length - 1; // count taps
      const col = groups[1].split(tap).length - 1;

      // Alternative: just count the tap character occurrences
      const rowCount = (groups[0].match(new RegExp(tap.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      const colCount = (groups[1].match(new RegExp(tap.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

      const idx = (rowCount - 1) * 5 + (colCount - 1);
      if (idx >= 0 && idx < TAP_GRID.length) {
        result += TAP_GRID[idx];
      }
    }
    return result;
  }
}

registerCustomOp(TapCodeDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Tap Code decode — tap patterns back to letters.',
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

export default TapCodeDecode;
