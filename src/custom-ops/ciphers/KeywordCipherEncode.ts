import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { keywordAlphabet, ALPHABET } from '../_lib/alphabet';

const NAME = 'Keyword Cipher Encode';

class KeywordCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The Keyword cipher creates a substitution alphabet by placing a keyword at the beginning, followed by the remaining letters in order.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Keyword_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Keyword', type: 'string', value: 'KRYPTOS' },
    ];
  }

  run(input: string, args: any[]): string {
    const keyword = (args[0] as string) || 'KRYPTOS';
    const cipherAlpha = keywordAlphabet(keyword);

    let result = '';
    for (const ch of input) {
      const upper = ch.toUpperCase();
      const idx = ALPHABET.indexOf(upper);
      if (idx < 0) {
        result += ch;
        continue;
      }
      const outCh = cipherAlpha[idx];
      result += ch === upper ? outCh : outCh.toLowerCase();
    }
    return result;
  }
}

registerCustomOp(KeywordCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Keyword cipher encode — substitution with a keyword-based alphabet.',
  infoURL: 'https://en.wikipedia.org/wiki/Keyword_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Keyword', type: 'string', value: 'KRYPTOS' }],
  flowControl: false,
}, 'Classical Ciphers');

export default KeywordCipherEncode;
