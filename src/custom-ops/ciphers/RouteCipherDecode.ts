import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Route Cipher Decode';

type Route = 'Spiral clockwise' | 'Spiral counter-clockwise' | 'Snake by rows' | 'Snake by columns';

function getSpiralOrder(rows: number, cols: number, clockwise: boolean): [number, number][] {
  const order: [number, number][] = [];
  let top = 0, bottom = rows - 1, left = 0, right = cols - 1;

  while (top <= bottom && left <= right) {
    if (clockwise) {
      for (let c = left; c <= right; c++) order.push([top, c]);
      top++;
      for (let r = top; r <= bottom; r++) order.push([r, right]);
      right--;
      if (top <= bottom) { for (let c = right; c >= left; c--) order.push([bottom, c]); bottom--; }
      if (left <= right) { for (let r = bottom; r >= top; r--) order.push([r, left]); left++; }
    } else {
      for (let r = top; r <= bottom; r++) order.push([r, left]);
      left++;
      for (let c = left; c <= right; c++) order.push([bottom, c]);
      bottom--;
      if (left <= right) { for (let r = bottom; r >= top; r--) order.push([r, right]); right--; }
      if (top <= bottom) { for (let c = right; c >= left; c--) order.push([top, c]); top++; }
    }
  }
  return order;
}

function getSnakeRowOrder(rows: number, cols: number): [number, number][] {
  const order: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    if (r % 2 === 0) { for (let c = 0; c < cols; c++) order.push([r, c]); }
    else { for (let c = cols - 1; c >= 0; c--) order.push([r, c]); }
  }
  return order;
}

function getSnakeColOrder(rows: number, cols: number): [number, number][] {
  const order: [number, number][] = [];
  for (let c = 0; c < cols; c++) {
    if (c % 2 === 0) { for (let r = 0; r < rows; r++) order.push([r, c]); }
    else { for (let r = rows - 1; r >= 0; r--) order.push([r, c]); }
  }
  return order;
}

class RouteCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes route cipher by placing ciphertext along the route back into the grid and reading rows.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Transposition_cipher#Route_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Columns', type: 'number', value: 5 },
      { name: 'Route', type: 'option', value: ['Spiral clockwise', 'Spiral counter-clockwise', 'Snake by rows', 'Snake by columns'] },
    ];
  }

  run(input: string, args: any[]): string {
    const numCols = Math.max(1, (args[0] as number) || 5);
    const route = (args[1] as Route) || 'Spiral clockwise';

    const text = input.toUpperCase().replace(/[^A-Z]/g, '');
    if (!text) return '';

    const numRows = Math.ceil(text.length / numCols);
    const totalCells = numRows * numCols;

    let order: [number, number][];
    switch (route) {
      case 'Spiral clockwise': order = getSpiralOrder(numRows, numCols, true); break;
      case 'Spiral counter-clockwise': order = getSpiralOrder(numRows, numCols, false); break;
      case 'Snake by rows': order = getSnakeRowOrder(numRows, numCols); break;
      case 'Snake by columns': order = getSnakeColOrder(numRows, numCols); break;
      default: order = getSpiralOrder(numRows, numCols, true);
    }

    // Place ciphertext along route
    const grid: string[][] = Array.from({ length: numRows }, () => new Array(numCols).fill(''));
    for (let i = 0; i < Math.min(text.length, order.length); i++) {
      const [r, c] = order[i];
      grid[r][c] = text[i];
    }

    // Read rows left to right
    let result = '';
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        result += grid[r][c];
      }
    }
    return result;
  }
}

registerCustomOp(RouteCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Route cipher decode — place along route, read rows.',
  infoURL: 'https://en.wikipedia.org/wiki/Transposition_cipher#Route_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Columns', type: 'number', value: 5 },
    { name: 'Route', type: 'option', value: ['Spiral clockwise', 'Spiral counter-clockwise', 'Snake by rows', 'Snake by columns'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default RouteCipherDecode;
