import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'ASCII Control Characters Encode';

const CTRL_NAMES: Record<number, string> = {
  0: 'NUL', 1: 'SOH', 2: 'STX', 3: 'ETX', 4: 'EOT', 5: 'ENQ', 6: 'ACK', 7: 'BEL',
  8: 'BS', 9: 'HT', 10: 'LF', 11: 'VT', 12: 'FF', 13: 'CR', 14: 'SO', 15: 'SI',
  16: 'DLE', 17: 'DC1', 18: 'DC2', 19: 'DC3', 20: 'DC4', 21: 'NAK', 22: 'SYN',
  23: 'ETB', 24: 'CAN', 25: 'EM', 26: 'SUB', 27: 'ESC', 28: 'FS', 29: 'GS',
  30: 'RS', 31: 'US', 127: 'DEL',
};

class ASCIIControlEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts control characters to their standard abbreviations (NUL, SOH, STX, ...) ' +
      'or caret notation (^@, ^A, ^B, ...). Printable chars pass through.';
    this.infoURL = 'https://www.dcode.fr/ascii-code';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Format',
        type: 'option',
        value: ['Abbreviation', 'Caret notation', 'Hex'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const format = (args[0] as string) || 'Abbreviation';
    const parts: string[] = [];

    for (let i = 0; i < input.length; i++) {
      const code = input.charCodeAt(i);
      if (code < 32 || code === 127) {
        if (format === 'Caret notation') {
          parts.push(code === 127 ? '^?' : '^' + String.fromCharCode(code + 64));
        } else if (format === 'Hex') {
          parts.push('0x' + code.toString(16).padStart(2, '0').toUpperCase());
        } else {
          parts.push(CTRL_NAMES[code] || `0x${code.toString(16).padStart(2, '0')}`);
        }
      } else {
        parts.push(input[i]);
      }
    }
    return parts.join(' ');
  }
}

registerCustomOp(ASCIIControlEncode, {
  name: NAME,
  module: 'Custom',
  description: 'ASCII Control Characters encode — control chars to names/caret/hex.',
  infoURL: 'https://www.dcode.fr/ascii-code',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Format', type: 'option', value: ['Abbreviation', 'Caret notation', 'Hex'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default ASCIIControlEncode;
