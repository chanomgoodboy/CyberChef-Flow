import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { ALPHABET, mod, keywordAlphabet } from '../_lib/alphabet';

const NAME = 'Alberti Cipher Decode';

class AlbertiCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes the Alberti cipher by reversing the rotating cipher disk.';
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
      const pos = innerAlpha.indexOf(upper);
      if (pos < 0) {
        result += ch;
        continue;
      }
      const outIdx = mod(pos - rotation, 26);
      const outCh = ALPHABET[outIdx];
      result += ch === upper ? outCh : outCh.toLowerCase();
      letterCount++;
      if (letterCount % period === 0) {
        rotation = mod(rotation + step, 26);
      }
    }
    return result;
  }
}

registerCustomOp(AlbertiCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Alberti cipher decode — reverse rotating cipher disk.',
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

export default AlbertiCipherDecode;
