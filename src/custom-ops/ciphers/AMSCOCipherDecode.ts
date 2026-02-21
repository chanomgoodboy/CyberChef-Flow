import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { keyOrder } from '../_lib/transposition';

const NAME = 'AMSCO Cipher Decode';

class AMSCOCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes AMSCO cipher by reversing the alternating single/digraph columnar transposition.';
    this.infoURL = 'https://www.dcode.fr/amsco-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Key', type: 'string', value: 'CARGO' },
      { name: 'Start with', type: 'option', value: ['Single (1)', 'Double (2)'] },
    ];
  }

  run(input: string, args: any[]): string {
    const key = (args[0] as string) || 'CARGO';
    const startWith = (args[1] as string)?.startsWith('Double') ? 2 : 1;
    const order = keyOrder(key);
    const numCols = order.length;
    if (numCols === 0) return input;

    const text = input.toUpperCase().replace(/[^A-Z]/g, '');
    if (!text) return '';

    // First pass: determine cell sizes for each position
    const cellSizes: number[][] = [];
    let remaining = text.length;
    let rowNum = 0;

    while (remaining > 0) {
      const row: number[] = [];
      for (let c = 0; c < numCols && remaining > 0; c++) {
        const cellSize = ((rowNum + c) % 2 === 0) ? startWith : (3 - startWith);
        const take = Math.min(cellSize, remaining);
        row.push(take);
        remaining -= take;
      }
      cellSizes.push(row);
      rowNum++;
    }

    const numRows = cellSizes.length;

    // Calculate how many characters go in each column (in key order)
    const colLengths: number[] = new Array(numCols).fill(0);
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < cellSizes[r].length; c++) {
        colLengths[c] += cellSizes[r][c];
      }
    }

    // Fill columns in key order
    const columns: string[] = new Array(numCols).fill('');
    let pos = 0;
    for (const col of order) {
      const len = colLengths[col];
      columns[col] = text.slice(pos, pos + len);
      pos += len;
    }

    // Read back row by row
    const colPos: number[] = new Array(numCols).fill(0);
    let result = '';
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < cellSizes[r].length; c++) {
        const take = cellSizes[r][c];
        result += columns[c].slice(colPos[c], colPos[c] + take);
        colPos[c] += take;
      }
    }
    return result;
  }
}

registerCustomOp(AMSCOCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'AMSCO cipher decode — reverse alternating single/digraph columnar transposition.',
  infoURL: 'https://www.dcode.fr/amsco-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Key', type: 'string', value: 'CARGO' },
    { name: 'Start with', type: 'option', value: ['Single (1)', 'Double (2)'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default AMSCOCipherDecode;
