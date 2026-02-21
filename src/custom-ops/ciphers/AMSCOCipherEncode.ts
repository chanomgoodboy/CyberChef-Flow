import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { keyOrder } from '../_lib/transposition';

const NAME = 'AMSCO Cipher Encode';

class AMSCOCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'AMSCO cipher fills a grid with alternating single letters and digraphs, then reads columns in key order. The starting pattern alternates each row.';
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

    // Fill grid row by row with alternating 1/2 character cells
    const grid: string[][] = [];
    let pos = 0;
    let rowNum = 0;

    while (pos < text.length) {
      const row: string[] = [];
      for (let c = 0; c < numCols && pos < text.length; c++) {
        // Determine cell size: alternates based on (row+col) parity and start
        const cellSize = ((rowNum + c) % 2 === 0) ? (startWith) : (3 - startWith);
        const take = Math.min(cellSize, text.length - pos);
        row.push(text.slice(pos, pos + take));
        pos += take;
      }
      grid.push(row);
      rowNum++;
    }

    // Read columns in key order
    let result = '';
    for (const col of order) {
      for (let r = 0; r < grid.length; r++) {
        if (col < grid[r].length) {
          result += grid[r][col];
        }
      }
    }
    return result;
  }
}

registerCustomOp(AMSCOCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'AMSCO cipher encode — alternating single/digraph columnar transposition.',
  infoURL: 'https://www.dcode.fr/amsco-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Key', type: 'string', value: 'CARGO' },
    { name: 'Start with', type: 'option', value: ['Single (1)', 'Double (2)'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default AMSCOCipherEncode;
