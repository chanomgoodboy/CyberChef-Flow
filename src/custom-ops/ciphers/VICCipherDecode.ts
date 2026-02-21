import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import {
  buildCheckerboard,
  checkerboardDecode,
  columnarUntranspose,
  keyToNumbers,
} from '../_lib/straddlingCheckerboard';

const NAME = 'VIC Cipher Decode';

class VICCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes text encrypted with the VIC cipher: reverses columnar transposition ' +
      'then decodes the straddling checkerboard substitution.';
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

    let digits = input.replace(/\s/g, '');

    if (transKey.trim()) {
      const key = keyToNumbers(transKey);
      digits = columnarUntranspose(digits, key);
    }

    const { decode } = buildCheckerboard(keyword, [b1, b2]);
    return checkerboardDecode(digits, decode, [b1, b2]);
  }
}

registerCustomOp(VICCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'VIC Cipher decode — reverse transposition + straddling checkerboard.',
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

export default VICCipherDecode;
