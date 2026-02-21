import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { generatePolybiusSquare, polybiusEncode, polybiusDecode } from '../_lib/polybius';

const NAME = 'Collon Cipher Encode';

class CollonCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The Collon cipher is similar to Bifid but processes 5-letter groups. Each letter is converted to Polybius coordinates, columns are taken first then rows, and recombined.';
    this.infoURL = 'https://www.dcode.fr/collon-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Keyword', type: 'string', value: 'CIPHER' },
      { name: 'Group size', type: 'number', value: 5 },
    ];
  }

  run(input: string, args: any[]): string {
    const keyword = (args[0] as string) || 'CIPHER';
    const groupSize = Math.max(1, (args[1] as number) || 5);
    const grid = generatePolybiusSquare(keyword, 5, true);

    const text = input.toUpperCase().replace(/J/g, 'I').replace(/[^A-IK-Z]/g, '');
    if (!text) return '';

    // Convert to coordinates
    const coords: [number, number][] = [];
    for (const ch of text) {
      const c = polybiusEncode(ch, grid, 5, true);
      if (c) coords.push(c);
    }

    // Process in groups
    let result = '';
    for (let g = 0; g < coords.length; g += groupSize) {
      const group = coords.slice(g, g + groupSize);

      // Collon: columns first, then rows
      const cols = group.map((c) => c[1]);
      const rows = group.map((c) => c[0]);
      const combined = [...cols, ...rows];

      for (let i = 0; i + 1 < combined.length; i += 2) {
        result += polybiusDecode(combined[i], combined[i + 1], grid, 5);
      }
    }
    return result;
  }
}

registerCustomOp(CollonCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Collon cipher encode — Polybius coordinates, columns first, recombined.',
  infoURL: 'https://www.dcode.fr/collon-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Keyword', type: 'string', value: 'CIPHER' },
    { name: 'Group size', type: 'number', value: 5 },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default CollonCipherEncode;
