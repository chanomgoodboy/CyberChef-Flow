import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { encodeLetter, renderLetter } from '../_lib/binaryFont';

const NAME = 'Binary Character Shapes Encode';

class BinaryCharacterShapesEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encodes letters as 5×5 binary bitmaps. Each row is a decimal number (0-31). ' +
      'Output format can be numbers or visual bitmap.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Format', type: 'option', value: ['Numbers', 'Visual'] },
    ];
  }

  run(input: string, args: any[]): string {
    const format = (args[0] as string) || 'Numbers';
    const parts: string[] = [];

    for (const ch of input) {
      const upper = ch.toUpperCase();
      if (upper >= 'A' && upper <= 'Z') {
        if (format === 'Visual') {
          parts.push(renderLetter(upper));
        } else {
          const rows = encodeLetter(upper);
          if (rows) parts.push(rows.join(' '));
        }
      }
    }

    return parts.join(format === 'Visual' ? '\n\n' : '\n');
  }
}

registerCustomOp(BinaryCharacterShapesEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Binary Character Shapes encode — letters to 5×5 binary bitmaps.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Format', type: 'option', value: ['Numbers', 'Visual'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default BinaryCharacterShapesEncode;
