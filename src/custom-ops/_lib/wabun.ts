/**
 * Wabun Code — Japanese Morse code variant for katakana characters.
 * Maps kana syllables to Morse-like patterns using dots and dashes.
 */

export const WABUN_TABLE: Record<string, string> = {
  'イ': '.-',      'ロ': '.-.-',    'ハ': '-...',    'ニ': '-.-.',
  'ホ': '-..',      'ヘ': '.',        'ト': '..-..', 'チ': '..-.',
  'リ': '--.',      'ヌ': '....',    'ル': '-.--.',  'ヲ': '.---',
  'ワ': '-.-',      'カ': '.-..',    'ヨ': '--',      'タ': '-.',
  'レ': '---',      'ソ': '---.',    'ツ': '.--.',    'ネ': '--.-',
  'ナ': '.-.',      'ラ': '...',     'ム': '-',       'ウ': '..-',
  'ヰ': '.-..-',    'ノ': '..--',    'オ': '.-...',   'ク': '...-',
  'ヤ': '.--',      'マ': '-..-',    'ケ': '-.--',    'フ': '--..',
  'コ': '----',     'エ': '-.---',   'テ': '.-.--',   'ア': '--.--',
  'サ': '-.-.-',    'キ': '-.-..',   'ユ': '-..--',   'メ': '-...-',
  'ミ': '..-.-',    'シ': '--.-.', 'ヱ': '.--..',   'ヒ': '--..-',
  'モ': '-..-.',    'セ': '.---.',   'ス': '---.-',   'ン': '.-.-.',
  // Dakuten (voiced): ゛ marker
  'ガ': '..-..',    // Ka + dakuten
  'ギ': '-.-..', // Ki + dakuten (same as Ki, context)
  'グ': '...-',     // Ku + dakuten
  'ゲ': '-.--',     // Ke + dakuten
  'ゴ': '----',     // Ko + dakuten
  'ザ': '-.-.-',    // Sa + dakuten
  'ジ': '--.-.', // Shi + dakuten
  'ズ': '---.-',    // Su + dakuten
  'ゼ': '.---.',    // Se + dakuten
  'ゾ': '---.',     // So + dakuten
  'ダ': '-.',       // Ta + dakuten
  'ヂ': '..-.',     // Chi + dakuten
  'ヅ': '.--.',     // Tsu + dakuten
  'デ': '.-.--',    // Te + dakuten
  'ド': '..-..', // To + dakuten
  'バ': '-...',     // Ha + dakuten
  'ビ': '--..-',    // Hi + dakuten
  'ブ': '--..',     // Fu + dakuten
  'ベ': '.',        // He + dakuten
  'ボ': '-..',      // Ho + dakuten
  'パ': '-...',     // Ha + handakuten
  'ピ': '--..-',    // Hi + handakuten
  'プ': '--..',     // Fu + handakuten
  'ペ': '.',        // He + handakuten
  'ポ': '-..',      // Ho + handakuten
};

// Romanization to kana mapping for encoding Latin text
export const ROMAJI_TO_KANA: Record<string, string> = {
  'A': 'ア', 'I': 'イ', 'U': 'ウ', 'E': 'エ', 'O': 'オ',
  'KA': 'カ', 'KI': 'キ', 'KU': 'ク', 'KE': 'ケ', 'KO': 'コ',
  'SA': 'サ', 'SI': 'シ', 'SHI': 'シ', 'SU': 'ス', 'SE': 'セ', 'SO': 'ソ',
  'TA': 'タ', 'TI': 'チ', 'CHI': 'チ', 'TSU': 'ツ', 'TU': 'ツ', 'TE': 'テ', 'TO': 'ト',
  'NA': 'ナ', 'NI': 'ニ', 'NU': 'ヌ', 'NE': 'ネ', 'NO': 'ノ',
  'HA': 'ハ', 'HI': 'ヒ', 'HU': 'フ', 'FU': 'フ', 'HE': 'ヘ', 'HO': 'ホ',
  'MA': 'マ', 'MI': 'ミ', 'MU': 'ム', 'ME': 'メ', 'MO': 'モ',
  'YA': 'ヤ', 'YU': 'ユ', 'YO': 'ヨ',
  'RA': 'ラ', 'RI': 'リ', 'RU': 'ル', 'RE': 'レ', 'RO': 'ロ',
  'WA': 'ワ', 'WI': 'ヰ', 'WE': 'ヱ', 'WO': 'ヲ',
  'N': 'ン',
};

// Build reverse map: Morse → kana
export const WABUN_REVERSE: Record<string, string> = {};
for (const [kana, morse] of Object.entries(WABUN_TABLE)) {
  // Only use first mapping for each morse pattern (base kana)
  if (!WABUN_REVERSE[morse]) {
    WABUN_REVERSE[morse] = kana;
  }
}
