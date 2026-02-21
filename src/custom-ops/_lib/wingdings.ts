/**
 * Wingdings font character mapping.
 * Reference: https://en.wikipedia.org/wiki/Wingdings
 *
 * Maps ASCII printable characters (32-126) to their Wingdings Unicode equivalents.
 * The Wingdings font maps standard ASCII positions to various symbols.
 */

// Wingdings mapping table: ASCII code (32-126) → Unicode symbol
// Based on the standard Wingdings character map
const WINGDINGS_MAP: Record<string, string> = {
  ' ': ' ',
  '!': '\u270F', // pencil ✏
  '"': '\u2702', // scissors ✂
  '#': '\u2701', // upper blade scissors ✁
  '$': '\u{1F453}', // eyeglasses 👓
  '%': '\u{1F514}', // bell 🔔
  '&': '\u{1F4E5}', // inbox tray 📥
  "'": '\u{1F4E4}', // outbox tray 📤
  '(': '\u{1F4E6}', // package 📦
  ')': '\u{1F4E8}', // incoming envelope 📨
  '*': '\u{1F4EA}', // closed mailbox 📪
  '+': '\u{1F4EB}', // closed mailbox with raised flag 📫
  ',': '\u{1F4EC}', // open mailbox with raised flag 📬
  '-': '\u{1F4ED}', // open mailbox with lowered flag 📭
  '.': '\u{1F4C1}', // file folder 📁
  '/': '\u{1F4C2}', // open file folder 📂
  '0': '\u{1F4C4}', // page facing up 📄
  '1': '\u{1F3F3}', // white flag 🏳
  '2': '\u2708', // airplane ✈
  '3': '\u2600', // sun ☀
  '4': '\u{1F4A7}', // droplet 💧
  '5': '\u2744', // snowflake ❄
  '6': '\u271E', // shadowed white latin cross ✞
  '7': '\u{1F549}', // om symbol 🕉
  '8': '\u2721', // star of david ✡
  '9': '\u262A', // star and crescent ☪
  ':': '\u262F', // yin yang ☯
  ';': '\u{1F549}', // om 🕉
  '<': '\u2648', // aries ♈
  '=': '\u2649', // taurus ♉
  '>': '\u264A', // gemini ♊
  '?': '\u264B', // cancer ♋
  '@': '\u264C', // leo ♌
  'A': '\u264D', // virgo ♍
  'B': '\u264E', // libra ♎
  'C': '\u264F', // scorpio ♏
  'D': '\u2650', // sagittarius ♐
  'E': '\u2651', // capricorn ♑
  'F': '\u2652', // aquarius ♒
  'G': '\u2653', // pisces ♓
  'H': '\u{1F670}', // script ligature et ornament 🙰
  'I': '\u{1F675}', // swash ampersand ornament
  'J': '\u{1F60A}', // smiling face 😊
  'K': '\u{1F610}', // neutral face 😐
  'L': '\u{1F61E}', // disappointed face 😞
  'M': '\u{1F4A3}', // bomb 💣
  'N': '\u{1F571}', // black skull and crossbones 🕱
  'O': '\u{1F3F3}', // white flag
  'P': '\u{1F3F1}', // white pennant
  'Q': '\u2708', // airplane ✈
  'R': '\u263A', // white smiling face ☺
  'S': '\u{1F480}', // skull 💀
  'T': '\u2620', // skull and crossbones ☠
  'U': '\u{1F3F3}', // white flag
  'V': '\u2706', // telephone location sign ✆
  'W': '\u{1F4F1}', // mobile phone 📱
  'X': '\u{1F4E9}', // envelope with arrow 📩
  'Y': '\u{1F4EC}', // open mailbox 📬
  'Z': '\u{1F4ED}', // open mailbox lowered 📭
  '[': '\u{1F5C0}', // folder 🗀
  '\\': '\u{1F5C1}', // folder 🗁
  ']': '\u{1F5CC}', // document 🗌
  '^': '\u2327', // x in a rectangle ⌧
  '_': '\u{1F5D4}', // desktop window
  '`': '\u{1F5D5}', // minimize
  'a': '\u{1F5F6}', // ballot box with bold check 🗶→actually heavy check ✔
  'b': '\u2714', // heavy check mark ✔
  'c': '\u2718', // heavy ballot X ✘
  'd': '\u271A', // heavy greek cross ✚
  'e': '\u{1F5D9}', // cancellation X 🗙
  'f': '\u2720', // maltese cross ✠
  'g': '\u2721', // star of david ✡
  'h': '\u2722', // four teardrop-spoked asterisk ✢
  'i': '\u2723', // four balloon-spoked asterisk ✣
  'j': '\u2724', // heavy four balloon-spoked asterisk ✤
  'k': '\u2725', // four club-spoked asterisk ✥
  'l': '\u2726', // black four pointed star ✦
  'm': '\u2727', // white four pointed star ✧
  'n': '\u2605', // black star ★
  'o': '\u2729', // stress outlined white star ✩
  'p': '\u272A', // circled white star ✪
  'q': '\u272B', // open centre black star ✫
  'r': '\u272C', // black centre white star ✬
  's': '\u272D', // outlined black star ✭
  't': '\u272E', // heavy outlined black star ✮
  'u': '\u272F', // pinwheel star ✯
  'v': '\u2730', // shadowed white star ✰
  'w': '\u2318', // place of interest ⌘
  'x': '\u2740', // white florette ❀
  'y': '\u273F', // black florette ❿→✿
  'z': '\u275D', // heavy double turned comma quotation mark ❝
  '{': '\u275E', // heavy double comma quotation mark ❞
  '|': '\u{1F5F5}', // ballot box
  '}': '\u2761', // curved stem paragraph sign ornament ❡
  '~': '\u2766', // floral heart ❦
};

// Build reverse mapping
const REVERSE_MAP = new Map<string, string>();
(function init() {
  for (const [ascii, wd] of Object.entries(WINGDINGS_MAP)) {
    if (ascii === ' ' && wd === ' ') continue; // skip space→space
    if (!REVERSE_MAP.has(wd)) {
      REVERSE_MAP.set(wd, ascii);
    }
  }
})();

/**
 * Encode ASCII text to Wingdings Unicode symbols.
 */
export function wingdingsEncode(input: string): string {
  let result = '';
  for (const ch of input) {
    const mapped = WINGDINGS_MAP[ch];
    result += mapped !== undefined ? mapped : ch;
  }
  return result;
}

/**
 * Decode Wingdings Unicode symbols back to ASCII text.
 */
export function wingdingsDecode(input: string): string {
  let result = '';
  for (const ch of input) {
    // Check full character (including surrogate pairs)
    const decoded = REVERSE_MAP.get(ch);
    result += decoded !== undefined ? decoded : ch;
  }
  return result;
}
