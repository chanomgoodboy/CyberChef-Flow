import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Letter Position Encode';

class LetterPositionEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts each letter to its position in the alphabet (A=1, B=2, ...Z=26). ' +
      'Non-alphabetic characters can be kept or removed.';
    this.infoURL = 'https://www.dcode.fr/letter-number-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Separator',
        type: 'option',
        value: ['Space', 'Comma', 'Dash', 'None'],
      },
      {
        name: 'Keep non-alpha',
        type: 'boolean',
        value: true,
      },
    ];
  }

  run(input: string, args: any[]): string {
    const sepName = (args[0] as string) || 'Space';
    const keepNonAlpha = args[1] !== false;
    const sep = sepName === 'Comma' ? ',' : sepName === 'Dash' ? '-' : sepName === 'None' ? '' : ' ';

    const parts: string[] = [];
    for (const ch of input) {
      const upper = ch.toUpperCase();
      const code = upper.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        parts.push(String(code - 64));
      } else if (keepNonAlpha) {
        // Flush with separator between numbers, then insert non-alpha char
        if (ch === ' ' && sep === ' ') {
          parts.push(' ');
        } else {
          parts.push(ch);
        }
      }
    }
    // Join numeric parts with separator, preserving non-alpha chars
    let result = '';
    let prevWasNum = false;
    for (const p of parts) {
      const isNum = /^\d+$/.test(p);
      if (isNum && prevWasNum && sep) {
        result += sep;
      }
      result += p;
      prevWasNum = isNum;
    }
    return result;
  }
}

registerCustomOp(LetterPositionEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Letter Position encode — letters to alphabet positions (A=1...Z=26).',
  infoURL: 'https://www.dcode.fr/letter-number-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'Dash', 'None'] },
    { name: 'Keep non-alpha', type: 'boolean', value: true },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default LetterPositionEncode;
