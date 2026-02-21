import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { keyOrder } from '../_lib/transposition';

const NAME = 'Redefence Cipher Decode';

class RedefenceCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes the Redefence cipher by reversing the keyed rail fence.';
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

    // Determine which rail each position belongs to
    const railAssignment: number[] = [];
    let rail = 0;
    let direction = 1;

    for (let i = 0; i < offset; i++) {
      rail += direction;
      if (rail >= numRails) { rail = numRails - 2; direction = -1; }
      if (rail < 0) { rail = 1; direction = 1; }
    }

    for (let i = 0; i < text.length; i++) {
      railAssignment.push(rail);
      rail += direction;
      if (rail >= numRails) { rail = numRails - 2; direction = -1; }
      if (rail < 0) { rail = 1; direction = 1; }
    }

    // Count characters per rail
    const railLengths = new Array(numRails).fill(0);
    for (const r of railAssignment) railLengths[r]++;

    // Distribute ciphertext to rails in key order
    const order = keyStr ? keyOrder(keyStr) : Array.from({ length: numRails }, (_, i) => i);
    const rails: string[] = new Array(numRails).fill('');
    let pos = 0;
    for (const idx of order) {
      if (idx < numRails) {
        rails[idx] = text.slice(pos, pos + railLengths[idx]);
        pos += railLengths[idx];
      }
    }

    // Read off by position
    const railPos = new Array(numRails).fill(0);
    let result = '';
    for (const r of railAssignment) {
      result += rails[r][railPos[r]] ?? '';
      railPos[r]++;
    }
    return result;
  }
}

registerCustomOp(RedefenceCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Redefence cipher decode — reverse keyed rail fence.',
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

export default RedefenceCipherDecode;
