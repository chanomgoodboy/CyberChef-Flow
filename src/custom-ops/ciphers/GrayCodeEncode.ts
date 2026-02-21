import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Gray Code Encode';

function toGray(n: number): number {
  return n ^ (n >>> 1);
}

function toBinaryStr(n: number, width: number): string {
  return n.toString(2).padStart(width, '0');
}

function autoBitWidth(maxVal: number): number {
  if (maxVal <= 0) return 1;
  return Math.max(1, Math.ceil(Math.log2(maxVal + 1)));
}

class GrayCodeEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encode values to Binary Reflected Gray Code. In Gray code, consecutive values differ ' +
      'by exactly one bit. Formula: G = n XOR (n >> 1). ' +
      'In Numbers mode, input is decimal numbers. In Text mode, each character\'s code point is encoded.';
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
      {
        name: 'Bit Width',
        type: 'option',
        value: ['Auto', '8', '16', '32'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    if (!input) return '';
    const mode = (args[0] as string) || 'Text';
    const sepName = (args[1] as string) || 'Space';
    const widthStr = (args[2] as string) || 'Auto';

    const sep = sepName === 'Space' ? ' '
      : sepName === 'Newline' ? '\n'
      : sepName === 'Comma' ? ','
      : '';

    let values: number[];
    if (mode === 'Numbers') {
      values = input.trim().split(/[\s,]+/).filter(Boolean).map(s => {
        const n = parseInt(s, 10);
        if (isNaN(n) || n < 0) throw new Error(`Invalid non-negative integer: "${s}"`);
        return n;
      });
    } else {
      // Text mode: encode each character's code point
      values = [];
      for (const ch of input) {
        values.push(ch.codePointAt(0)!);
      }
    }

    if (values.length === 0) return '';

    let bitWidth: number;
    if (widthStr === 'Auto') {
      const maxVal = Math.max(...values);
      bitWidth = autoBitWidth(toGray(maxVal));
      // Also ensure width covers the largest gray code value
      for (const v of values) {
        const g = toGray(v);
        const needed = autoBitWidth(g);
        if (needed > bitWidth) bitWidth = needed;
      }
    } else {
      bitWidth = parseInt(widthStr, 10);
    }

    return values.map(v => toBinaryStr(toGray(v), bitWidth)).join(sep);
  }
}

registerCustomOp(GrayCodeEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Gray Code encode — convert values to Binary Reflected Gray Code.',
  infoURL: 'https://en.wikipedia.org/wiki/Gray_code',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Mode', type: 'option', value: ['Text', 'Numbers'] },
    { name: 'Separator', type: 'option', value: ['Space', 'Newline', 'Comma', 'None'] },
    { name: 'Bit Width', type: 'option', value: ['Auto', '8', '16', '32'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default GrayCodeEncode;
