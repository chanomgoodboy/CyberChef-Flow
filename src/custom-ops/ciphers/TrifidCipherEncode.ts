import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { keywordAlphabet } from '../_lib/alphabet';

const NAME = 'Trifid Cipher Encode';

/** 27-char alphabet: A-Z + '.' (or '+') for the 3x3x3 cube. */
function buildCube(keyword: string): string {
  const base = keywordAlphabet(keyword);
  return base + '+'; // 27th character
}

function charToCoords(ch: string, cube: string): [number, number, number] | null {
  const idx = cube.indexOf(ch.toUpperCase());
  if (idx < 0) return null;
  const layer = Math.floor(idx / 9);
  const row = Math.floor((idx % 9) / 3);
  const col = idx % 3;
  return [layer, row, col];
}

function coordsToChar(l: number, r: number, c: number, cube: string): string {
  return cube[l * 9 + r * 3 + c];
}

class TrifidCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The Trifid cipher (Delastelle) uses a 3x3x3 cube for fractionation. Each letter becomes three coordinates, which are then transposed in groups and recombined.';
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

    // Filter to alphabet chars (+ our 27th char)
    const text = input.toUpperCase().replace(/[^A-Z+]/g, '');
    if (!text) return '';

    // Convert to coordinate triples
    const coords: [number, number, number][] = [];
    for (const ch of text) {
      const c = charToCoords(ch, cube);
      if (c) coords.push(c);
    }

    // Process in groups
    let result = '';
    for (let g = 0; g < coords.length; g += groupSize) {
      const group = coords.slice(g, g + groupSize);
      const layers: number[] = group.map((c) => c[0]);
      const rows: number[] = group.map((c) => c[1]);
      const cols: number[] = group.map((c) => c[2]);

      // Concatenate: layers + rows + cols
      const combined = [...layers, ...rows, ...cols];

      // Read off in triples
      for (let i = 0; i + 2 < combined.length; i += 3) {
        result += coordsToChar(combined[i], combined[i + 1], combined[i + 2], cube);
      }
    }
    return result;
  }
}

registerCustomOp(TrifidCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Trifid cipher encode — 3x3x3 cube fractionation + transposition.',
  infoURL: 'https://en.wikipedia.org/wiki/Trifid_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Keyword', type: 'string', value: '' },
    { name: 'Group size', type: 'number', value: 5 },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default TrifidCipherEncode;
