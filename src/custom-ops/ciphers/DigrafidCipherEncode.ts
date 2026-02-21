import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { generatePolybiusSquare, polybiusEncode, polybiusDecode } from '../_lib/polybius';

const NAME = 'Digrafid Cipher Encode';

class DigrafidCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The Digrafid cipher uses two 5x5 Polybius squares. Each pair of letters produces 4 coordinates which are transposed in groups and recombined.';
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

    // Pad to even length
    let padded = text;
    if (padded.length % 2 !== 0) padded += 'X';

    // For each pair, get 4 coordinates: (r1, c1) from grid1 and (r2, c2) from grid2
    const quads: [number, number, number, number][] = [];
    for (let i = 0; i < padded.length; i += 2) {
      const coord1 = polybiusEncode(padded[i], grid1, 5, true);
      const coord2 = polybiusEncode(padded[i + 1], grid2, 5, true);
      if (!coord1 || !coord2) continue;
      quads.push([coord1[0], coord1[1], coord2[0], coord2[1]]);
    }

    // Process in groups of pairs
    let result = '';
    for (let g = 0; g < quads.length; g += groupSize) {
      const group = quads.slice(g, g + groupSize);
      const n = group.length;
      // Transpose: take all r1s, then all c1s, then all r2s, then all c2s
      const r1s = group.map((q) => q[0]);
      const c1s = group.map((q) => q[1]);
      const r2s = group.map((q) => q[2]);
      const c2s = group.map((q) => q[3]);
      const combined = [...r1s, ...c1s, ...r2s, ...c2s];

      // Recombine in groups of 4
      for (let i = 0; i + 3 < combined.length; i += 4) {
        result += polybiusDecode(combined[i], combined[i + 1], grid1, 5);
        result += polybiusDecode(combined[i + 2], combined[i + 3], grid2, 5);
      }
    }
    return result;
  }
}

registerCustomOp(DigrafidCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Digrafid cipher encode — two Polybius squares with 4-value fractionation.',
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

export default DigrafidCipherEncode;
