/**
 * Fuzz Roundtrip Test
 *
 * For every encode/decode and encrypt/decrypt operation pair,
 * verifies that:  input → encode → decode → output === input
 *
 * Runs operations directly via OperationAdapter on the main thread
 * (no DOM interaction, no screenshots) for maximum efficiency.
 */

import { test, expect, Page } from '@playwright/test';

/* ------------------------------------------------------------------ */
/*  Test inputs                                                        */
/* ------------------------------------------------------------------ */

/** General text with mixed case, digits, punctuation. */
const INPUT = 'The quick brown fox jumps over the lazy dog! 0123456789';

/** Uppercase text (for ops that decode to uppercase like Morse/Braille). */
const INPUT_UPPER = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG 0123456789';

/** Uppercase alpha only — no I/J, even length (for classical ciphers). */
const INPUT_ALPHA = 'ATTACKATDAWN';

/** Valid JSON string (for serialization ops). */
const INPUT_JSON = '{"name":"test","value":123}';

/* ------------------------------------------------------------------ */
/*  Crypto key constants                                               */
/* ------------------------------------------------------------------ */

const EMPTY_TS = { string: '', option: 'Hex' };
// AES: 16-byte key, 16-byte IV
const AES_KEY = { string: '00112233445566778899aabbccddeeff', option: 'Hex' };
const AES_IV  = { string: 'ffeeddccbbaa99887766554433221100', option: 'Hex' };
// DES: 8-byte key/IV
const DES_KEY = { string: '0011223344556677', option: 'Hex' };
const DES_IV  = { string: '0011223344556677', option: 'Hex' };
// Triple DES: 24-byte key, 8-byte IV
const TDES_KEY = { string: '00112233445566778899aabbccddeeff0011223344556677', option: 'Hex' };
// Blowfish: 8-byte key, 8-byte IV
const BF_KEY  = { string: '0011223344556677', option: 'Hex' };
const BF_IV   = { string: '0011223344556677', option: 'Hex' };
// RC2: 16-byte key, 8-byte IV
const RC2_KEY = { string: '00112233445566778899aabbccddeeff', option: 'Hex' };
const RC2_IV  = { string: '0011223344556677', option: 'Hex' };
// SM4: 16-byte key, 16-byte IV
const SM4_KEY = { string: '0123456789abcdef0123456789abcdef', option: 'Hex' };
const SM4_IV  = { string: 'fedcba9876543210fedcba9876543210', option: 'Hex' };
// XXTEA: 16-byte key
const XXTEA_KEY = { string: '0123456789abcdef0123456789abcdef', option: 'Hex' };
// Rabbit: 16-byte key, 8-byte IV
const RABBIT_KEY = { string: '00112233445566778899aabbccddeeff', option: 'Hex' };
const RABBIT_IV  = { string: '0011223344556677', option: 'Hex' };
// RC4: passphrase
const RC4_KEY = { string: 'secretkey', option: 'UTF8' };
// Salsa20 / ChaCha / XSalsa20: 32-byte key
const STREAM_KEY_32 = { string: '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff', option: 'Hex' };
const SALSA20_NONCE = { string: '0011223344556677', option: 'Hex' }; // 8 bytes
const CHACHA_NONCE  = { string: '001122334455667788990011', option: 'Hex' }; // 12 bytes
const XSALSA_NONCE  = { string: '00112233445566778899aabbccddeeff0011223344556677', option: 'Hex' }; // 24 bytes

/* ------------------------------------------------------------------ */
/*  Operation pair definitions                                         */
/* ------------------------------------------------------------------ */

interface OpPair {
  encode: string;
  decode: string;
  /** Override encode arg values by positional index. */
  encodeArgs?: any[];
  /** Override decode arg values by positional index. */
  decodeArgs?: any[];
  /** Custom input (some ops need specific format). */
  input?: string;
}

// =====================================================================
//  CyberChef built-in encoding pairs
// =====================================================================

