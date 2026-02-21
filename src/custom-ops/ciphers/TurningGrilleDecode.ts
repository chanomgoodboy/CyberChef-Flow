import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Turning Grille Decode';

function parseGrille(mask: string, size: number): boolean[][] {
  const grid: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const nums = mask.split(/[\s,]+/).map(Number).filter((n) => !isNaN(n));
  if (nums.length > 0 && nums.every((n) => n >= 0 && n < size * size)) {
    for (const n of nums) grid[Math.floor(n / size)][n % size] = true;
    return grid;
  }
  const bits = mask.replace(/[^01]/g, '');
  for (let i = 0; i < Math.min(bits.length, size * size); i++) {
    if (bits[i] === '1') grid[Math.floor(i / size)][i % size] = true;
  }
  return grid;
}

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

class TurningGrilleDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes turning grille cipher by reading through grille holes at each rotation.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Grille_(cryptography)';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Grid size', type: 'number', value: 4 },
      { name: 'Hole positions (0-indexed, comma-separated)', type: 'string', value: '0,1,2,5' },
    ];
  }

  run(input: string, args: any[]): string {
    const size = Math.max(2, (args[0] as number) || 4);
    const maskStr = (args[1] as string) || '0,1,2,5';

    const text = input.toUpperCase().replace(/[^A-Z]/g, '');
    if (!text) return '';

    // Fill grid from ciphertext
    const grid: string[][] = [];
    let pos = 0;
    for (let r = 0; r < size; r++) {
      const row: string[] = [];
      for (let c = 0; c < size; c++) {
        row.push(pos < text.length ? text[pos++] : '');
      }
      grid.push(row);
    }

    // Read through grille holes at each rotation
    let grille = parseGrille(maskStr, size);
    const used: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
    let result = '';

    for (let rotation = 0; rotation < 4; rotation++) {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (grille[r][c] && !used[r][c]) {
            result += grid[r][c];
            used[r][c] = true;
          }
        }
      }
      grille = rotateGrid(grille);
    }

    return result;
  }
}

registerCustomOp(TurningGrilleDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Turning grille decode — read through rotating grille holes.',
  infoURL: 'https://en.wikipedia.org/wiki/Grille_(cryptography)',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Grid size', type: 'number', value: 4 },
    { name: 'Hole positions (0-indexed, comma-separated)', type: 'string', value: '0,1,2,5' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default TurningGrilleDecode;
