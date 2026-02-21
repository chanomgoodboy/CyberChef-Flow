import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'K6 Code Decode';

// Key-position reverse map
const K6_REVERSE: Record<string, string> = {
  '2-1': 'A', '2-2': 'B', '2-3': 'C',
  '3-1': 'D', '3-2': 'E', '3-3': 'F',
  '4-1': 'G', '4-2': 'H', '4-3': 'I',
  '5-1': 'J', '5-2': 'K', '5-3': 'L',
  '6-1': 'M', '6-2': 'N', '6-3': 'O',
  '7-1': 'P', '7-2': 'Q', '7-3': 'R', '7-4': 'S',
  '8-1': 'T', '8-2': 'U', '8-3': 'V',
  '9-1': 'W', '9-2': 'X', '9-3': 'Y', '9-4': 'Z',
};

// Multi-tap reverse
const K6_MULTITAP: Record<string, string> = {
  '2': 'A', '22': 'B', '222': 'C',
  '3': 'D', '33': 'E', '333': 'F',
  '4': 'G', '44': 'H', '444': 'I',
  '5': 'J', '55': 'K', '555': 'L',
  '6': 'M', '66': 'N', '666': 'O',
  '7': 'P', '77': 'Q', '777': 'R', '7777': 'S',
  '8': 'T', '88': 'U', '888': 'V',
  '9': 'W', '99': 'X', '999': 'Y', '9999': 'Z',
};

class K6CodeDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes British K6 phone dial codes back to letters.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Format', type: 'option', value: ['Key-Position (e.g. 2-1)', 'Multi-tap (e.g. 222)'] },
    ];
  }

  run(input: string, args: any[]): string {
    const format = (args[0] as string) || 'Key-Position (e.g. 2-1)';

    const groups = input.trim().split(/\s*\/\s*/);
    const decoded: string[] = [];

    for (const group of groups) {
      const tokens = group.trim().split(/\s+/).filter(Boolean);
      let word = '';
      for (const tok of tokens) {
        if (format.startsWith('Key-Position')) {
          word += K6_REVERSE[tok] ?? '?';
        } else {
          word += K6_MULTITAP[tok] ?? '?';
        }
      }
      decoded.push(word);
    }
    return decoded.join(' ');
  }
}

registerCustomOp(K6CodeDecode, {
  name: NAME,
  module: 'Custom',
  description: 'K6 Code decode — British K6 phone dial codes to letters.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Format', type: 'option', value: ['Key-Position (e.g. 2-1)', 'Multi-tap (e.g. 222)'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default K6CodeDecode;