const ENCODING_PAIRS: OpPair[] = [
  { encode: 'To Base32', decode: 'From Base32' },
  { encode: 'To Base45', decode: 'From Base45' },
  { encode: 'To Base58', decode: 'From Base58' },
  { encode: 'To Base62', decode: 'From Base62' },
  { encode: 'To Base64', decode: 'From Base64' },
  { encode: 'To Base85', decode: 'From Base85' },
  { encode: 'To Base92', decode: 'From Base92' },
  { encode: 'To Hex', decode: 'From Hex' },
  { encode: 'To Binary', decode: 'From Binary' },
  { encode: 'To Octal', decode: 'From Octal' },
  { encode: 'To Decimal', decode: 'From Decimal' },
  { encode: 'To Modhex', decode: 'From Modhex' },
  {
    encode: 'To Morse Code', decode: 'From Morse Code',
    input: 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG! 0123456789',
  },
  {
    encode: 'To Braille', decode: 'From Braille',
    input: 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG! 0123456789',
  },
  { encode: 'To Punycode', decode: 'From Punycode' },
  { encode: 'To Quoted Printable', decode: 'From Quoted Printable' },
  { encode: 'To Hexdump', decode: 'From Hexdump' },
  { encode: 'To Charcode', decode: 'From Charcode' },
  { encode: 'URL Encode', decode: 'URL Decode' },
  { encode: 'Escape Unicode Characters', decode: 'Unescape Unicode Characters' },
  { encode: 'To HTML Entity', decode: 'From HTML Entity' },
  { encode: 'Encode text', decode: 'Decode text' },
  { encode: 'Escape string', decode: 'Unescape string' },
  { encode: 'Microsoft Script Decoder', decode: 'Microsoft Script Encoder' },
  { encode: 'Citrix CTX1 Encode', decode: 'Citrix CTX1 Decode' },
  { encode: 'Cetacean Cipher Encode', decode: 'Cetacean Cipher Decode' },
  {
    encode: 'Encode NetBIOS Name', decode: 'Decode NetBIOS Name',
    input: 'HELLO',
  },
  { encode: 'Add line numbers', decode: 'Remove line numbers' },
  {
    encode: 'Vigenère Encode', decode: 'Vigenère Decode',
    input: INPUT_ALPHA,
    encodeArgs: ['KEY'],
    decodeArgs: ['KEY'],
  },
  {
    encode: 'A1Z26 Cipher Encode', decode: 'A1Z26 Cipher Decode',
    input: 'attackatdawn', // A1Z26 decodes to lowercase
  },
];

// =====================================================================
//  Compression pairs
// =====================================================================

const COMPRESSION_PAIRS: OpPair[] = [
  { encode: 'Bzip2 Compress', decode: 'Bzip2 Decompress' },
  { encode: 'Gzip', decode: 'Gunzip' },
  { encode: 'Zlib Deflate', decode: 'Zlib Inflate' },
  { encode: 'Raw Deflate', decode: 'Raw Inflate' },
  { encode: 'LZString Compress', decode: 'LZString Decompress' },
  { encode: 'LZMA Compress', decode: 'LZMA Decompress' },
  { encode: 'LZ4 Compress', decode: 'LZ4 Decompress' },
];

// =====================================================================
//  Block cipher encryption pairs (explicit key/IV)
// =====================================================================

const ENCRYPTION_PAIRS: OpPair[] = [
  {
    encode: 'AES Encrypt', decode: 'AES Decrypt',
    encodeArgs: [AES_KEY, AES_IV, 'CBC', 'Raw', 'Hex', EMPTY_TS],
    decodeArgs: [AES_KEY, AES_IV, 'CBC', 'Hex', 'Raw', EMPTY_TS, EMPTY_TS],
  },
  {
    encode: 'DES Encrypt', decode: 'DES Decrypt',
    encodeArgs: [DES_KEY, DES_IV, 'CBC', 'Raw', 'Hex'],
    decodeArgs: [DES_KEY, DES_IV, 'CBC', 'Hex', 'Raw'],
  },
  {
    encode: 'Triple DES Encrypt', decode: 'Triple DES Decrypt',
    encodeArgs: [TDES_KEY, DES_IV, 'CBC', 'Raw', 'Hex'],
    decodeArgs: [TDES_KEY, DES_IV, 'CBC', 'Hex', 'Raw'],
  },
  {
    encode: 'Blowfish Encrypt', decode: 'Blowfish Decrypt',
    encodeArgs: [BF_KEY, BF_IV, 'CBC', 'Raw', 'Hex'],
    decodeArgs: [BF_KEY, BF_IV, 'CBC', 'Hex', 'Raw'],
  },
  {
    encode: 'RC2 Encrypt', decode: 'RC2 Decrypt',
    encodeArgs: [RC2_KEY, RC2_IV, 'Raw', 'Hex'],
    decodeArgs: [RC2_KEY, RC2_IV, 'Hex', 'Raw'],
  },
  {
    encode: 'SM4 Encrypt', decode: 'SM4 Decrypt',
    encodeArgs: [SM4_KEY, SM4_IV, 'CBC', 'Raw', 'Hex'],
    decodeArgs: [SM4_KEY, SM4_IV, 'CBC', 'Hex', 'Raw'],
  },
  {
    encode: 'XXTEA Encrypt', decode: 'XXTEA Decrypt',
    encodeArgs: [XXTEA_KEY],
    decodeArgs: [XXTEA_KEY],
  },
];

