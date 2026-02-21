import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Phone Keypad (Multi-tap) Decode';

/** Reverse mapping: digit sequences → letters. */
const KEYPAD_REVERSE: Record<string, string> = {
  '2': 'A', '22': 'B', '222': 'C',
  '3': 'D', '33': 'E', '333': 'F',
  '4': 'G', '44': 'H', '444': 'I',
  '5': 'J', '55': 'K', '555': 'L',
  '6': 'M', '66': 'N', '666': 'O',
  '7': 'P', '77': 'Q', '777': 'R', '7777': 'S',
  '8': 'T', '88': 'U', '888': 'V',
  '9': 'W', '99': 'X', '999': 'Y', '9999': 'Z',
  '0': ' ',
};

/** Max presses per digit key (7 and 9 have 4 letters, others have 3). */
const KEY_MAX: Record<string, number> = {
  '2': 3, '3': 3, '4': 3, '5': 3, '6': 3,
  '7': 4, '8': 3, '9': 4, '0': 1,
};

class PhoneKeypadDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes phone keypad multi-tap encoding back to text.';
    this.infoURL = 'https://www.dcode.fr/phone-keypad-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Separator', type: 'string', value: ' ' },
    ];
  }

  run(input: string, args: any[]): string {
    const sep = (args[0] as string) ?? ' ';
    if (!sep) {
      // No separator: group consecutive same digits, splitting at max key length
      let result = '';
      let i = 0;
      while (i < input.length) {
        const digit = input[i];
        const max = KEY_MAX[digit] ?? 1;
        let count = 1;
        while (i + 1 < input.length && input[i + 1] === digit) {
          i++;
          count++;
        }
        // Split into groups of max length
        while (count > 0) {
          const chunk = Math.min(count, max);
          result += KEYPAD_REVERSE[digit.repeat(chunk)] ?? '';
          count -= chunk;
        }
        i++;
      }
      return result;
    }
    return input
      .split(sep)
      .map((code) => KEYPAD_REVERSE[code] ?? '')
      .join('');
  }
}

registerCustomOp(PhoneKeypadDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Phone keypad multi-tap decode — key presses to letters.',
  infoURL: 'https://www.dcode.fr/phone-keypad-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Separator', type: 'string', value: ' ' }],
  flowControl: false,
}, 'Classical Ciphers');

export default PhoneKeypadDecode;
