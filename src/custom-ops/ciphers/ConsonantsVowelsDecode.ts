import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Consonants/Vowels Rank Decode';

const VOWELS = 'AEIOU';
const CONSONANTS = 'BCDFGHJKLMNPQRSTVWXYZ';

class ConsonantsVowelsDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes V/C prefixed numbers back to letters. ' +
      'V1=A, V2=E, V3=I, V4=O, V5=U. C1=B, C2=C, C3=D, ...C21=Z.';
    this.infoURL = 'https://www.dcode.fr/consonant-vowel-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    const tokens = input.split(/[\s,]+/).filter(Boolean);
    let result = '';
    for (const tok of tokens) {
      if (tok === '/') { result += ' '; continue; }
      const match = tok.match(/^([VC])(\d+)$/i);
      if (match) {
        const type = match[1].toUpperCase();
        const num = parseInt(match[2], 10);
        if (type === 'V' && num >= 1 && num <= 5) {
          result += VOWELS[num - 1];
        } else if (type === 'C' && num >= 1 && num <= 21) {
          result += CONSONANTS[num - 1];
        } else {
          result += tok;
        }
      } else {
        result += tok;
      }
    }
    return result;
  }
}

registerCustomOp(ConsonantsVowelsDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Consonants/Vowels Rank decode — V/C numbers back to letters.',
  infoURL: 'https://www.dcode.fr/consonant-vowel-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default ConsonantsVowelsDecode;
