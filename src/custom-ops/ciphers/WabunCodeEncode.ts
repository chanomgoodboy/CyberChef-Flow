import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { WABUN_TABLE, ROMAJI_TO_KANA } from '../_lib/wabun';

const NAME = 'Wabun Code Encode';

class WabunCodeEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encodes katakana characters or romaji text into Wabun code (Japanese Morse).';
    this.infoURL = 'https://www.dcode.fr/wabun-code';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Input Mode',
        type: 'option',
        value: ['Kana', 'Romaji'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const mode = (args[0] as string) || 'Kana';

    if (mode === 'Romaji') {
      // Convert romaji to kana first, then encode
      const upper = input.toUpperCase();
      const parts: string[] = [];
      let i = 0;
      while (i < upper.length) {
        if (upper[i] === ' ') {
          parts.push('/');
          i++;
          continue;
        }
        let found = false;
        // Try 3-char, 2-char, then 1-char romaji
        for (const len of [3, 2, 1]) {
          if (i + len <= upper.length) {
            const sub = upper.slice(i, i + len);
            const kana = ROMAJI_TO_KANA[sub];
            if (kana && WABUN_TABLE[kana]) {
              parts.push(WABUN_TABLE[kana]);
              i += len;
              found = true;
              break;
            }
          }
        }
        if (!found) i++; // skip unknown
      }
      return parts.join(' ');
    }

    // Kana mode: direct lookup
    const parts: string[] = [];
    for (const ch of input) {
      if (ch === ' ' || ch === '　') {
        parts.push('/');
      } else if (WABUN_TABLE[ch]) {
        parts.push(WABUN_TABLE[ch]);
      }
    }
    return parts.join(' ');
  }
}

registerCustomOp(WabunCodeEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Wabun Code encode — katakana/romaji to Japanese Morse.',
  infoURL: 'https://www.dcode.fr/wabun-code',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Input Mode', type: 'option', value: ['Kana', 'Romaji'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default WabunCodeEncode;
