import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { keywordAlphabet, ALPHABET } from '../_lib/alphabet';

const NAME = 'Keyword Cipher Decode';

class KeywordCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes text encrypted with the Keyword cipher by reversing the keyword-based substitution.';
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
      const idx = cipherAlpha.indexOf(upper);
      if (idx < 0) {
        result += ch;
        continue;
      }
      const outCh = ALPHABET[idx];
      result += ch === upper ? outCh : outCh.toLowerCase();
    }
    return result;
  }
}

registerCustomOp(KeywordCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Keyword cipher decode — reverse keyword-based substitution.',
  infoURL: 'https://en.wikipedia.org/wiki/Keyword_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Keyword', type: 'string', value: 'KRYPTOS' }],
  flowControl: false,
}, 'Classical Ciphers');

export default KeywordCipherDecode;
