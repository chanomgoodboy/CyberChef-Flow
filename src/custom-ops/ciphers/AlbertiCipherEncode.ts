import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { ALPHABET, mod, keywordAlphabet } from '../_lib/alphabet';

const NAME = 'Alberti Cipher Encode';

class AlbertiCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The Alberti cipher uses a rotating cipher disk. The inner disk shifts by the step value after every N characters (the period).';
    this.infoURL = 'https://en.wikipedia.org/wiki/Alberti_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Keyword', type: 'string', value: '' },
      { name: 'Initial rotation', type: 'number', value: 0 },
      { name: 'Step', type: 'number', value: 1 },
      { name: 'Period', type: 'number', value: 1 },
    ];
  }

  run(input: string, args: any[]): string {
    const keyword = (args[0] as string) || '';
    const initRotation = (args[1] as number) ?? 0;
    const step = (args[2] as number) ?? 1;
    const period = Math.max(1, (args[3] as number) ?? 1);

    const innerAlpha = keyword ? keywordAlphabet(keyword) : ALPHABET;
    let rotation = initRotation;
    let letterCount = 0;
    let result = '';

    for (const ch of input) {
      const upper = ch.toUpperCase();
      const idx = ALPHABET.indexOf(upper);
      if (idx < 0) {
        result += ch;
        continue;
      }
      const shifted = mod(idx + rotation, 26);
      const outCh = innerAlpha[shifted];
      result += ch === upper ? outCh : outCh.toLowerCase();
      letterCount++;
      if (letterCount % period === 0) {
        rotation = mod(rotation + step, 26);
      }
    }
    return result;
  }
}

registerCustomOp(AlbertiCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Alberti cipher encode — rotating cipher disk with periodic step.',
  infoURL: 'https://en.wikipedia.org/wiki/Alberti_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Keyword', type: 'string', value: '' },
    { name: 'Initial rotation', type: 'number', value: 0 },
    { name: 'Step', type: 'number', value: 1 },
    { name: 'Period', type: 'number', value: 1 },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default AlbertiCipherEncode;
