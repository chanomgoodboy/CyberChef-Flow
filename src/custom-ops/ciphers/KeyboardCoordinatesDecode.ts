import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Keyboard Coordinates Decode';

const QWERTY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

class KeyboardCoordinatesDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts (row,col) coordinate pairs back to letters using QWERTY keyboard layout.';
    this.infoURL = 'https://www.dcode.fr/keyboard-coordinates';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Origin',
        type: 'option',
        value: ['1-based', '0-based'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const origin = (args[0] as string) || '1-based';
    const base = origin === '0-based' ? 0 : 1;

    let result = '';
    const re = /\((\d+)[,;](\d+)\)|(\d+)[,;](\d+)|\/+/g;
    let match;
    while ((match = re.exec(input)) !== null) {
      if (match[0].startsWith('/')) {
        result += ' ';
        continue;
      }
      const r = parseInt(match[1] ?? match[3], 10) - base;
      const c = parseInt(match[2] ?? match[4], 10) - base;
      if (r >= 0 && r < QWERTY_ROWS.length && c >= 0 && c < QWERTY_ROWS[r].length) {
        result += QWERTY_ROWS[r][c];
      } else {
        result += '?';
      }
    }
    return result;
  }
}

registerCustomOp(KeyboardCoordinatesDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Keyboard Coordinates decode — (row,col) pairs to letters.',
  infoURL: 'https://www.dcode.fr/keyboard-coordinates',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Origin', type: 'option', value: ['1-based', '0-based'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default KeyboardCoordinatesDecode;
