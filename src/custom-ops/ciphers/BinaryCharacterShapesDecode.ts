import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { decodeLetter } from '../_lib/binaryFont';

const NAME = 'Binary Character Shapes Decode';

class BinaryCharacterShapesDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes 5×5 binary bitmap row values back to letters. ' +
      'Input: 5 numbers per letter (0-31), each group on a separate line.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    // Split by blank lines (letter separators) or collect groups of 5 numbers
    const lines = input.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    const allNums: number[] = [];
    for (const line of lines) {
      const nums = line.split(/\s+/).map(Number).filter((n) => !isNaN(n));
      allNums.push(...nums);
    }

    // Group into sets of 5
    let result = '';
    for (let i = 0; i + 4 < allNums.length; i += 5) {
      const rows = allNums.slice(i, i + 5);
      const letter = decodeLetter(rows);
      result += letter ?? '?';
    }
    return result;
  }
}

registerCustomOp(BinaryCharacterShapesDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Binary Character Shapes decode — bitmap row values to letters.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default BinaryCharacterShapesDecode;
