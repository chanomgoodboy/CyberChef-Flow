import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { identifyCipher, getClueCache, type CipherMatch } from '../_lib/cipherIdentifier';

const NAME = 'Cipher Identifier';

/**
 * Map cipher/encoding names to CyberChef operation recipes.
 * Empty array = detection-only (not clickable).
 */
const RECIPE_MAP: Record<string, { op: string; args: any[] }[]> = {
  'Base64':                [{ op: 'From Base64', args: [] }],
  'Base32':                [{ op: 'From Base32', args: [] }],
  'Hexadecimal':           [{ op: 'From Hex', args: ['Auto'] }],
  'Binary':                [{ op: 'From Binary', args: ['Space', 8] }],
  'Octal':                 [{ op: 'From Octal', args: ['Space'] }],
  'Decimal / ASCII Codes': [{ op: 'From Decimal', args: ['Space', false] }],
  'Morse Code':            [{ op: 'From Morse Code', args: ['Space', 'Forward slash'] }],
  'URL Encoding':          [{ op: 'URL Decode', args: [] }],
  'HTML Entities':         [{ op: 'From HTML Entity', args: [] }],
  'Unicode Escape':        [{ op: 'Unescape Unicode Characters', args: ['\\u'] }],
  'Caesar / ROT Cipher':   [{ op: 'ROT13', args: [true, true, false, 13] }],
  'ROT47':                 [{ op: 'ROT47', args: [] }],
  'ROT8000':               [{ op: 'ROT8000', args: [] }],
  'Atbash Cipher':         [{ op: 'Atbash Cipher', args: [] }],
  'Reversed Text':         [{ op: 'Reverse', args: ['Character'] }],
  'Vigenère Cipher':       [{ op: 'Vigenère Decode', args: [''] }],
  'Beaufort Cipher':       [{ op: 'Beaufort Cipher', args: [''] }],
  'XOR Cipher':            [{ op: 'XOR', args: [{ option: 'Hex', string: '' }, 'Standard', false] }],
  'RC4':                   [{ op: 'RC4', args: [{ string: '', option: 'UTF8' }, 'Latin1', 'UTF8'] }],
  'Rail Fence Cipher':     [{ op: 'Rail Fence Cipher Decode', args: [2, 0] }],
  'Bacon Cipher':          [{ op: 'Bacon Cipher Decode', args: [] }],
  // Substitution variants
  'Scream Cipher':         [{ op: 'Scream Cipher Decode', args: [] }],
  'Unicode Shift':         [{ op: 'Unicode Shift Decode', args: [1] }],
  'Consonants/Vowels Rank':[{ op: 'Consonants/Vowels Rank Decode', args: [] }],
  'Triliteral Cipher':     [{ op: 'Triliteral Cipher Decode', args: ['26 letters'] }],
  'Cipher Disk':           [{ op: 'Cipher Disk Decode', args: ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'D'] }],
  'Alphabetic Transcription': [{ op: 'Alphabetic Transcription Decode', args: ['French'] }],
  'Gravity Falls Cipher':  [{ op: 'Gravity Falls Cipher Decode', args: ['Caesar-3 (Season 1)'] }],
  // Keyboard & Physical ciphers
  'Keyboard Coordinates':  [{ op: 'Keyboard Coordinates Decode', args: ['1-based'] }],
  'LSPK90 Clockwise':      [{ op: 'LSPK90 Clockwise Decode', args: ['Clockwise'] }],
  'DTMF Code':             [{ op: 'DTMF Code Decode', args: [] }],
  'T9':                    [{ op: 'T9 Decode', args: ['First letter'] }],
  'ALT Codes':             [{ op: 'ALT Codes Decode', args: [] }],
  'ASCII Control Characters': [{ op: 'ASCII Control Characters Decode', args: [] }],
  // Lookup-table ciphers
  'Kenny Language':        [{ op: 'Kenny Language Decode', args: [] }],
  'Dice Numbers':          [{ op: 'Dice Numbers Decode', args: [] }],
  'Music Notes':           [{ op: 'Music Notes Decode', args: ['Si'] }],
  'Greek Letter Number':   [{ op: 'Greek Letter Number Decode', args: [] }],
  'Navajo Code':           [{ op: 'Navajo Code Decode', args: [] }],
  'Malespin Cipher':       [{ op: 'Malespin Cipher', args: [] }],
  'Alphabetical Ranks Added': [{ op: 'Alphabetical Ranks Added Decode', args: ['Auto'] }],
  // ROT variants & Base encodings
  'ROT5 Cipher':           [{ op: 'ROT5 Cipher', args: [] }],
  'ROT18 Cipher':          [{ op: 'ROT18 Cipher', args: [] }],
  'ROT1 Cipher':           [{ op: 'ROT1 Cipher', args: ['Decode'] }],
  'Base100':               [{ op: 'Base100 Decode', args: [] }],
  'Letter Positions':      [{ op: 'Letter Position Decode', args: ['Auto'] }],
  'Base26':                [{ op: 'Base26 Decode', args: ['Auto'] }],
  'Base36':                [{ op: 'Base36 Decode', args: ['Auto'] }],
  'Base37':                [{ op: 'Base37 Decode', args: [] }],
  'Base45':                [{ op: 'From Base45', args: ['0-9A-Z $%*+\\-./:', true] }],
  'Base58':                [{ op: 'From Base58', args: ['123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', true] }],
  'Base85 / ASCII85':      [{ op: 'From Base85', args: ['!-u', true, 'z'] }],
  'Base91':                [{ op: 'Base91 Decode', args: [] }],
  // Niche Regional & Historical
  'GS8 Braille':           [{ op: 'GS8 Braille Decode', args: [] }],
  'Weather WKS':           [{ op: 'Weather WKS Decode', args: [] }],
  'Indienne Code':         [{ op: 'Indienne Code Decode', args: ['INDIENNE'] }],
  'D3 Code':               [{ op: 'D3 Code Decode', args: ['RESISTANCE'] }],
  'K6 Code':               [{ op: 'K6 Code Decode', args: ['Key-Position (e.g. 2-1)'] }],
  'JIS Keyboard':          [{ op: 'JIS Keyboard Decode', args: [] }],
  // Math, Grid & Fun ciphers
  'Prime Multiplication':  [{ op: 'Prime Multiplication Decode', args: [7, 'Auto'] }],
  'Twin Hex Cipher':       [{ op: 'Twin Hex Cipher Decode', args: ['Auto'] }],
  'Binary Character Shapes': [{ op: 'Binary Character Shapes Decode', args: [] }],
  'Nak Nak (Duckspeak)':   [{ op: 'Nak Nak Decode', args: ['nak'] }],
  'Genshin Impact Cipher': [{ op: 'Genshin Impact Cipher Decode', args: ['Mondstadt'] }],
  // Historical & Complex ciphers
  'VIC Cipher':            [{ op: 'VIC Cipher Decode', args: ['ASINTOER', '26', 'SECRET'] }],
  'Rozier Cipher':         [{ op: 'Rozier Cipher Decode', args: ['12345'] }],
  'Trithemius Ave Maria':  [{ op: 'Trithemius Ave Maria Decode', args: [] }],
  'PGP Word List':         [{ op: 'PGP Word List Decode', args: ['Hex'] }],
  'Periodic Table Cipher': [{ op: 'Periodic Table Cipher Decode', args: ['Symbols to text'] }],
  'Prime Numbers Cipher':  [{ op: 'Prime Numbers Cipher Decode', args: ['Auto'] }],
  'Wabun Code':            [{ op: 'Wabun Code Decode', args: ['Kana'] }],
  // Esoteric languages
  'Brainfuck':             [{ op: 'Brainfuck Interpreter', args: [] }],
  'Ook!':                  [{ op: 'Ook! Interpreter', args: [] }],
  'Binaryfuck':            [{ op: 'Binaryfuck Interpreter', args: [] }],
  'Blub!':                 [{ op: 'Blub! Interpreter', args: [] }],
  'Pikalang':              [{ op: 'Pikalang Interpreter', args: [] }],
  'ReverseFuck':           [{ op: 'ReverseFuck Interpreter', args: [] }],
  'Spoon':                 [{ op: 'Spoon Interpreter', args: [] }],
  'COW':                   [{ op: 'COW Interpreter', args: [] }],
  'Deadfish':              [{ op: 'Deadfish Interpreter', args: [] }],
  'Whitespace':            [{ op: 'Whitespace Interpreter', args: [] }],
  'Chicken':               [{ op: 'Chicken Interpreter', args: [] }],
  'JSFuck':                [{ op: 'JSFuck Decode', args: [] }],
  'AAEncode':              [{ op: 'AAEncode Decode', args: [] }],
  // Analysis Tools
  'Word Pattern':          [{ op: 'Word Pattern', args: ['Pattern + Matches', 20] }],
  'Word Substitution':     [{ op: 'Word Substitution Decode', args: ['Numbers (A=1)', ''] }],
  // Encoding Formats
  'Base65536':             [{ op: 'Base65536 Decode', args: [] }],
  'Baudot Code':           [{ op: 'Baudot Code Decode', args: ['Binary'] }],
  'Gray Code':             [{ op: 'Gray Code Decode', args: ['Text', 'Space'] }],
  'Bubble Babble':         [{ op: 'Bubble Babble Decode', args: [] }],
  'Chuck Norris Unary':    [{ op: 'Chuck Norris Unary Decode', args: [] }],
  'Wingdings':             [{ op: 'Wingdings Decode', args: [] }],
  'Zalgo Text':            [{ op: 'Zalgo Text Decode', args: [] }],
  'UUencode':              [{ op: 'UUdecode', args: [] }],
  'Hexagram':              [{ op: 'Hexagram Decode', args: [] }],
  'LEB128':                [{ op: 'LEB128 Decode', args: ['Unsigned'] }],
  'Z-Base-32':             [{ op: 'Z-Base-32 Decode', args: [] }],
  'Base32 Crockford':      [{ op: 'Base32 Crockford Decode', args: ['Text'] }],
  // Asymmetric / Number Theory
  'RSA Ciphertext':        [{ op: 'RSA Cipher Attack', args: ['Auto', '', '65537', '', '', '', 'Decimal', 'Text', true] }],
};

