import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { generatePolybiusSquare } from '../_lib/polybius';

const NAME = 'Monome-Dinome Decode';

class MonomeDinomeDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes Monome-Dinome cipher by converting 1/2-digit codes back to letters using the keyed Polybius grid.';
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

    const digits = input.replace(/[^0-9]/g, '');
    const colDigitSet = new Set([...colDigits]);
    const rowDigitSet = new Set([...rowDigits]);

    let result = '';
    let i = 0;
    while (i < digits.length) {
      const d = digits[i];

      // If this digit is a column digit (monome possibility), check if it could be a monome
      if (colDigitSet.has(d) && !rowDigitSet.has(d)) {
        // Definitely a monome
        const col = colDigits.indexOf(d);
        result += grid[monomeRow * 5 + col];
        i++;
      } else if (rowDigitSet.has(d) && !colDigitSet.has(d)) {
        // Definitely a row digit → dinome
        if (i + 1 < digits.length) {
          const row = rowDigits.indexOf(d);
          const col = colDigits.indexOf(digits[i + 1]);
          if (row >= 0 && col >= 0) {
            result += grid[row * 5 + col];
          }
          i += 2;
        } else {
          i++;
        }
      } else if (colDigitSet.has(d) && rowDigitSet.has(d)) {
        // Ambiguous — check if next digit is a column digit
        if (i + 1 < digits.length && colDigitSet.has(digits[i + 1])) {
          // Treat as dinome (row + col)
          const row = rowDigits.indexOf(d);
          const col = colDigits.indexOf(digits[i + 1]);
          if (row >= 0 && col >= 0) {
            result += grid[row * 5 + col];
          }
          i += 2;
        } else {
          // Treat as monome
          const col = colDigits.indexOf(d);
          result += grid[monomeRow * 5 + col];
          i++;
        }
      } else {
        i++;
      }
    }
    return result;
  }
}

registerCustomOp(MonomeDinomeDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Monome-Dinome decode — reverse 1/2-digit codes to letters.',
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

export default MonomeDinomeDecode;