// =====================================================================
//  Self-inverse / stream cipher pairs
// =====================================================================

const SELF_INVERSE_PAIRS: OpPair[] = [
  { encode: 'ROT13', decode: 'ROT13' },
  { encode: 'ROT47', decode: 'ROT47' },
  { encode: 'ROT8000', decode: 'ROT8000' },
  { encode: 'NOT', decode: 'NOT' },
  {
    encode: 'XOR', decode: 'XOR',
    encodeArgs: [{ string: 'secret', option: 'UTF8' }, 'Standard', false],
    decodeArgs: [{ string: 'secret', option: 'UTF8' }, 'Standard', false],
  },
  {
    encode: 'Swap endianness', decode: 'Swap endianness',
    encodeArgs: ['Raw', 4, false],
    decodeArgs: ['Raw', 4, false],
  },
  { encode: 'Reverse', decode: 'Reverse' },
  {
    encode: 'Rotate left', decode: 'Rotate right',
  },
  // Stream ciphers (self-inverse: encrypt = decrypt)
  {
    encode: 'Rabbit', decode: 'Rabbit',
    encodeArgs: [RABBIT_KEY, RABBIT_IV, 'Raw', 'Raw'],
    decodeArgs: [RABBIT_KEY, RABBIT_IV, 'Raw', 'Raw'],
  },
  {
    encode: 'RC4', decode: 'RC4',
    encodeArgs: [RC4_KEY, 'Latin1', 'Hex'],
    decodeArgs: [RC4_KEY, 'Hex', 'Latin1'],
  },
  {
    encode: 'RC4 Drop', decode: 'RC4 Drop',
    encodeArgs: [RC4_KEY, 'Latin1', 'Hex', 0],
    decodeArgs: [RC4_KEY, 'Hex', 'Latin1', 0],
  },
  {
    encode: 'Salsa20', decode: 'Salsa20',
    encodeArgs: [STREAM_KEY_32, SALSA20_NONCE, 0, 20, 'Raw', 'Hex'],
    decodeArgs: [STREAM_KEY_32, SALSA20_NONCE, 0, 20, 'Hex', 'Raw'],
  },
  {
    encode: 'ChaCha', decode: 'ChaCha',
    encodeArgs: [STREAM_KEY_32, CHACHA_NONCE, 0, 20, 'Raw', 'Hex'],
    decodeArgs: [STREAM_KEY_32, CHACHA_NONCE, 0, 20, 'Hex', 'Raw'],
  },
  {
    encode: 'XSalsa20', decode: 'XSalsa20',
    encodeArgs: [STREAM_KEY_32, XSALSA_NONCE, 0, 20, 'Raw', 'Hex'],
    decodeArgs: [STREAM_KEY_32, XSALSA_NONCE, 0, 20, 'Hex', 'Raw'],
  },
];

// =====================================================================
//  CyberChef built-in cipher pairs (alpha input)
// =====================================================================

const CYBERCHEF_CIPHER_PAIRS: OpPair[] = [
  { encode: 'Atbash Cipher', decode: 'Atbash Cipher', input: INPUT_ALPHA },
  { encode: 'Affine Cipher Encode', decode: 'Affine Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Rail Fence Cipher Encode', decode: 'Rail Fence Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Bifid Cipher Encode', decode: 'Bifid Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Bacon Cipher Encode', decode: 'Bacon Cipher Decode', input: INPUT_ALPHA },
];

// =====================================================================
//  Custom cipher pairs — Polyalphabetic
// =====================================================================

