import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Scytale Cipher Decode';

class ScytaleCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes text encrypted with the Scytale cipher by reversing the columnar read-off.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Scytale';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Circumference', type: 'number', value: 4, min: 2 },
    ];
  }

  run(input: string, args: any[]): string {
    const circ = Math.max(2, (args[0] as number) || 4);
    const numCols = circ;
    const numRows = Math.ceil(input.length / numCols);
    const emptyCells = numRows * numCols - input.length;

    // First (numCols - emptyCells) columns have numRows chars, rest have (numRows - 1)
    const colLengths: number[] = [];
    for (let c = 0; c < numCols; c++) {
      colLengths.push(c < numCols - emptyCells ? numRows : numRows - 1);
    }

    // Split ciphertext into columns
    const columns: string[] = [];
    let pos = 0;
    for (let c = 0; c < numCols; c++) {
      columns.push(input.slice(pos, pos + colLengths[c]));
      pos += colLengths[c];
    }

    // Read row by row
    let result = '';
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        if (r < columns[c].length) {
          result += columns[c][r];
        }
      }
    }
    return result;
  }
}

registerCustomOp(ScytaleCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Scytale cipher decode — unwrap text from a cylinder.',
  infoURL: 'https://en.wikipedia.org/wiki/Scytale',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Circumference', type: 'number', value: 4, min: 2 }],
  flowControl: false,
}, 'Classical Ciphers');

export default ScytaleCipherDecode;
