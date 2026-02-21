import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import {
  buildCheckerboard,
  checkerboardEncode,
  columnarTranspose,
  keyToNumbers,
} from '../_lib/straddlingCheckerboard';

const NAME = 'VIC Cipher Encode';

class VICCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encodes text using a simplified VIC cipher: straddling checkerboard substitution ' +
      'followed by columnar transposition. The full VIC cipher uses chain addition for key ' +
      'derivation, but this implementation exposes the parameters directly.';
    this.infoURL = 'https://www.dcode.fr/vic-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Keyword (checkerboard)',
        type: 'string',
        value: 'ASINTOER',
      },
      {
        name: 'Blank columns (2 digits)',
        type: 'string',
        value: '26',
      },
      {
        name: 'Transposition key',
        type: 'string',
        value: 'SECRET',
      },
    ];
  }

  run(input: string, args: any[]): string {
    const keyword = (args[0] as string) || 'ASINTOER';
    const blanksStr = (args[1] as string) || '26';
    const transKey = typeof args[2] === 'string' ? args[2] : 'SECRET';

    const b1 = parseInt(blanksStr[0], 10);
    const b2 = parseInt(blanksStr[1], 10);
    if (isNaN(b1) || isNaN(b2) || b1 === b2) {
      return 'Error: Blank columns must be 2 different digits';
    }

    const { encode } = buildCheckerboard(keyword, [b1, b2]);
    const substituted = checkerboardEncode(input, encode);

    if (!transKey.trim()) return substituted;

    const key = keyToNumbers(transKey);
    return columnarTranspose(substituted, key);
  }
}

registerCustomOp(VICCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'VIC Cipher encode — straddling checkerboard + columnar transposition.',
  infoURL: 'https://www.dcode.fr/vic-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Keyword (checkerboard)', type: 'string', value: 'ASINTOER' },
    { name: 'Blank columns (2 digits)', type: 'string', value: '26' },
    { name: 'Transposition key', type: 'string', value: 'SECRET' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default VICCipherEncode;
