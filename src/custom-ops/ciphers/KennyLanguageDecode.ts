import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Kenny Language Decode';

// Build reverse map
const KENNY_CHARS = 'mpf';
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const KENNY_REVERSE: Record<string, string> = {};
for (let i = 0; i < 26; i++) {
  const a = Math.floor(i / 9);
  const b = Math.floor((i % 9) / 3);
  const c = i % 3;
  const code = KENNY_CHARS[a] + KENNY_CHARS[b] + KENNY_CHARS[c];
  KENNY_REVERSE[code] = ALPHA[i];
}

class KennyLanguageDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes Kenny Language (South Park). Each 3-character mpf combination ' +
      'is converted back to a letter. mmm=A, mmp=B, mmf=C, etc.';
    this.infoURL = 'https://www.dcode.fr/kenny-language';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    let result = '';
    let i = 0;
    while (i < input.length) {
      const ch = input[i].toLowerCase();
      if ('mpf'.includes(ch) && i + 2 < input.length) {
        const trigram = (input[i] + input[i + 1] + input[i + 2]).toLowerCase();
        const letter = KENNY_REVERSE[trigram];
        if (letter) {
          // Uppercase if first char of trigram was uppercase
          result += input[i] === input[i].toUpperCase() ? letter : letter.toLowerCase();
          i += 3;
          continue;
        }
      }
      result += input[i];
      i++;
    }
    return result;
  }
}

registerCustomOp(KennyLanguageDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Kenny Language decode — mpf trigrams back to letters.',
  infoURL: 'https://www.dcode.fr/kenny-language',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default KennyLanguageDecode;
