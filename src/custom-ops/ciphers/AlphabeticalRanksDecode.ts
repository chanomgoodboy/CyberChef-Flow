import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Alphabetical Ranks Added Decode';

// Build reverse map: triangular number → letter
const TRI_REVERSE: Record<number, string> = {};
for (let i = 1; i <= 26; i++) {
  TRI_REVERSE[(i * (i + 1)) / 2] = String.fromCharCode(64 + i);
}

class AlphabeticalRanksDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts triangular numbers back to letters. ' +
      '1=A, 3=B, 6=C, 10=D, 15=E, ...351=Z.';
    this.infoURL = 'https://www.dcode.fr/alphabetical-ranks';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Separator',
        type: 'option',
        value: ['Space', 'Comma', 'Dash', 'Auto'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const sepName = (args[0] as string) || 'Space';
    let tokens: string[];
    if (sepName === 'Auto') {
      tokens = input.trim().split(/[\s,\-/]+/).filter(Boolean);
    } else {
      const sep = sepName === 'Comma' ? ',' : sepName === 'Dash' ? '-' : ' ';
      tokens = input.split(sep).filter(Boolean);
    }

    let result = '';
    for (const tok of tokens) {
      const t = tok.trim();
      if (t === '/') {
        result += ' ';
        continue;
      }
      const n = parseInt(t, 10);
      if (!isNaN(n) && TRI_REVERSE[n]) {
        result += TRI_REVERSE[n];
      } else {
        result += t;
      }
    }
    return result;
  }
}

registerCustomOp(AlphabeticalRanksDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Alphabetical Ranks Added decode — triangular numbers back to letters.',
  infoURL: 'https://www.dcode.fr/alphabetical-ranks',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'Dash', 'Auto'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default AlphabeticalRanksDecode;
