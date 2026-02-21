import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'ROT1 Cipher';

class ROT1Cipher extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'ROT1 shifts each letter by exactly 1 position in the alphabet. ' +
      'Encode: A→B, B→C, ... Z→A. Decode: B→A, C→B, ... A→Z.';
    this.infoURL = 'https://www.dcode.fr/rot-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Direction',
        type: 'option',
        value: ['Encode', 'Decode'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const direction = (args[0] as string) || 'Encode';
    const shift = direction === 'Decode' ? -1 : 1;

    let result = '';
    for (const ch of input) {
      const c = ch.charCodeAt(0);
      if (c >= 65 && c <= 90) {
        result += String.fromCharCode(((c - 65 + shift + 26) % 26) + 65);
      } else if (c >= 97 && c <= 122) {
        result += String.fromCharCode(((c - 97 + shift + 26) % 26) + 97);
      } else {
        result += ch;
      }
    }
    return result;
  }
}

registerCustomOp(ROT1Cipher, {
  name: NAME,
  module: 'Custom',
  description: 'ROT1 — shift each letter by 1 position.',
  infoURL: 'https://www.dcode.fr/rot-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Direction', type: 'option', value: ['Encode', 'Decode'] }],
  flowControl: false,
}, 'Classical Ciphers');

export default ROT1Cipher;
