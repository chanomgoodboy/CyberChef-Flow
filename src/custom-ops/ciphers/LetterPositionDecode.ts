import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Letter Position Decode';

class LetterPositionDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts alphabet positions back to letters (1=A, 2=B, ...26=Z). ' +
      'Numbers outside 1-26 are passed through.';
    this.infoURL = 'https://www.dcode.fr/letter-number-cipher';
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
      tokens = input.split(/[\s,\-]+/).filter(Boolean);
    } else {
      const sep = sepName === 'Comma' ? ',' : sepName === 'Dash' ? '-' : ' ';
      tokens = input.split(sep).filter(Boolean);
    }

    let result = '';
    for (const tok of tokens) {
      const t = tok.trim();
      const n = parseInt(t, 10);
      if (!isNaN(n) && n >= 1 && n <= 26) {
        result += String.fromCharCode(64 + n);
      } else {
        result += t;
      }
    }
    return result;
  }
}

registerCustomOp(LetterPositionDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Letter Position decode — alphabet positions (1-26) to letters.',
  infoURL: 'https://www.dcode.fr/letter-number-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'Dash', 'Auto'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default LetterPositionDecode;