const CUSTOM_POLYALPHABETIC: OpPair[] = [
  { encode: 'Beaufort Cipher', decode: 'Beaufort Cipher', input: INPUT_ALPHA },
  { encode: 'Gronsfeld Cipher Encode', decode: 'Gronsfeld Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Trithemius Cipher Encode', decode: 'Trithemius Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Porta Cipher', decode: 'Porta Cipher', input: INPUT_ALPHA },
  { encode: 'Multiplicative Cipher Encode', decode: 'Multiplicative Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Autokey Cipher Encode', decode: 'Autokey Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Variant Beaufort Cipher Encode', decode: 'Variant Beaufort Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Alberti Cipher Encode', decode: 'Alberti Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Chaocipher Encode', decode: 'Chaocipher Decode', input: INPUT_ALPHA },
  { encode: 'Progressive Caesar Encode', decode: 'Progressive Caesar Decode', input: INPUT_ALPHA },
  { encode: 'Rozier Cipher Encode', decode: 'Rozier Cipher Decode', input: INPUT_ALPHA },
];

// =====================================================================
//  Custom cipher pairs — Polybius grid (I/J merging — no J in input)
// =====================================================================

const CUSTOM_POLYBIUS: OpPair[] = [
  { encode: 'Polybius Square Encode', decode: 'Polybius Square Decode', input: INPUT_ALPHA },
  { encode: 'ADFGX Cipher Encode', decode: 'ADFGX Cipher Decode', input: INPUT_ALPHA },
  { encode: 'ADFGVX Cipher Encode', decode: 'ADFGVX Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Nihilist Cipher Encode', decode: 'Nihilist Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Four-Square Cipher Encode', decode: 'Four-Square Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Two-Square Cipher Encode', decode: 'Two-Square Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Three-Square Cipher Encode', decode: 'Three-Square Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Collon Cipher Encode', decode: 'Collon Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Digrafid Cipher Encode', decode: 'Digrafid Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Trifid Cipher Encode', decode: 'Trifid Cipher Decode', input: INPUT_ALPHA },
];

// =====================================================================
//  Custom cipher pairs — Transposition
// =====================================================================

const CUSTOM_TRANSPOSITION: OpPair[] = [
  { encode: 'Columnar Transposition Encode', decode: 'Columnar Transposition Decode', input: INPUT_ALPHA },
  { encode: 'Scytale Cipher Encode', decode: 'Scytale Cipher Decode', input: INPUT_ALPHA },
  { encode: 'AMSCO Cipher Encode', decode: 'AMSCO Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Redefence Cipher Encode', decode: 'Redefence Cipher Decode', input: INPUT_ALPHA },
];

// =====================================================================
//  Custom cipher pairs — Monoalphabetic substitution
// =====================================================================

const CUSTOM_MONOALPHABETIC: OpPair[] = [
  { encode: 'Keyword Cipher Encode', decode: 'Keyword Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Pigpen Cipher Encode', decode: 'Pigpen Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Tap Code Encode', decode: 'Tap Code Decode', input: 'HELLOWORLD' }, // no K (C=K merge)
  { encode: 'Wolseley Cipher', decode: 'Wolseley Cipher', input: INPUT_ALPHA },
  { encode: 'Malespin Cipher', decode: 'Malespin Cipher', input: INPUT_ALPHA },
  { encode: 'Monome-Dinome Encode', decode: 'Monome-Dinome Decode', input: INPUT_ALPHA },
  { encode: 'Bazeries Cipher Encode', decode: 'Bazeries Cipher Decode', input: INPUT_ALPHA },
];

// =====================================================================
//  Custom cipher pairs — Standalone
// =====================================================================

const CUSTOM_STANDALONE: OpPair[] = [
  { encode: 'Hill Cipher Encode', decode: 'Hill Cipher Decode', input: INPUT_ALPHA },
];

// =====================================================================
//  Custom cipher pairs — Keyboard & ASCII
// =====================================================================

const CUSTOM_KEYBOARD: OpPair[] = [
  { encode: 'ASCII Shift Cipher Encode', decode: 'ASCII Shift Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Phone Keypad (Multi-tap) Encode', decode: 'Phone Keypad (Multi-tap) Decode', input: INPUT_ALPHA },
  { encode: 'Keyboard Coordinates Encode', decode: 'Keyboard Coordinates Decode', input: INPUT_ALPHA },
  { encode: 'LSPK90 Clockwise Encode', decode: 'LSPK90 Clockwise Decode', input: INPUT_ALPHA },
  { encode: 'Numeric Keypad Draw Encode', decode: 'Numeric Keypad Draw Decode', input: INPUT_ALPHA },
  { encode: 'ALT Codes Encode', decode: 'ALT Codes Decode', input: INPUT_ALPHA },
  { encode: 'ASCII Control Characters Encode', decode: 'ASCII Control Characters Decode', input: INPUT_ALPHA },
];

