import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Scytale Cipher Encode';

class ScytaleCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The Scytale cipher wraps a strip of text around a cylinder of a given circumference. Equivalent to a simple columnar transposition where the key is sequential.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Scytale';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Circumference', type: 'number', value: 4, min: 2 },
    ];
  }

  run(input: string, args: any[]): string {
    const circ = Math.max(2, (args[0] as number) || 4);
    // Write text in rows of `circ` chars, read columns
    const numCols = circ;
    const numRows = Math.ceil(input.length / numCols);

    let result = '';
    for (let c = 0; c < numCols; c++) {
      for (let r = 0; r < numRows; r++) {
        const idx = r * numCols + c;
        if (idx < input.length) {
          result += input[idx];
        }
      }
    }
    return result;
  }
}

registerCustomOp(ScytaleCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Scytale cipher encode — wrap text around a cylinder.',
  infoURL: 'https://en.wikipedia.org/wiki/Scytale',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Circumference', type: 'number', value: 4, min: 2 }],
  flowControl: false,
}, 'Classical Ciphers');

export default ScytaleCipherEncode;
