import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { JIS_MAP } from '../_lib/jisKeyboard';

const NAME = 'JIS Keyboard Encode';

class JISKeyboardEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts QWERTY key presses to Japanese kana using JIS keyboard mapping (Mikaka). ' +
      'E.g., Q → た, W → て, E → い.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    let result = '';
    for (const ch of input) {
      const upper = ch.toUpperCase();
      if (JIS_MAP[upper]) {
        result += JIS_MAP[upper];
      } else if (JIS_MAP[ch]) {
        result += JIS_MAP[ch];
      } else {
        result += ch;
      }
    }
    return result;
  }
}

registerCustomOp(JISKeyboardEncode, {
  name: NAME,
  module: 'Custom',
  description: 'JIS Keyboard (Mikaka) encode — QWERTY to Japanese kana.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default JISKeyboardEncode;