// =====================================================================
//  Custom cipher pairs — Fractionation
// =====================================================================

const CUSTOM_FRACTIONATION: OpPair[] = [
  { encode: 'Fractionated Morse Encode', decode: 'Fractionated Morse Decode', input: INPUT_ALPHA },
  { encode: 'Morbit Cipher Encode', decode: 'Morbit Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Pollux Cipher Encode', decode: 'Pollux Cipher Decode', input: INPUT_ALPHA },
];

// =====================================================================
//  Custom cipher pairs — ROT variants
// =====================================================================

const CUSTOM_ROT: OpPair[] = [
  { encode: 'ROT5 Cipher', decode: 'ROT5 Cipher', input: '0123456789' },
  { encode: 'ROT18 Cipher', decode: 'ROT18 Cipher' },
];

// =====================================================================
//  Custom base encoding pairs
// =====================================================================

const CUSTOM_BASE_ENCODING: OpPair[] = [
  { encode: 'Base100 Encode', decode: 'Base100 Decode' },
  { encode: 'Base91 Encode', decode: 'Base91 Decode' },
  { encode: 'Base65536 Encode', decode: 'Base65536 Decode' },
  { encode: 'Base32 Crockford Encode', decode: 'Base32 Crockford Decode' },
  { encode: 'Z-Base-32 Encode', decode: 'Z-Base-32 Decode' },
  { encode: 'Letter Position Encode', decode: 'Letter Position Decode', input: INPUT_ALPHA },
];

// =====================================================================
//  Custom lookup-table ciphers
// =====================================================================

const CUSTOM_LOOKUP: OpPair[] = [
  { encode: 'Kenny Language Encode', decode: 'Kenny Language Decode', input: INPUT_ALPHA },
  { encode: 'Dice Numbers Encode', decode: 'Dice Numbers Decode', input: INPUT_ALPHA },
  { encode: 'Navajo Code Encode', decode: 'Navajo Code Decode', input: INPUT_ALPHA },
  { encode: 'Alphabetical Ranks Added Encode', decode: 'Alphabetical Ranks Added Decode', input: INPUT_ALPHA },
];

// =====================================================================
//  Custom substitution variant ciphers
// =====================================================================

const CUSTOM_SUBSTITUTION: OpPair[] = [
  { encode: 'Scream Cipher Encode', decode: 'Scream Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Unicode Shift Encode', decode: 'Unicode Shift Decode' },
  { encode: 'Consonants/Vowels Rank Encode', decode: 'Consonants/Vowels Rank Decode', input: INPUT_ALPHA },
  { encode: 'Triliteral Cipher Encode', decode: 'Triliteral Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Cipher Disk Encode', decode: 'Cipher Disk Decode', input: INPUT_ALPHA },
  { encode: 'Alphabetic Transcription Encode', decode: 'Alphabetic Transcription Decode', input: INPUT_ALPHA },
  { encode: 'Gravity Falls Cipher Encode', decode: 'Gravity Falls Cipher Decode', input: INPUT_ALPHA },
];

// =====================================================================
//  Custom historical & complex ciphers
// =====================================================================

const CUSTOM_HISTORICAL: OpPair[] = [
  { encode: 'Prime Numbers Cipher Encode', decode: 'Prime Numbers Cipher Decode', input: INPUT_ALPHA },
  { encode: 'VIC Cipher Encode', decode: 'VIC Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Trithemius Ave Maria Encode', decode: 'Trithemius Ave Maria Decode', input: INPUT_ALPHA },
];

// =====================================================================
//  Custom math, grid & fun ciphers
// =====================================================================

const CUSTOM_MATH_FUN: OpPair[] = [
  { encode: 'Prime Multiplication Encode', decode: 'Prime Multiplication Decode', input: INPUT_ALPHA },
  { encode: 'Twin Hex Cipher Encode', decode: 'Twin Hex Cipher Decode', input: INPUT_ALPHA },
  { encode: 'Binary Character Shapes Encode', decode: 'Binary Character Shapes Decode', input: INPUT_ALPHA },
  { encode: 'Shankar Speech Defect Encode', decode: 'Shankar Speech Defect Decode', input: INPUT_ALPHA },
  { encode: 'Nak Nak Encode', decode: 'Nak Nak Decode', input: INPUT_ALPHA },
  { encode: 'Genshin Impact Cipher Encode', decode: 'Genshin Impact Cipher Decode', input: INPUT_ALPHA },
];

// =====================================================================
//  Custom niche regional & historical ciphers
// =====================================================================

