import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { generatePolybiusSquare } from '../_lib/polybius';

const NAME = 'Monome-Dinome Encode';

class MonomeDinomeEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Monome-Dinome cipher encodes letters to 1 or 2 digit codes using a keyed Polybius grid. Letters in a designated row use 1 digit (monome), others use 2 digits (dinome).';
    this.infoURL = 'https://www.dcode.fr/monome-dinome-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Keyword', type: 'string', value: 'SECRET' },
      { name: 'Row digits', type: 'string', value: '12345' },
      { name: 'Column digits', type: 'string', value: '67890' },
      { name: 'Monome row (0-4)', type: 'number', value: 0 },
    ];
  }

  run(input: string, args: any[]): string {
    const keyword = (args[0] as string) || 'SECRET';
    const rowDigits = (args[1] as string) || '12345';
    const colDigits = (args[2] as string) || '67890';
    const monomeRow = (args[3] as number) ?? 0;
    const grid = generatePolybiusSquare(keyword, 5, true);

    const text = input.toUpperCase().replace(/J/g, 'I').replace(/[^A-IK-Z]/g, '');
    let result = '';

    for (const ch of text) {
      const idx = grid.indexOf(ch);
      if (idx < 0) continue;
      const row = Math.floor(idx / 5);
      const col = idx % 5;

      if (row === monomeRow) {
        // Monome: just the column digit
        result += colDigits[col] ?? col.toString();
      } else {
        // Dinome: row digit + column digit
        result += (rowDigits[row] ?? row.toString()) + (colDigits[col] ?? col.toString());
      }
    }
    return result;
  }
}

registerCustomOp(MonomeDinomeEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Monome-Dinome encode — 1 or 2 digit codes from keyed Polybius grid.',
  infoURL: 'https://www.dcode.fr/monome-dinome-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Keyword', type: 'string', value: 'SECRET' },
    { name: 'Row digits', type: 'string', value: '12345' },
    { name: 'Column digits', type: 'string', value: '67890' },
    { name: 'Monome row (0-4)', type: 'number', value: 0 },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default MonomeDinomeEncode;
