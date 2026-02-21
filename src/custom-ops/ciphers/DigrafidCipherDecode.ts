import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { generatePolybiusSquare, polybiusEncode, polybiusDecode } from '../_lib/polybius';

const NAME = 'Digrafid Cipher Decode';

class DigrafidCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes the Digrafid cipher by reversing the two-square fractionation.';
    this.infoURL = 'https://www.dcode.fr/digrafid-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Keyword 1', type: 'string', value: 'FIRST' },
      { name: 'Keyword 2', type: 'string', value: 'SECOND' },
      { name: 'Group size (pairs)', type: 'number', value: 3 },
    ];
  }

  run(input: string, args: any[]): string {
    const kw1 = (args[0] as string) || 'FIRST';
    const kw2 = (args[1] as string) || 'SECOND';
    const groupSize = Math.max(1, (args[2] as number) || 3);
    const grid1 = generatePolybiusSquare(kw1, 5, true);
    const grid2 = generatePolybiusSquare(kw2, 5, true);

    const text = input.toUpperCase().replace(/J/g, 'I').replace(/[^A-IK-Z]/g, '');
    if (!text) return '';

    let padded = text;
    if (padded.length % 2 !== 0) padded += 'X';

    // Get coordinate quads from ciphertext pairs
    const quads: [number, number, number, number][] = [];
    for (let i = 0; i < padded.length; i += 2) {
      const coord1 = polybiusEncode(padded[i], grid1, 5, true);
      const coord2 = polybiusEncode(padded[i + 1], grid2, 5, true);
      if (!coord1 || !coord2) continue;
      quads.push([coord1[0], coord1[1], coord2[0], coord2[1]]);
    }

    // Process in groups — reverse the transpose
    let result = '';
    for (let g = 0; g < quads.length; g += groupSize) {
      const group = quads.slice(g, g + groupSize);
      const n = group.length;

      // Flatten all coordinates
      const combined: number[] = [];
      for (const [a, b, c, d] of group) {
        combined.push(a, b, c, d);
      }
      // combined has 4n values, arranged as [r1_0,c1_0,r2_0,c2_0, r1_1,c1_1,r2_1,c2_1, ...]
      // The encode transposed as [all r1s, all c1s, all r2s, all c2s]
      // So decode: split into 4 rows of n
      const r1s = combined.slice(0, n);
      const c1s = combined.slice(n, 2 * n);
      const r2s = combined.slice(2 * n, 3 * n);
      const c2s = combined.slice(3 * n, 4 * n);

      for (let i = 0; i < n; i++) {
        result += polybiusDecode(r1s[i], c1s[i], grid1, 5);
        result += polybiusDecode(r2s[i], c2s[i], grid2, 5);
      }
    }
    return result;
  }
}

registerCustomOp(DigrafidCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Digrafid cipher decode — reverse two-square fractionation.',
  infoURL: 'https://www.dcode.fr/digrafid-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Keyword 1', type: 'string', value: 'FIRST' },
    { name: 'Keyword 2', type: 'string', value: 'SECOND' },
    { name: 'Group size (pairs)', type: 'number', value: 3 },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default DigrafidCipherDecode;
