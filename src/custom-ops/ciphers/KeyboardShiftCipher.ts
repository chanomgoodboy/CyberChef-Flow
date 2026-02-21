import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { shiftKey, type KeyboardLayout } from '../_lib/keyboard';

const NAME = 'Keyboard Shift Cipher';

class KeyboardShiftCipher extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Shifts each character left or right on the keyboard by a given number of positions. Characters that would fall off the edge are left unchanged.';
    this.infoURL = 'https://www.dcode.fr/keyboard-shift-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Shift', type: 'number', value: 1 },
      { name: 'Layout', type: 'option', value: ['QWERTY', 'AZERTY', 'DVORAK'] },
    ];
  }

  run(input: string, args: any[]): string {
    const shift = (args[0] as number) ?? 1;
    const layout = (args[1] as KeyboardLayout) || 'QWERTY';
    let result = '';
    for (const ch of input) {
      result += shiftKey(ch, shift, layout);
    }
    return result;
  }
}

registerCustomOp(KeyboardShiftCipher, {
  name: NAME,
  module: 'Custom',
  description: 'Keyboard shift cipher — shift keys left/right on the keyboard.',
  infoURL: 'https://www.dcode.fr/keyboard-shift-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Shift', type: 'number', value: 1 },
    { name: 'Layout', type: 'option', value: ['QWERTY', 'AZERTY', 'DVORAK'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default KeyboardShiftCipher;
