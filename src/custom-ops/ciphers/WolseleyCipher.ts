import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { keywordAlphabet } from '../_lib/alphabet';

const NAME = 'Wolseley Cipher';

class WolseleyCipher extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The Wolseley cipher is a reciprocal substitution cipher. A keyed alphabet is split in half (first 13 and last 13 letters) and each half substitutes for the other.';
    this.infoURL = 'https://www.dcode.fr/wolseley-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Keyword', type: 'string', value: 'KEYWORD' },
    ];
  }

  run(input: string, args: any[]): string {
    const keyword = (args[0] as string) || 'KEYWORD';
    const alpha = keywordAlphabet(keyword);

    // Build reciprocal mapping: first half ↔ second half
    const firstHalf = alpha.slice(0, 13);
    const secondHalf = alpha.slice(13, 26);

    const map: Record<string, string> = {};
    for (let i = 0; i < 13; i++) {
      map[firstHalf[i]] = secondHalf[i];
      map[secondHalf[i]] = firstHalf[i];
    }

    let result = '';
    for (const ch of input) {
      const upper = ch.toUpperCase();
      if (map[upper]) {
        const out = map[upper];
        result += ch === upper ? out : out.toLowerCase();
      } else {
        result += ch;
      }
    }
    return result;
  }
}

registerCustomOp(WolseleyCipher, {
  name: NAME,
  module: 'Custom',
  description: 'Wolseley cipher — reciprocal keyword substitution (split alphabet halves).',
  infoURL: 'https://www.dcode.fr/wolseley-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Keyword', type: 'string', value: 'KEYWORD' }],
  flowControl: false,
}, 'Classical Ciphers');

export default WolseleyCipher;
