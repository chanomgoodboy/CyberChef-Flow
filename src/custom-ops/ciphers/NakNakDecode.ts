import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Nak Nak Decode';

class NakNakDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Counts repetitions of a word to recover letters (1=A, 2=B...26=Z). ' +
      'Reverse of Nak Nak Encode.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Word', type: 'string', value: 'nak' },
    ];
  }

  run(input: string, args: any[]): string {
    const word = ((args[0] as string) || 'nak').toLowerCase();

    // Split by | for letter groups, / for word spaces
    const groups = input.split(/\s*\|\s*/);
    let result = '';

    for (const group of groups) {
      const trimmed = group.trim();
      if (trimmed === '/' || trimmed === '') {
        if (trimmed === '/') result += ' ';
        continue;
      }
      // Count occurrences of the word
      const pattern = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = trimmed.match(pattern);
      const count = matches ? matches.length : 0;
      if (count >= 1 && count <= 26) {
        result += String.fromCharCode(64 + count);
      } else {
        result += '?';
      }
    }
    return result;
  }
}

registerCustomOp(NakNakDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Nak Nak (Duckspeak) decode — word repetitions to letters.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Word', type: 'string', value: 'nak' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default NakNakDecode;
