import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Dice Numbers Encode';

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']; // U+2680-U+2685

class DiceNumbersEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts digits 1-6 to Unicode dice face characters (⚀-⚅). ' +
      'Can also decompose larger numbers into dice combinations.';
    this.infoURL = 'https://www.dcode.fr/dice-numbers';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Mode',
        type: 'option',
        value: ['Direct (1-6 only)', 'Decompose (any digit)'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const mode = (args[0] as string) || 'Direct (1-6 only)';
    const decompose = mode.startsWith('Decompose');

    let result = '';
    for (const ch of input) {
      const d = parseInt(ch, 10);
      if (!isNaN(d) && d >= 1 && d <= 6) {
        result += DICE_FACES[d - 1];
      } else if (decompose && !isNaN(d) && d >= 0 && d <= 9) {
        // Decompose: 0=nothing, 7=⚅⚀, 8=⚅⚁, 9=⚅⚂
        if (d === 0) {
          result += '(0)';
        } else if (d > 6) {
          result += DICE_FACES[5] + DICE_FACES[d - 7];
        }
      } else {
        result += ch;
      }
    }
    return result;
  }
}

registerCustomOp(DiceNumbersEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Dice Numbers encode — digits 1-6 to Unicode dice faces (⚀-⚅).',
  infoURL: 'https://www.dcode.fr/dice-numbers',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Mode', type: 'option', value: ['Direct (1-6 only)', 'Decompose (any digit)'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default DiceNumbersEncode;
