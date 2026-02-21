import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { NAVAJO_REVERSE } from '../_lib/navajo';

const NAME = 'Navajo Code Decode';

class NavajoCodeDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes Navajo Code Talker words back to letters. ' +
      'Each Navajo word maps to a single letter.';
    this.infoURL = 'https://www.dcode.fr/navajo-code';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    const tokens = input.split(/\s+/).filter(Boolean);
    let result = '';
    for (const tok of tokens) {
      if (tok === '/') {
        result += ' ';
        continue;
      }
      const upper = tok.toUpperCase();
      const letter = NAVAJO_REVERSE[upper];
      if (letter) {
        result += letter;
      } else {
        result += tok;
      }
    }
    return result;
  }
}

registerCustomOp(NavajoCodeDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Navajo Code decode — Navajo Code Talker words back to letters.',
  infoURL: 'https://www.dcode.fr/navajo-code',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default NavajoCodeDecode;
