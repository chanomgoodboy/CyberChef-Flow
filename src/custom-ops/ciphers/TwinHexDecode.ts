import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Twin Hex Cipher Decode';

class TwinHexDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Recombines nibble pairs back into bytes. Reverse of Twin Hex Cipher Encode.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Nibble Separator', type: 'option', value: ['Dot', 'Dash', 'Space', 'Auto'] },
    ];
  }

  run(input: string, args: any[]): string {
    const nibSep = (args[0] as string) || 'Dot';

    // Split into byte groups
    const byteGroups = input.trim().split(/[\s,\n]+/).filter(Boolean);
    let result = '';

    for (const group of byteGroups) {
      let nibbles: string[];
      if (nibSep === 'Auto') {
        nibbles = group.split(/[.\-\s]/).filter(Boolean);
      } else {
        const ns = nibSep === 'Dot' ? '.' : nibSep === 'Dash' ? '-' : ' ';
        nibbles = group.split(ns).filter(Boolean);
      }

      if (nibbles.length === 2) {
        const hi = parseInt(nibbles[0], 16);
        const lo = parseInt(nibbles[1], 16);
        if (!isNaN(hi) && !isNaN(lo) && hi < 16 && lo < 16) {
          result += String.fromCharCode((hi << 4) | lo);
          continue;
        }
      }
      // If no separator, try as a 2-char hex byte
      if (nibbles.length === 1 && nibbles[0].length === 2) {
        const b = parseInt(nibbles[0], 16);
        if (!isNaN(b)) {
          result += String.fromCharCode(b);
          continue;
        }
      }
      result += '?';
    }
    return result;
  }
}

registerCustomOp(TwinHexDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Twin Hex Cipher decode — recombine nibble pairs to bytes.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Nibble Separator', type: 'option', value: ['Dot', 'Dash', 'Space', 'Auto'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default TwinHexDecode;
