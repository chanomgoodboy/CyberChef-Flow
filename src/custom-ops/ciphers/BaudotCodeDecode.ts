import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { baudotDecode } from '../_lib/baudot';

const NAME = 'Baudot Code Decode';

class BaudotCodeDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decode Baudot/ITA2 5-bit teleprinter codes back to text. ' +
      'Interprets space-separated 5-bit values with automatic LTRS/FIGS shift tracking.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Baudot_code';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Input Format',
        type: 'option',
        value: ['Binary', 'Decimal', 'Hex'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    if (!input) return '';
    const format = (args[0] as string) || 'Binary';
    return baudotDecode(input, format);
  }
}

registerCustomOp(BaudotCodeDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Baudot/ITA2 decode — convert 5-bit teleprinter codes back to text.',
  infoURL: 'https://en.wikipedia.org/wiki/Baudot_code',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Input Format', type: 'option', value: ['Binary', 'Decimal', 'Hex'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default BaudotCodeDecode;
