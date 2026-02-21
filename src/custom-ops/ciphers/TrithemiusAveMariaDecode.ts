import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { AVE_MARIA_REVERSE } from '../_lib/aveMaria';

const NAME = 'Trithemius Ave Maria Decode';

class TrithemiusAveMariaDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes Trithemius Ave Maria cipher. Converts Latin prayer words back to letters.';
    this.infoURL = 'https://www.dcode.fr/trithemius-ave-maria';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    const parts = input.split(/\s*\/\s*/);
    const decoded: string[] = [];

    for (const part of parts) {
      const words = part.trim().split(/\s+/).filter(Boolean);
      let wordResult = '';
      for (const word of words) {
        const idx = AVE_MARIA_REVERSE[word.toLowerCase()];
        if (idx !== undefined) {
          wordResult += String.fromCharCode(65 + idx);
        }
      }
      decoded.push(wordResult);
    }

    return decoded.join(' ');
  }
}

registerCustomOp(TrithemiusAveMariaDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Trithemius Ave Maria decode — Latin prayer words to letters.',
  infoURL: 'https://www.dcode.fr/trithemius-ave-maria',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default TrithemiusAveMariaDecode;
