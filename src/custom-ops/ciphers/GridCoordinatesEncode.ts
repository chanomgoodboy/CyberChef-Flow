import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Grid Coordinates Encode';

class GridCoordinatesEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Places text into an NxN grid and outputs coordinate references (row,col) for each character.';
    this.infoURL = 'https://www.dcode.fr/grid-coordinates';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Grid Size', type: 'number', value: 5 },
      { name: 'Row Label', type: 'option', value: ['Letters (A,B,...)', 'Numbers (1,2,...)'] },
      { name: 'Column Label', type: 'option', value: ['Numbers (1,2,...)', 'Letters (A,B,...)'] },
    ];
  }

  run(input: string, args: any[]): string {
    const gridSize = (args[0] as number) ?? 5;
    const rowLabel = (args[1] as string) || 'Letters (A,B,...)';
    const colLabel = (args[2] as string) || 'Numbers (1,2,...)';

    if (gridSize < 1 || gridSize > 26) return 'Error: Grid size must be 1-26';

    const clean = input.toUpperCase().replace(/[^A-Z]/g, '');
    const grid: string[][] = [];
    let idx = 0;

    for (let r = 0; r < gridSize; r++) {
      grid.push([]);
      for (let c = 0; c < gridSize; c++) {
        grid[r].push(idx < clean.length ? clean[idx++] : '');
      }
    }

    // Build position map
    const posMap: Record<string, string[]> = {};
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const ch = grid[r][c];
        if (!ch) continue;
        const rStr = rowLabel.startsWith('Letters') ? String.fromCharCode(65 + r) : String(r + 1);
        const cStr = colLabel.startsWith('Numbers') ? String(c + 1) : String.fromCharCode(65 + c);
        if (!posMap[ch]) posMap[ch] = [];
        posMap[ch].push(`${rStr}${cStr}`);
      }
    }

    // Encode: each character in original → its coordinate
    const coordIdx: Record<string, number> = {};
    const parts: string[] = [];
    for (const ch of input) {
      const upper = ch.toUpperCase();
      if (upper >= 'A' && upper <= 'Z' && posMap[upper]) {
        const ci = coordIdx[upper] ?? 0;
        parts.push(posMap[upper][ci % posMap[upper].length]);
        coordIdx[upper] = ci + 1;
      } else if (ch === ' ') {
        parts.push('/');
      }
    }
    return parts.join(' ');
  }
}

registerCustomOp(GridCoordinatesEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Grid Coordinates encode — text to grid position references.',
  infoURL: 'https://www.dcode.fr/grid-coordinates',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Grid Size', type: 'number', value: 5 },
    { name: 'Row Label', type: 'option', value: ['Letters (A,B,...)', 'Numbers (1,2,...)'] },
    { name: 'Column Label', type: 'option', value: ['Numbers (1,2,...)', 'Letters (A,B,...)'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default GridCoordinatesEncode;
