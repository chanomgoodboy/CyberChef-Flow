import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Grid Coordinates Decode';

class GridCoordinatesDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes grid coordinate references back to text using the original text to build the grid.';
    this.infoURL = 'https://www.dcode.fr/grid-coordinates';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Grid Text', type: 'string', value: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
      { name: 'Grid Size', type: 'number', value: 5 },
      { name: 'Row Label', type: 'option', value: ['Letters (A,B,...)', 'Numbers (1,2,...)'] },
      { name: 'Column Label', type: 'option', value: ['Numbers (1,2,...)', 'Letters (A,B,...)'] },
    ];
  }

  run(input: string, args: any[]): string {
    const gridText = ((args[0] as string) || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ').toUpperCase().replace(/[^A-Z]/g, '');
    const gridSize = (args[1] as number) ?? 5;
    const rowLabel = (args[2] as string) || 'Letters (A,B,...)';
    const colLabel = (args[3] as string) || 'Numbers (1,2,...)';

    // Build grid from gridText
    const grid: string[][] = [];
    let idx = 0;
    for (let r = 0; r < gridSize; r++) {
      grid.push([]);
      for (let c = 0; c < gridSize; c++) {
        grid[r].push(idx < gridText.length ? gridText[idx++] : '');
      }
    }

    const groups = input.trim().split(/\s*\/\s*/);
    const decoded: string[] = [];

    for (const group of groups) {
      const coords = group.trim().split(/\s+/).filter(Boolean);
      let word = '';
      for (const coord of coords) {
        let r = -1, c = -1;
        if (coord.length >= 2) {
          if (rowLabel.startsWith('Letters') && colLabel.startsWith('Numbers')) {
            r = coord.charCodeAt(0) - 65;
            c = parseInt(coord.slice(1), 10) - 1;
          } else if (rowLabel.startsWith('Numbers') && colLabel.startsWith('Letters')) {
            r = parseInt(coord.slice(0, -1), 10) - 1;
            c = coord.charCodeAt(coord.length - 1) - 65;
          } else if (rowLabel.startsWith('Letters') && colLabel.startsWith('Letters')) {
            r = coord.charCodeAt(0) - 65;
            c = coord.charCodeAt(1) - 65;
          } else {
            // Both numbers — assume first digit is row, rest is col
            r = parseInt(coord[0], 10) - 1;
            c = parseInt(coord.slice(1), 10) - 1;
          }
        }

        if (r >= 0 && r < gridSize && c >= 0 && c < gridSize && grid[r][c]) {
          word += grid[r][c];
        } else {
          word += '?';
        }
      }
      decoded.push(word);
    }
    return decoded.join(' ');
  }
}

registerCustomOp(GridCoordinatesDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Grid Coordinates decode — coordinate references to text.',
  infoURL: 'https://www.dcode.fr/grid-coordinates',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Grid Text', type: 'string', value: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
    { name: 'Grid Size', type: 'number', value: 5 },
    { name: 'Row Label', type: 'option', value: ['Letters (A,B,...)', 'Numbers (1,2,...)'] },
    { name: 'Column Label', type: 'option', value: ['Numbers (1,2,...)', 'Letters (A,B,...)'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default GridCoordinatesDecode;
