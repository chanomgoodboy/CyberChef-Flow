import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { baudotEncode } from '../_lib/baudot';

const NAME = 'Baudot Code Encode';

class BaudotCodeEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encode text to Baudot/ITA2 5-bit teleprinter code. ' +
      'Each character is converted to a 5-bit binary value, with automatic LTRS/FIGS shift insertion. ' +
      'Used historically in teleprinters and teletypewriters.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Baudot_code';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Output Format',
        type: 'option',
        value: ['Binary', 'Decimal', 'Hex'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    if (!input) return '';
    const format = (args[0] as string) || 'Binary';
    return baudotEncode(input, format);
  }
}

registerCustomOp(BaudotCodeEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Baudot/ITA2 encode — convert text to 5-bit teleprinter codes.',
  infoURL: 'https://en.wikipedia.org/wiki/Baudot_code',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Output Format', type: 'option', value: ['Binary', 'Decimal', 'Hex'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default BaudotCodeEncode;