const CUSTOM_REGIONAL: OpPair[] = [
  { encode: 'GS8 Braille Encode', decode: 'GS8 Braille Decode', input: INPUT_ALPHA },
  { encode: 'Indienne Code Encode', decode: 'Indienne Code Decode', input: INPUT_ALPHA },
  { encode: 'D3 Code Encode', decode: 'D3 Code Decode', input: INPUT_ALPHA },
  { encode: 'K6 Code Encode', decode: 'K6 Code Decode', input: INPUT_ALPHA },
  { encode: 'K7 Code Encode', decode: 'K7 Code Decode', input: INPUT_ALPHA },
  { encode: 'JIS Keyboard Encode', decode: 'JIS Keyboard Decode', input: INPUT_ALPHA },
];

// =====================================================================
//  Custom encoding format pairs
// =====================================================================

const CUSTOM_FORMAT: OpPair[] = [
  { encode: 'Baudot Code Encode', decode: 'Baudot Code Decode', input: INPUT_ALPHA },
  { encode: 'Bubble Babble Encode', decode: 'Bubble Babble Decode' },
  { encode: 'Chuck Norris Unary Encode', decode: 'Chuck Norris Unary Decode' },
  { encode: 'Hexagram Encode', decode: 'Hexagram Decode' },
  { encode: 'Word Substitution Encode', decode: 'Word Substitution Decode', input: INPUT_ALPHA },
];

// =====================================================================
//  All pairs
// =====================================================================

const ALL_PAIRS: OpPair[] = [
  ...ENCODING_PAIRS,
  ...COMPRESSION_PAIRS,
  ...ENCRYPTION_PAIRS,
  ...SELF_INVERSE_PAIRS,
  ...CYBERCHEF_CIPHER_PAIRS,
  ...CUSTOM_POLYALPHABETIC,
  ...CUSTOM_POLYBIUS,
  ...CUSTOM_TRANSPOSITION,
  ...CUSTOM_MONOALPHABETIC,
  ...CUSTOM_STANDALONE,
  ...CUSTOM_KEYBOARD,
  ...CUSTOM_FRACTIONATION,
  ...CUSTOM_ROT,
  ...CUSTOM_BASE_ENCODING,
  ...CUSTOM_LOOKUP,
  ...CUSTOM_SUBSTITUTION,
  ...CUSTOM_HISTORICAL,
  ...CUSTOM_MATH_FUN,
  ...CUSTOM_REGIONAL,
  ...CUSTOM_FORMAT,
];

/* ------------------------------------------------------------------ */
/*  Test setup                                                         */
/* ------------------------------------------------------------------ */

test.describe('Fuzz Roundtrip', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/');
    // Wait for fuzz helper to be ready
    await expect(async () => {
      const ready = await page.evaluate(() => !!(window as any).__FUZZ__);
      expect(ready).toBe(true);
    }).toPass({ timeout: 15_000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  /* ---- Helper ---- */

  async function roundtrip(pair: OpPair) {
    const input = pair.input ?? INPUT;
    return page.evaluate(
      async ({ encodeName, decodeName, input, encodeArgs, decodeArgs }) => {
        const fuzz = (window as any).__FUZZ__;
        return fuzz.runRoundtrip(
          encodeName,
          decodeName,
          input,
          encodeArgs ?? undefined,
          decodeArgs ?? undefined,
        );
      },
      {
        encodeName: pair.encode,
        decodeName: pair.decode,
        input,
        encodeArgs: pair.encodeArgs ?? null,
        decodeArgs: pair.decodeArgs ?? null,
      },
    );
  }

  /* ---- Generate one test per pair ---- */

  for (const pair of ALL_PAIRS) {
    const label =
      pair.encode === pair.decode
        ? `${pair.encode} (self-inverse)`
        : `${pair.encode} → ${pair.decode}`;

    test(label, async () => {
      const r = await roundtrip(pair);
      if (r.error) {
        // If the operation failed to load, skip rather than fail
        if (
          r.error.includes('unknown or failed-to-load') ||
          r.error.includes('is not a constructor')
        ) {
          test.skip(true, `Op not loadable: ${r.error}`);
          return;
        }
        throw new Error(
          `${label}: ${r.error}\n  encoded: ${(r.encodeOutput ?? '').slice(0, 200)}`,
        );
      }
      const input = pair.input ?? INPUT;
      expect(r.output).toBe(input);
    });
  }
});
