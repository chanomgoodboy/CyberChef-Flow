import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Alphabetical Ranks Added Encode';

// Triangular numbers: T(n) = n*(n+1)/2
const TRIANGULAR: number[] = [];
for (let i = 1; i <= 26; i++) {
  TRIANGULAR.push((i * (i + 1)) / 2);
}
// A=1→T(1)=1, B=2→T(2)=3, C=3→T(3)=6, ..., Z=26→T(26)=351

class AlphabeticalRanksEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts each letter to its triangular number (cumulative sum of ranks). ' +
      'A=1, B=3, C=6, D=10, E=15, ...Z=351. T(n) = n*(n+1)/2 where n is letter position.';
    this.infoURL = 'https://www.dcode.fr/alphabetical-ranks';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Separator',
        type: 'option',
        value: ['Space', 'Comma', 'Dash'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const sepName = (args[0] as string) || 'Space';
    const sep = sepName === 'Comma' ? ',' : sepName === 'Dash' ? '-' : ' ';

    const parts: string[] = [];
    for (const ch of input) {
      const code = ch.toUpperCase().charCodeAt(0);
      if (code >= 65 && code <= 90) {
        parts.push(String(TRIANGULAR[code - 65]));
      } else if (ch === ' ') {
        parts.push('/');
      }
    }
    return parts.join(sep);
  }
}

registerCustomOp(AlphabeticalRanksEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Alphabetical Ranks Added encode — letters to triangular numbers.',
  infoURL: 'https://www.dcode.fr/alphabetical-ranks',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'Dash'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default AlphabeticalRanksEncode;
