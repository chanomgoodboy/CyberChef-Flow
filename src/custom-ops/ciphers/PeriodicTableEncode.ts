import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { decomposeWord } from '../_lib/periodicTable';

const NAME = 'Periodic Table Cipher Encode';

class PeriodicTableEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Spells words using element symbols from the periodic table. ' +
      'Uses backtracking to find valid decompositions (e.g. BACON = Ba+C+O+N).';
    this.infoURL = 'https://www.dcode.fr/periodic-table-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Separator',
        type: 'option',
        value: ['None', 'Dash', 'Space'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const sepName = (args[0] as string) || 'None';
    const sep = sepName === 'Dash' ? '-' : sepName === 'Space' ? ' ' : '';

    const words = input.split(/\s+/);
    const results: string[] = [];
    for (const word of words) {
      if (!/^[A-Za-z]+$/.test(word)) { results.push(word); continue; }
      const decomposition = decomposeWord(word);
      if (decomposition) {
        results.push(decomposition.join(sep));
      } else {
        results.push(`[${word}]`); // Can't decompose
      }
    }
    return results.join(' ');
  }
}

registerCustomOp(PeriodicTableEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Periodic Table Cipher encode — spell words with element symbols.',
  infoURL: 'https://www.dcode.fr/periodic-table-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Separator', type: 'option', value: ['None', 'Dash', 'Space'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default PeriodicTableEncode;
