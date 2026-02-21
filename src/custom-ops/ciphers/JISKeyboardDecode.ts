import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { JIS_REVERSE } from '../_lib/jisKeyboard';

const NAME = 'JIS Keyboard Decode';

class JISKeyboardDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts Japanese kana back to QWERTY key presses using JIS keyboard mapping.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    let result = '';
    for (const ch of input) {
      if (JIS_REVERSE[ch]) {
        result += JIS_REVERSE[ch];
      } else {
        result += ch;
      }
    }
    return result;
  }
}

registerCustomOp(JISKeyboardDecode, {
  name: NAME,
  module: 'Custom',
  description: 'JIS Keyboard (Mikaka) decode — Japanese kana to QWERTY.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default JISKeyboardDecode;
