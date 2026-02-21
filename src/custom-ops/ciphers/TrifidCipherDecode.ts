import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { keywordAlphabet } from '../_lib/alphabet';

const NAME = 'Trifid Cipher Decode';

function buildCube(keyword: string): string {
  return keywordAlphabet(keyword) + '+';
}

function charToCoords(ch: string, cube: string): [number, number, number] | null {
  const idx = cube.indexOf(ch.toUpperCase());
  if (idx < 0) return null;
  return [Math.floor(idx / 9), Math.floor((idx % 9) / 3), idx % 3];
}

function coordsToChar(l: number, r: number, c: number, cube: string): string {
  return cube[l * 9 + r * 3 + c];
}

class TrifidCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes the Trifid cipher by reversing the 3x3x3 cube fractionation.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Trifid_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Keyword', type: 'string', value: '' },
      { name: 'Group size', type: 'number', value: 5 },
    ];
  }

  run(input: string, args: any[]): string {
    const keyword = (args[0] as string) || '';
    const groupSize = Math.max(1, (args[1] as number) || 5);
    const cube = buildCube(keyword);

    const text = input.toUpperCase().replace(/[^A-Z+]/g, '');
    if (!text) return '';

    const coords: [number, number, number][] = [];
    for (const ch of text) {
      const c = charToCoords(ch, cube);
      if (c) coords.push(c);
    }

    let result = '';
    for (let g = 0; g < coords.length; g += groupSize) {
      const group = coords.slice(g, g + groupSize);
      const n = group.length;

      // Flatten the group coordinates into a single stream
      const combined: number[] = [];
      for (const [l, r, c] of group) {
        combined.push(l, r, c);
      }
      // combined has 3*n values
      // Reverse: split into 3 rows of n values each (layers, rows, cols)
      const layers = combined.slice(0, n);
      const rows = combined.slice(n, 2 * n);
      const cols = combined.slice(2 * n, 3 * n);

      for (let i = 0; i < n; i++) {
        result += coordsToChar(layers[i], rows[i], cols[i], cube);
      }
    }
    return result;
  }
}

registerCustomOp(TrifidCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Trifid cipher decode — reverse 3x3x3 cube fractionation.',
  infoURL: 'https://en.wikipedia.org/wiki/Trifid_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Keyword', type: 'string', value: '' },
    { name: 'Group size', type: 'number', value: 5 },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default TrifidCipherDecode;
