import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'ASCII Control Characters Decode';

const NAME_TO_CODE: Record<string, number> = {
  NUL: 0, SOH: 1, STX: 2, ETX: 3, EOT: 4, ENQ: 5, ACK: 6, BEL: 7,
  BS: 8, HT: 9, LF: 10, VT: 11, FF: 12, CR: 13, SO: 14, SI: 15,
  DLE: 16, DC1: 17, DC2: 18, DC3: 19, DC4: 20, NAK: 21, SYN: 22,
  ETB: 23, CAN: 24, EM: 25, SUB: 26, ESC: 27, FS: 28, GS: 29,
  RS: 30, US: 31, DEL: 127, SP: 32,
};

class ASCIIControlDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts ASCII control character names (SOH, STX, etc.), caret notation (^A, ^B), ' +
      'or hex values (0x01) back to actual control characters.';
    this.infoURL = 'https://www.dcode.fr/ascii-code';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    const tokens = input.split(/\s+/).filter(Boolean);
    let result = '';
    for (const tok of tokens) {
      // Caret notation
      if (/^\^[A-Z?@\[\\\]^_]$/i.test(tok)) {
        const ch = tok[1].toUpperCase();
        if (ch === '?') {
          result += String.fromCharCode(127);
        } else {
          result += String.fromCharCode(ch.charCodeAt(0) - 64);
        }
        continue;
      }
      // Hex
      if (/^0x[0-9a-f]{1,2}$/i.test(tok)) {
        result += String.fromCharCode(parseInt(tok.slice(2), 16));
        continue;
      }
      // Abbreviation
      const code = NAME_TO_CODE[tok.toUpperCase()];
      if (code !== undefined) {
        result += String.fromCharCode(code);
        continue;
      }
      // Printable pass-through
      result += tok;
    }
    return result;
  }
}

registerCustomOp(ASCIIControlDecode, {
  name: NAME,
  module: 'Custom',
  description: 'ASCII Control Characters decode — names/caret/hex to control chars.',
  infoURL: 'https://www.dcode.fr/ascii-code',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default ASCIIControlDecode;