class CipherIdentifier extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Analyzes input text and identifies possible ciphers or encodings. ' +
      'Uses frequency analysis, index of coincidence, character set analysis, ' +
      'and pattern matching to produce a ranked list of candidates with confidence scores.\n\n' +
      'Provide Key 1 and/or Key 2 to try trial decryptions. Both keys are tried on ' +
      'all algorithms (RC4, XOR, Vigenère, Beaufort, Autokey, Caesar, etc.). ' +
      'For ciphers needing key + IV (AES, DES), both key/IV orderings are suggested. ' +
      'Cribs from the Settings panel are also included automatically.';
    this.infoURL = 'https://www.dcode.fr/cipher-identifier';
    this.inputType = 'string';
    this.outputType = 'json';
    this.args = [
      {
        name: 'Key 1',
        type: 'string',
        value: '',
      },
      {
        name: 'Key 2',
        type: 'string',
        value: '',
      },
    ];
  }

  run(input: string, args: any[]): string {
    const key1 = ((args[0] as string) ?? '').trim();
    const key2 = ((args[1] as string) ?? '').trim();

    if (input.trim().length < 2) {
      return JSON.stringify([]);
    }

    // Collect extra clues from crib store settings
    const extraClues: string[] = [];
    const cached = getClueCache();
    for (const c of cached) {
      if (c && c !== key1 && c !== key2) extraClues.push(c);
    }

    const matches = identifyCipher(input, key1, key2, extraClues);
    const filtered = matches
      .filter((m) => m.score >= 15)
      .slice(0, 15);

    // Attach recipe to each result (use match's own recipe if present, else RECIPE_MAP)
    const results: CipherMatch[] = filtered.map((m) => ({
      ...m,
      recipe: m.recipe ?? RECIPE_MAP[m.name] ?? [],
    }));

    return JSON.stringify(results);
  }
}

registerCustomOp(CipherIdentifier, {
  name: NAME,
  module: 'Custom',
  description: 'Identify possible ciphers/encodings from input text (like dcode.fr).',
  infoURL: 'https://www.dcode.fr/cipher-identifier',
  inputType: 'string',
  outputType: 'json',
  args: [
    { name: 'Key 1', type: 'string', value: '' },
    { name: 'Key 2', type: 'string', value: '' },
  ],
  flowControl: false,
}, 'Crypto');

export default CipherIdentifier;
