import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Phone Keypad (Multi-tap) Encode';

/** Standard phone keypad mapping. */
const KEYPAD: Record<string, string> = {
  A: '2', B: '22', C: '222',
  D: '3', E: '33', F: '333',
  G: '4', H: '44', I: '444',
  J: '5', K: '55', L: '555',
  M: '6', N: '66', O: '666',
  P: '7', Q: '77', R: '777', S: '7777',
  T: '8', U: '88', V: '888',
  W: '9', X: '99', Y: '999', Z: '9999',
  ' ': '0',
};

class PhoneKeypadEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Encodes text using phone keypad multi-tap encoding (ABC=2, DEF=3, etc.). Letters on the same key are separated by a configurable delimiter.';
    this.infoURL = 'https://www.dcode.fr/phone-keypad-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Separator', type: 'string', value: ' ' },
    ];
  }

  run(input: string, args: any[]): string {
    const sep = (args[0] as string) ?? ' ';
    const upper = input.toUpperCase();
    const parts: string[] = [];
    for (const ch of upper) {
      if (KEYPAD[ch] !== undefined) {
        parts.push(KEYPAD[ch]);
      }
    }
    return parts.join(sep);
  }
}

registerCustomOp(PhoneKeypadEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Phone keypad multi-tap encode — letters to key presses.',
  infoURL: 'https://www.dcode.fr/phone-keypad-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Separator', type: 'string', value: ' ' }],
  flowControl: false,
}, 'Classical Ciphers');

export { KEYPAD };
export default PhoneKeypadEncode;
