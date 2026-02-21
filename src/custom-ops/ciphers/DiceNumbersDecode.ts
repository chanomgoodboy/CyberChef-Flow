import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Dice Numbers Decode';

class DiceNumbersDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts Unicode dice face characters (⚀-⚅) back to digits 1-6.';
    this.infoURL = 'https://www.dcode.fr/dice-numbers';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    let result = '';
    for (const ch of input) {
      const cp = ch.codePointAt(0)!;
      if (cp >= 0x2680 && cp <= 0x2685) {
        result += String(cp - 0x2680 + 1);
      } else {
        result += ch;
      }
    }
    return result;
  }
}

registerCustomOp(DiceNumbersDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Dice Numbers decode — Unicode dice faces (⚀-⚅) back to digits.',
  infoURL: 'https://www.dcode.fr/dice-numbers',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default DiceNumbersDecode;
