import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Consonants/Vowels Rank Encode';

const VOWELS = 'AEIOU';
const CONSONANTS = 'BCDFGHJKLMNPQRSTVWXYZ';

class ConsonantsVowelsEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Numbers vowels and consonants separately. ' +
      'Vowels: A=1, E=2, I=3, O=4, U=5. ' +
      'Consonants: B=1, C=2, D=3, ...Z=21. Output: V1 C2 C3...';
    this.infoURL = 'https://www.dcode.fr/consonant-vowel-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Separator',
        type: 'option',
        value: ['Space', 'Comma', 'None'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const sepName = (args[0] as string) || 'Space';
    const sep = sepName === 'Comma' ? ',' : sepName === 'None' ? '' : ' ';

    const parts: string[] = [];
    for (const ch of input) {
      const upper = ch.toUpperCase();
      const vi = VOWELS.indexOf(upper);
      if (vi >= 0) {
        parts.push(`V${vi + 1}`);
      } else {
        const ci = CONSONANTS.indexOf(upper);
        if (ci >= 0) {
          parts.push(`C${ci + 1}`);
        } else if (ch === ' ') {
          parts.push('/');
        }
      }
    }
    return parts.join(sep);
  }
}

registerCustomOp(ConsonantsVowelsEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Consonants/Vowels Rank encode — separate numbering for vowels and consonants.',
  infoURL: 'https://www.dcode.fr/consonant-vowel-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'None'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default ConsonantsVowelsEncode;
