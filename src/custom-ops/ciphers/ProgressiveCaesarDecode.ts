import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { ALPHABET, mod } from '../_lib/alphabet';

const NAME = 'Progressive Caesar Decode';

class ProgressiveCaesarDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes Progressive Caesar cipher by subtracting the incrementing shift.';
    this.infoURL = 'https://www.dcode.fr/progressive-caesar-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Initial shift', type: 'number', value: 1 },
      { name: 'Step', type: 'number', value: 1 },
    ];
  }

  run(input: string, args: any[]): string {
    let shift = (args[0] as number) ?? 1;
    const step = (args[1] as number) ?? 1;
    let result = '';

    for (const ch of input) {
      const upper = ch.toUpperCase();
      const idx = ALPHABET.indexOf(upper);
      if (idx < 0) {
        result += ch;
        continue;
      }
      const outIdx = mod(idx - shift, 26);
      const outCh = ALPHABET[outIdx];
      result += ch === upper ? outCh : outCh.toLowerCase();
      shift += step;
    }
    return result;
  }
}

registerCustomOp(ProgressiveCaesarDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Progressive Caesar decode — reverse incrementing Caesar shift.',
  infoURL: 'https://www.dcode.fr/progressive-caesar-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Initial shift', type: 'number', value: 1 },
    { name: 'Step', type: 'number', value: 1 },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default ProgressiveCaesarDecode;
