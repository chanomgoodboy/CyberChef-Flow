import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Turning Grille Encode';

/**
 * Parse a grille mask. Input is a comma-separated list of hole positions (0-indexed)
 * or a grid of 0/1 where 1 = hole.
 */
function parseGrille(mask: string, size: number): boolean[][] {
  const grid: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  // Try parsing as comma-separated positions
  const nums = mask.split(/[\s,]+/).map(Number).filter((n) => !isNaN(n));
  if (nums.length > 0 && nums.every((n) => n >= 0 && n < size * size)) {
    for (const n of nums) {
      grid[Math.floor(n / size)][n % size] = true;
    }
    return grid;
  }

  // Fallback: try parsing as binary grid
  const bits = mask.replace(/[^01]/g, '');
  for (let i = 0; i < Math.min(bits.length, size * size); i++) {
    if (bits[i] === '1') {
      grid[Math.floor(i / size)][i % size] = true;
    }
  }
  return grid;
}

/**
 * Rotate a square boolean grid 90 degrees clockwise.
 */
function rotateGrid(grid: boolean[][]): boolean[][] {
  const size = grid.length;
  const rotated: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      rotated[c][size - 1 - r] = grid[r][c];
    }
  }
  return rotated;
}

class TurningGrilleEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Turning grille cipher places letters through holes in a grille, rotating it 90 degrees four times to fill the grid, then reads the grid row by row.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Grille_(cryptography)';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Grid size', type: 'number', value: 4 },
      { name: 'Hole positions (0-indexed, comma-separated)', type: 'string', value: '0,1,2,5' },
      { name: 'Padding', type: 'string', value: 'X' },
    ];
  }

  run(input: string, args: any[]): string {
    const size = Math.max(2, (args[0] as number) || 4);
    const maskStr = (args[1] as string) || '0,1,2,5';
    const pad = (args[2] as string) || 'X';

    let text = input.toUpperCase().replace(/[^A-Z]/g, '');
    const cellCount = size * size;
    while (text.length < cellCount) text += pad;

    let grille = parseGrille(maskStr, size);
    const output: string[][] = Array.from({ length: size }, () => new Array(size).fill(''));

    let pos = 0;
    for (let rotation = 0; rotation < 4; rotation++) {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (grille[r][c] && !output[r][c] && pos < text.length) {
            output[r][c] = text[pos++];
          }
        }
      }
      grille = rotateGrid(grille);
    }

    // Fill any remaining empty cells
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!output[r][c]) output[r][c] = pos < text.length ? text[pos++] : pad;
      }
    }

    return output.map((row) => row.join('')).join('');
  }
}

registerCustomOp(TurningGrilleEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Turning grille encode — place letters through rotating grille holes.',
  infoURL: 'https://en.wikipedia.org/wiki/Grille_(cryptography)',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Grid size', type: 'number', value: 4 },
    { name: 'Hole positions (0-indexed, comma-separated)', type: 'string', value: '0,1,2,5' },
    { name: 'Padding', type: 'string', value: 'X' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default TurningGrilleEncode;
