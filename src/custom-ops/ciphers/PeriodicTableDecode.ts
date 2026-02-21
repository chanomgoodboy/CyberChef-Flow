import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { SYMBOL_MAP } from '../_lib/periodicTable';

const NAME = 'Periodic Table Cipher Decode';

class PeriodicTableDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts element symbols or atomic numbers back to letters. ' +
      'Symbols are concatenated. Numbers map: 1→A, 2→B, ...26→Z.';
    this.infoURL = 'https://www.dcode.fr/periodic-table-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Mode',
        type: 'option',
        value: ['Symbols to text', 'Numbers to letters'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const mode = (args[0] as string) || 'Symbols to text';

    if (mode === 'Numbers to letters') {
      const nums = input.split(/[\s,\-]+/).filter(Boolean).map(Number);
      return nums.map((n) => {
        if (n >= 1 && n <= 26) return String.fromCharCode(64 + n);
        return '?';
      }).join('');
    }

    // Symbols to text — split by dashes/spaces and look up each symbol
    const tokens = input.split(/[\s\-]+/).filter(Boolean);
    let result = '';
    for (const tok of tokens) {
      const upper = tok.toUpperCase();
      if (SYMBOL_MAP[upper]) {
        result += tok; // Element symbols are already the text
      } else {
        result += tok;
      }
    }
    return result;
  }
}

registerCustomOp(PeriodicTableDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Periodic Table Cipher decode — element symbols/numbers to text.',
  infoURL: 'https://www.dcode.fr/periodic-table-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Mode', type: 'option', value: ['Symbols to text', 'Numbers to letters'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default PeriodicTableDecode;
