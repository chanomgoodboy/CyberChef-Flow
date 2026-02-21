import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { keyOrder } from '../_lib/transposition';

const NAME = 'Redefence Cipher Encode';

class RedefenceCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Redefence cipher is a rail fence cipher where the rails are read off in a keyed order instead of top-to-bottom.';
    this.infoURL = 'https://www.dcode.fr/redefence-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Number of rails', type: 'number', value: 3 },
      { name: 'Key (rail order)', type: 'string', value: '213' },
      { name: 'Offset', type: 'number', value: 0 },
    ];
  }

  run(input: string, args: any[]): string {
    const numRails = Math.max(2, (args[0] as number) || 3);
    const keyStr = (args[1] as string) || '';
    const offset = (args[2] as number) || 0;
    const text = input;
    if (!text) return '';

    // Assign each character to a rail (rail fence pattern)
    const rails: string[] = new Array(numRails).fill('');
    let rail = 0;
    let direction = 1;

    // Apply offset
    for (let i = 0; i < offset; i++) {
      rail += direction;
      if (rail >= numRails) { rail = numRails - 2; direction = -1; }
      if (rail < 0) { rail = 1; direction = 1; }
    }

    for (const ch of text) {
      rails[rail] += ch;
      rail += direction;
      if (rail >= numRails) { rail = numRails - 2; direction = -1; }
      if (rail < 0) { rail = 1; direction = 1; }
    }

    // Read rails in key order
    const order = keyStr ? keyOrder(keyStr) : Array.from({ length: numRails }, (_, i) => i);
    let result = '';
    for (const idx of order) {
      if (idx < rails.length) result += rails[idx];
    }
    return result;
  }
}

registerCustomOp(RedefenceCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Redefence cipher encode — rail fence with keyed rail order.',
  infoURL: 'https://www.dcode.fr/redefence-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Number of rails', type: 'number', value: 3 },
    { name: 'Key (rail order)', type: 'string', value: '213' },
    { name: 'Offset', type: 'number', value: 0 },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default RedefenceCipherEncode;
