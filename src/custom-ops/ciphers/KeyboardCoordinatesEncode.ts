import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Keyboard Coordinates Encode';

const QWERTY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

class KeyboardCoordinatesEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts each letter to its (row, col) coordinates on a QWERTY keyboard. ' +
      'Row 1 = QWERTYUIOP, Row 2 = ASDFGHJKL, Row 3 = ZXCVBNM.';
    this.infoURL = 'https://www.dcode.fr/keyboard-coordinates';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Origin',
        type: 'option',
        value: ['1-based', '0-based'],
      },
      {
        name: 'Separator',
        type: 'option',
        value: ['Space', 'Comma', 'Line feed'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const origin = (args[0] as string) || '1-based';
    const sepName = (args[1] as string) || 'Space';
    const sep = sepName === 'Comma' ? ',' : sepName === 'Line feed' ? '\n' : ' ';
    const base = origin === '0-based' ? 0 : 1;

    const parts: string[] = [];
    for (const ch of input) {
      const upper = ch.toUpperCase();
      let found = false;
      for (let r = 0; r < QWERTY_ROWS.length; r++) {
        const c = QWERTY_ROWS[r].indexOf(upper);
        if (c >= 0) {
          parts.push(`(${r + base},${c + base})`);
          found = true;
          break;
        }
      }
      if (!found && ch === ' ') {
        parts.push('/');
      }
    }
    return parts.join(sep);
  }
}

registerCustomOp(KeyboardCoordinatesEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Keyboard Coordinates encode — letters to QWERTY (row,col) pairs.',
  infoURL: 'https://www.dcode.fr/keyboard-coordinates',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Origin', type: 'option', value: ['1-based', '0-based'] },
    { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'Line feed'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default KeyboardCoordinatesEncode;
