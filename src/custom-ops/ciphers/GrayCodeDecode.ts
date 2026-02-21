import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Gray Code Decode';

function fromGray(gray: number): number {
  let n = gray;
  let mask = n >>> 1;
  while (mask !== 0) {
    n ^= mask;
    mask >>>= 1;
  }
  return n;
}

class GrayCodeDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decode Binary Reflected Gray Code back to original values. ' +
      'Uses iterative XOR to reverse the Gray encoding. ' +
      'In Text mode, decoded values are interpreted as character code points.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Gray_code';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Mode',
        type: 'option',
        value: ['Text', 'Numbers'],
      },
      {
        name: 'Separator',
        type: 'option',
        value: ['Space', 'Newline', 'Comma', 'None'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    if (!input) return '';
    const mode = (args[0] as string) || 'Text';
    const sepName = (args[1] as string) || 'Space';

    // Parse input as binary strings
    let sep: RegExp;
    if (sepName === 'None') {
      // When no separator, try to auto-detect groups by length
      // Fall back to splitting on whitespace/comma
      sep = /[\s,]+/;
    } else {
      sep = /[\s,]+/;
    }

    const parts = input.trim().split(sep).filter(Boolean);
    const values = parts.map(s => {
      const n = parseInt(s, 2);
      if (isNaN(n)) throw new Error(`Invalid binary string: "${s}"`);
      return fromGray(n);
    });

    if (mode === 'Numbers') {
      return values.join(' ');
    } else {
      // Text mode: interpret as code points
      return values.map(v => {
        if (v > 0 && v <= 0x10FFFF) {
          return String.fromCodePoint(v);
        }
        return '?';
      }).join('');
    }
  }
}

registerCustomOp(GrayCodeDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Gray Code decode — convert Binary Reflected Gray Code back to values.',
  infoURL: 'https://en.wikipedia.org/wiki/Gray_code',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Mode', type: 'option', value: ['Text', 'Numbers'] },
    { name: 'Separator', type: 'option', value: ['Space', 'Newline', 'Comma', 'None'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default GrayCodeDecode;
