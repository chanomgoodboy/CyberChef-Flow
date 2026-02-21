import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { AVE_MARIA_TABLE } from '../_lib/aveMaria';

const NAME = 'Trithemius Ave Maria Encode';

class TrithemiusAveMariaEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encodes text using the Trithemius Ave Maria cipher. Each letter is replaced ' +
      'by a Latin word so the ciphertext reads like a prayer.';
    this.infoURL = 'https://www.dcode.fr/trithemius-ave-maria';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    const parts: string[] = [];
    for (const ch of input) {
      const code = ch.toUpperCase().charCodeAt(0);
      if (code >= 65 && code <= 90) {
        parts.push(AVE_MARIA_TABLE[code - 65]);
      } else if (ch === ' ') {
        parts.push('/');
      }
    }
    return parts.join(' ');
  }
}

registerCustomOp(TrithemiusAveMariaEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Trithemius Ave Maria encode — letters to Latin prayer words.',
  infoURL: 'https://www.dcode.fr/trithemius-ave-maria',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default TrithemiusAveMariaEncode;
