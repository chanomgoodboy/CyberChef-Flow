import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { convertLayout, type KeyboardLayout } from '../_lib/keyboard';

const NAME = 'Keyboard Change Cipher';

class KeyboardChangeCipher extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Reinterprets text as if typed on a different keyboard layout. For example, typing QWERTY keys on an AZERTY layout produces different characters.';
    this.infoURL = 'https://www.dcode.fr/keyboard-change-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'From layout', type: 'option', value: ['QWERTY', 'AZERTY', 'DVORAK'] },
      { name: 'To layout', type: 'option', value: ['AZERTY', 'QWERTY', 'DVORAK'] },
    ];
  }

  run(input: string, args: any[]): string {
    const from = (args[0] as KeyboardLayout) || 'QWERTY';
    const to = (args[1] as KeyboardLayout) || 'AZERTY';
    let result = '';
    for (const ch of input) {
      result += convertLayout(ch, from, to);
    }
    return result;
  }
}

registerCustomOp(KeyboardChangeCipher, {
  name: NAME,
  module: 'Custom',
  description: 'Keyboard change cipher — retype text from one keyboard layout to another.',
  infoURL: 'https://www.dcode.fr/keyboard-change-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'From layout', type: 'option', value: ['QWERTY', 'AZERTY', 'DVORAK'] },
    { name: 'To layout', type: 'option', value: ['AZERTY', 'QWERTY', 'DVORAK'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default KeyboardChangeCipher;
