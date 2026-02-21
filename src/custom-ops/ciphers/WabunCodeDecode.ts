import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { WABUN_REVERSE } from '../_lib/wabun';

const NAME = 'Wabun Code Decode';

class WabunCodeDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes Wabun code (Japanese Morse) back to katakana characters.';
    this.infoURL = 'https://www.dcode.fr/wabun-code';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Output Mode',
        type: 'option',
        value: ['Kana', 'Romaji'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const mode = (args[0] as string) || 'Kana';

    // Kana to basic romaji mapping
    const KANA_TO_ROMAJI: Record<string, string> = {
      'ア': 'A', 'イ': 'I', 'ウ': 'U', 'エ': 'E', 'オ': 'O',
      'カ': 'KA', 'キ': 'KI', 'ク': 'KU', 'ケ': 'KE', 'コ': 'KO',
      'サ': 'SA', 'シ': 'SHI', 'ス': 'SU', 'セ': 'SE', 'ソ': 'SO',
      'タ': 'TA', 'チ': 'CHI', 'ツ': 'TSU', 'テ': 'TE', 'ト': 'TO',
      'ナ': 'NA', 'ニ': 'NI', 'ヌ': 'NU', 'ネ': 'NE', 'ノ': 'NO',
      'ハ': 'HA', 'ヒ': 'HI', 'フ': 'FU', 'ヘ': 'HE', 'ホ': 'HO',
      'マ': 'MA', 'ミ': 'MI', 'ム': 'MU', 'メ': 'ME', 'モ': 'MO',
      'ヤ': 'YA', 'ユ': 'YU', 'ヨ': 'YO',
      'ラ': 'RA', 'リ': 'RI', 'ル': 'RU', 'レ': 'RE', 'ロ': 'RO',
      'ワ': 'WA', 'ヰ': 'WI', 'ヱ': 'WE', 'ヲ': 'WO',
      'ン': 'N',
    };

    const words = input.split(/\s*\/\s*/);
    const decoded: string[] = [];

    for (const word of words) {
      const codes = word.trim().split(/\s+/).filter(Boolean);
      let wordResult = '';
      for (const code of codes) {
        const kana = WABUN_REVERSE[code];
        if (kana) {
          if (mode === 'Romaji') {
            wordResult += KANA_TO_ROMAJI[kana] ?? kana;
          } else {
            wordResult += kana;
          }
        } else {
          wordResult += '?';
        }
      }
      decoded.push(wordResult);
    }

    return decoded.join(mode === 'Romaji' ? ' ' : '　');
  }
}

registerCustomOp(WabunCodeDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Wabun Code decode — Japanese Morse to katakana/romaji.',
  infoURL: 'https://www.dcode.fr/wabun-code',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Output Mode', type: 'option', value: ['Kana', 'Romaji'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default WabunCodeDecode;
