import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Route Cipher Encode';

type Route = 'Spiral clockwise' | 'Spiral counter-clockwise' | 'Snake by rows' | 'Snake by columns';

function readSpiral(grid: string[][], rows: number, cols: number, clockwise: boolean): string {
  let result = '';
  let top = 0, bottom = rows - 1, left = 0, right = cols - 1;

  while (top <= bottom && left <= right) {
    if (clockwise) {
      for (let c = left; c <= right; c++) result += grid[top][c] ?? '';
      top++;
      for (let r = top; r <= bottom; r++) result += grid[r][right] ?? '';
      right--;
      if (top <= bottom) {
        for (let c = right; c >= left; c--) result += grid[bottom][c] ?? '';
        bottom--;
      }
      if (left <= right) {
        for (let r = bottom; r >= top; r--) result += grid[r][left] ?? '';
        left++;
      }
    } else {
      for (let r = top; r <= bottom; r++) result += grid[r][left] ?? '';
      left++;
      for (let c = left; c <= right; c++) result += grid[bottom][c] ?? '';
      bottom--;
      if (left <= right) {
        for (let r = bottom; r >= top; r--) result += grid[r][right] ?? '';
        right--;
      }
      if (top <= bottom) {
        for (let c = right; c >= left; c--) result += grid[top][c] ?? '';
        top++;
      }
    }
  }
  return result;
}

function readSnakeRows(grid: string[][], rows: number, cols: number): string {
  let result = '';
  for (let r = 0; r < rows; r++) {
    if (r % 2 === 0) {
      for (let c = 0; c < cols; c++) result += grid[r][c] ?? '';
    } else {
      for (let c = cols - 1; c >= 0; c--) result += grid[r][c] ?? '';
    }
  }
  return result;
}

function readSnakeCols(grid: string[][], rows: number, cols: number): string {
  let result = '';
  for (let c = 0; c < cols; c++) {
    if (c % 2 === 0) {
      for (let r = 0; r < rows; r++) result += grid[r][c] ?? '';
    } else {
      for (let r = rows - 1; r >= 0; r--) result += grid[r][c] ?? '';
    }
  }
  return result;
}

class RouteCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Route cipher writes text into a grid and reads it off following a route (spiral or snake pattern).';
    this.infoURL = 'https://en.wikipedia.org/wiki/Transposition_cipher#Route_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Columns', type: 'number', value: 5 },
      { name: 'Route', type: 'option', value: ['Spiral clockwise', 'Spiral counter-clockwise', 'Snake by rows', 'Snake by columns'] },
      { name: 'Padding', type: 'string', value: 'X' },
    ];
  }

  run(input: string, args: any[]): string {
    const numCols = Math.max(1, (args[0] as number) || 5);
    const route = (args[1] as Route) || 'Spiral clockwise';
    const pad = (args[2] as string) || 'X';

    let text = input.toUpperCase().replace(/[^A-Z]/g, '');
    while (text.length % numCols !== 0) text += pad;
    const numRows = text.length / numCols;

    // Build grid
    const grid: string[][] = [];
    for (let r = 0; r < numRows; r++) {
      grid.push([...text.slice(r * numCols, (r + 1) * numCols)]);
    }

    switch (route) {
      case 'Spiral clockwise': return readSpiral(grid, numRows, numCols, true);
      case 'Spiral counter-clockwise': return readSpiral(grid, numRows, numCols, false);
      case 'Snake by rows': return readSnakeRows(grid, numRows, numCols);
      case 'Snake by columns': return readSnakeCols(grid, numRows, numCols);
      default: return readSpiral(grid, numRows, numCols, true);
    }
  }
}

registerCustomOp(RouteCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Route cipher encode — write into grid, read along a route.',
  infoURL: 'https://en.wikipedia.org/wiki/Transposition_cipher#Route_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Columns', type: 'number', value: 5 },
    { name: 'Route', type: 'option', value: ['Spiral clockwise', 'Spiral counter-clockwise', 'Snake by rows', 'Snake by columns'] },
    { name: 'Padding', type: 'string', value: 'X' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default RouteCipherEncode;
