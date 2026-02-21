import MagicLib from '@cyberchef/lib/Magic.mjs';
import Dish from '@cyberchef/Dish.mjs';
import { OperationAdapter } from '../adapter/OperationAdapter';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface MagicHintSuggestion {
  recipe: { op: string; args: any[] }[];
  preview: string; // first ~100 chars of decoded output
  entropy: number;
}

export interface MagicHint {
  entropy: number;
  fileType: { mime: string; ext: string } | null;
  languages: { lang: string; probability: number }[];
  matchingOps: { op: string; args: any[] }[];
  isUTF8: boolean;
  suggestions: MagicHintSuggestion[];
}

export interface MagicSuggestion {
  recipe: { op: string; args: any[] }[];
  data: string;
  fileType: { mime: string; ext: string } | null;
  entropy: number;
  isUTF8: boolean;
  useful: boolean;
  matchesCrib: boolean;
  languageScores: { lang: string; probability: number }[];
  matchingOps: { op: string; args: any[] }[];
}

/* ------------------------------------------------------------------ */
/*  Monkey-patch Magic._runRecipe to use OperationAdapter              */
/*                                                                     */
/*  The original _runRecipe imports Recipe.mjs which eagerly loads      */
/*  ALL 460+ operation modules via OpModules.mjs. Several of those     */
/*  have CJS deps that break under Vite (argon2-browser, etc.).        */
/*  Our OperationAdapter loads operations individually on demand.       */
/* ------------------------------------------------------------------ */

let patched = false;


function patchMagicRunRecipe() {
  if (patched) return;
  patched = true;

  (MagicLib.prototype as any)._runRecipe = async function (
    this: any,
    recipeConfig: { op: string; args: any[] }[],
    input?: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    let buf: ArrayBuffer = input ?? this.inputBuffer;
    buf = buf instanceof ArrayBuffer ? buf : (buf as any).buffer;

    let dish = new Dish();
    dish.set(buf, Dish.ARRAY_BUFFER);

    try {
      for (const step of recipeConfig) {
        const adapter = await OperationAdapter.create(step.op);
        dish = await adapter.execute(dish, step.args);
      }
      return await dish.get(Dish.ARRAY_BUFFER);
    } catch {
      return new ArrayBuffer(0);
    }
  };
}

/* ------------------------------------------------------------------ */
/*  Extra operation criteria (ops that CyberChef doesn't auto-detect)  */
/* ------------------------------------------------------------------ */

const EXTRA_CRITERIA: any[] = [
  {
    op: 'From Base92',
    // Base92 charset: ! (33), #-_ (35-95), a-} (97-125)
    // Stricter: 16+ chars, no spaces, must contain special Base92 chars
    pattern: /^[!#-_a-}]{16,}$/,
    args: [],
    useful: false,
  },
];

/** Create a Magic instance with our extra detection criteria injected. */
function createMagic(buf: ArrayBuffer): InstanceType<typeof MagicLib> {
  const magic = new MagicLib(buf);
  for (const c of EXTRA_CRITERIA) {
    (magic as any).opCriteria.push(c);
  }
  return magic;
}

/* ------------------------------------------------------------------ */
/*  Signature-based detection for images, archives, compression        */
/* ------------------------------------------------------------------ */

interface Signature {
  /** Human label (for preview text) */
  label: string;
  /** Byte pattern to match at a given offset */
  bytes: number[];
  /** Byte offset to check (default 0) */
  offset?: number;
  /** Recipe steps to apply *after* decoding the outer layer */
  recipe: { op: string; args: any[] }[];
}

const SIGNATURES: Signature[] = [
  // Images
  { label: 'PNG image',  bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], recipe: [{ op: 'Render Image', args: [] }] },
  { label: 'JPEG image', bytes: [0xff, 0xd8, 0xff],                                recipe: [{ op: 'Render Image', args: [] }] },
  { label: 'GIF image',  bytes: [0x47, 0x49, 0x46, 0x38],                          recipe: [{ op: 'Render Image', args: [] }] },
  { label: 'BMP image',  bytes: [0x42, 0x4d],                                      recipe: [{ op: 'Render Image', args: [] }] },
  { label: 'WebP image', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0,               recipe: [{ op: 'Render Image', args: [] }] }, // RIFF header; also check offset 8 for WEBP
  { label: 'ICO image',  bytes: [0x00, 0x00, 0x01, 0x00],                          recipe: [{ op: 'Render Image', args: [] }] },
  { label: 'TIFF image', bytes: [0x49, 0x49, 0x2a, 0x00],                          recipe: [{ op: 'Render Image', args: [] }] },
  { label: 'TIFF image', bytes: [0x4d, 0x4d, 0x00, 0x2a],                          recipe: [{ op: 'Render Image', args: [] }] },

  // Compression / archives
  { label: 'Gzip data',        bytes: [0x1f, 0x8b],                                   recipe: [{ op: 'Gunzip', args: [] }] },
  { label: 'Zip archive',      bytes: [0x50, 0x4b, 0x03, 0x04],                       recipe: [{ op: 'Unzip', args: ['', false] }] },
  { label: 'Bzip2 data',       bytes: [0x42, 0x5a, 0x68],                             recipe: [{ op: 'Bzip2 Decompress', args: [] }] },
  { label: 'Zlib data',        bytes: [0x78, 0x9c],                                   recipe: [{ op: 'Zlib Inflate', args: [0, 0, 'Adaptive', false, false] }] },
  { label: 'Zlib data',        bytes: [0x78, 0x01],                                   recipe: [{ op: 'Zlib Inflate', args: [0, 0, 'Adaptive', false, false] }] },
  { label: 'Zlib data',        bytes: [0x78, 0xda],                                   recipe: [{ op: 'Zlib Inflate', args: [0, 0, 'Adaptive', false, false] }] },
  { label: 'Zlib data (dict)', bytes: [0x78, 0xbb],                                   recipe: [{ op: 'Zlib Inflate', args: [0, 0, 'Adaptive', false, false] }] },
  { label: 'XZ data',          bytes: [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00],           recipe: [{ op: 'LZMA Decompress', args: [] }] },
  { label: 'LZMA data',        bytes: [0x5d, 0x00, 0x00],                             recipe: [{ op: 'LZMA Decompress', args: [] }] },
  { label: 'LZ4 frame',        bytes: [0x04, 0x22, 0x4d, 0x18],                       recipe: [{ op: 'LZ4 Decompress', args: [] }] },
  { label: 'Tar archive',      bytes: [0x75, 0x73, 0x74, 0x61, 0x72], offset: 257,    recipe: [{ op: 'Untar', args: [] }] },

  // PDF, SVG
  { label: 'PDF document', bytes: [0x25, 0x50, 0x44, 0x46],                         recipe: [] },
];

/** Extra RIFF check: bytes 8–11 = "WEBP" */
function isWebP(u8: Uint8Array): boolean {
  return u8.length > 11 && u8[8] === 0x57 && u8[9] === 0x45 && u8[10] === 0x42 && u8[11] === 0x50;
}

function matchSignature(u8: Uint8Array, sig: Signature): boolean {
  const off = sig.offset ?? 0;
  if (u8.length < off + sig.bytes.length) return false;
  for (let i = 0; i < sig.bytes.length; i++) {
    if (u8[off + i] !== sig.bytes[i]) return false;
  }
  // Special case: RIFF header needs WEBP at offset 8
  if (sig.label === 'WebP image') return isWebP(u8);
  return true;
}

/** Try to decode base64 text into raw bytes. Returns null on failure. */
function tryBase64Decode(u8: Uint8Array): Uint8Array | null {
  // Check if it looks like base64 (only valid b64 chars, length > 8)
  if (u8.length < 8) return null;
  for (let i = 0; i < Math.min(u8.length, 256); i++) {
    const c = u8[i];
    if (
      (c >= 0x41 && c <= 0x5a) || // A-Z
      (c >= 0x61 && c <= 0x7a) || // a-z
      (c >= 0x30 && c <= 0x39) || // 0-9
      c === 0x2b || c === 0x2f || c === 0x3d || // +/=
      c === 0x2d || c === 0x5f || // URL-safe: -_
      c === 0x0a || c === 0x0d || c === 0x20 // whitespace
    ) continue;
    return null;
  }
  try {
    const str = new TextDecoder().decode(u8).replace(/[\s]/g, '');
    const binary = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

/** Try to decode hex text into raw bytes. Returns null on failure. */
function tryHexDecode(u8: Uint8Array): Uint8Array | null {
  if (u8.length < 4) return null;
  // Collect hex chars, skipping common delimiters
  const hexChars: number[] = [];
  for (let i = 0; i < Math.min(u8.length, 512); i++) {
    const c = u8[i];
    if ((c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x46) || (c >= 0x61 && c <= 0x66)) {
      hexChars.push(c);
    } else if (c === 0x20 || c === 0x3a || c === 0x2c || c === 0x0a || c === 0x0d) {
      // space, colon, comma, newline — skip
    } else {
      return null;
    }
  }
  if (hexChars.length < 4 || hexChars.length % 2 !== 0) return null;
  // Decode hex pairs
  const out = new Uint8Array(hexChars.length / 2);
  for (let i = 0; i < out.length; i++) {
    const hi = hexChars[i * 2];
    const lo = hexChars[i * 2 + 1];
    out[i] = (hexVal(hi) << 4) | hexVal(lo);
  }
  return out;
}

function hexVal(c: number): number {
  if (c >= 0x30 && c <= 0x39) return c - 0x30;
  if (c >= 0x41 && c <= 0x46) return c - 0x41 + 10;
  return c - 0x61 + 10;
}

/**
 * Detect known file signatures in raw bytes, and also through
 * base64 and hex encoding layers. Returns suggestions to prepend
 * to quick magic results.
 */
function detectSignatures(buf: ArrayBuffer): MagicHintSuggestion[] {
  const suggestions: MagicHintSuggestion[] = [];
  const u8 = new Uint8Array(buf);

  // Layer 0: raw bytes — binary file signatures
  for (const sig of SIGNATURES) {
    if (matchSignature(u8, sig) && sig.recipe.length > 0) {
      suggestions.push({
        recipe: sig.recipe,
        preview: sig.label,
        entropy: 0,
      });
    }
  }

  // Layer 1: try base64 decode → check for binary signatures inside
  const b64 = tryBase64Decode(u8);
  if (b64 && b64.length >= 4) {
    for (const sig of SIGNATURES) {
      if (matchSignature(b64, sig) && sig.recipe.length > 0) {
        suggestions.push({
          recipe: [{ op: 'From Base64', args: ['A-Za-z0-9+/=', true, false] }, ...sig.recipe],
          preview: `Base64 → ${sig.label}`,
          entropy: 0,
        });
      }
    }
  }

  // Layer 2: try hex decode → check for binary signatures inside
  const hex = tryHexDecode(u8);
  if (hex && hex.length >= 4) {
    for (const sig of SIGNATURES) {
      if (matchSignature(hex, sig) && sig.recipe.length > 0) {
        suggestions.push({
          recipe: [{ op: 'From Hex', args: ['Auto'] }, ...sig.recipe],
          preview: `Hex → ${sig.label}`,
          entropy: 0,
        });
      }
    }
  }

  // Layer 3: text-based encoding detection
  const text = tryDecodeTextFromBuf(u8);
  if (text !== null && text.length >= 4) {
    detectTextEncodings(text, b64, hex, suggestions);
  }

  return suggestions;
}

/* ------------------------------------------------------------------ */
/*  Text-based encoding pattern detection                              */
/* ------------------------------------------------------------------ */

/** Adds a suggestion if the op isn't already suggested. */
function addSuggestion(
  suggestions: MagicHintSuggestion[],
  op: string,
  args: any[],
  preview: string,
  entropy?: number,
) {
  if (suggestions.some((s) => s.recipe[0]?.op === op)) return;
  // If entropy not provided, compute from preview if it's decoded text,
  // otherwise use a pessimistic default (8 = max Shannon entropy for bytes).
  const ent = entropy ?? (isPrintableAscii(preview) && preview.length >= 4
    ? shannonEntropy(preview) : 8);
  suggestions.push({ recipe: [{ op, args }], preview: preview.slice(0, 80), entropy: ent });
}

/** Compute Shannon entropy of a string (bits per character). */
function shannonEntropy(s: string): number {
  if (s.length === 0) return 0;
  const freq = new Map<number, number>();
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    freq.set(c, (freq.get(c) ?? 0) + 1);
  }
  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / s.length;
    entropy -= p * Math.log2(p);
  }
  return Math.round(entropy * 100) / 100;
}

/**
 * Detect all "From ..." encoding patterns in text output.
 * Each detector is fast (regex + simple decode) and adds suggestions.
 */
function detectTextEncodings(
  text: string,
  b64: Uint8Array | null,
  hex: Uint8Array | null,
  suggestions: MagicHintSuggestion[],
) {
  const trimmed = text.trim();

  // From Base64 — standard A-Za-z0-9+/= charset
  if (b64 && b64.length >= 4) {
    const decoded = tryDecodeText(b64);
    if (decoded !== null) addSuggestion(suggestions, 'From Base64', ['A-Za-z0-9+/=', true, false], decoded);
  }

  // From Hex — pairs of hex digits
  if (hex && hex.length >= 4) {
    const decoded = tryDecodeText(hex);
    if (decoded !== null) addSuggestion(suggestions, 'From Hex', ['Auto'], decoded);
  }

  // From Base32 — A-Z2-7 with = padding
  if (/^[A-Z2-7\s=]{8,}$/.test(trimmed) && trimmed.length >= 8) {
    const clean = trimmed.replace(/\s/g, '');
    if (clean.length % 8 <= 6) { // valid base32 padding
      try {
        const decoded = base32Decode(clean);
        if (decoded) addSuggestion(suggestions, 'From Base32', ['A-Z2-7=', true], decoded);
      } catch { /* not valid base32 */ }
    }
  }

  // From Base58 — 1-9A-HJ-NP-Za-km-z (no 0, O, I, l)
  if (/^[1-9A-HJ-NP-Za-km-z]{20,}$/.test(trimmed)) {
    addSuggestion(suggestions, 'From Base58', ['123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', true], 'Base58-encoded data');
  }

  // From Base85 / Ascii85 — <~...~> delimiters
  if (/^<~[\s!-uz]+~>$/.test(trimmed)) {
    addSuggestion(suggestions, 'From Base85', ['!-u', false, ''], 'Ascii85-encoded data');
  }

  // From Binary — groups of 8 binary digits
  if (/^[01]{8}([\s,;:]+[01]{8}){2,}[\s,;:]*$/.test(trimmed)) {
    const bits = trimmed.replace(/[\s,;:]+/g, ' ').split(' ').filter(Boolean);
    if (bits.every((b) => b.length === 8)) {
      const decoded = bits.map((b) => String.fromCharCode(parseInt(b, 2))).join('');
      if (isPrintableAscii(decoded)) addSuggestion(suggestions, 'From Binary', ['Space', 8], decoded);
    }
  }

  // From Octal — groups of 3 octal digits (0-377)
  if (/^[0-3]?[0-7]{1,2}([\s,;:]+[0-3]?[0-7]{1,2}){2,}[\s,;:]*$/.test(trimmed)) {
    const parts = trimmed.split(/[\s,;:]+/).filter(Boolean);
    const nums = parts.map((p) => parseInt(p, 8));
    if (nums.every((n) => n >= 0 && n <= 255)) {
      const decoded = nums.map((n) => String.fromCharCode(n)).join('');
      if (isPrintableAscii(decoded)) addSuggestion(suggestions, 'From Octal', ['Space'], decoded);
    }
  }

  // From Decimal — space/comma-separated byte values (0-255)
  if (/^\d{1,3}([\s,;:]+\d{1,3}){2,}[\s,;:]*$/.test(trimmed)) {
    const parts = trimmed.split(/[\s,;:]+/).filter(Boolean);
    const nums = parts.map(Number);
    if (nums.every((n) => n >= 0 && n <= 255)) {
      const decoded = nums.map((n) => String.fromCharCode(n)).join('');
      if (isPrintableAscii(decoded)) addSuggestion(suggestions, 'From Decimal', ['Space', false], decoded);
    }
  }

  // From Charcode — larger numbers as Unicode codepoints (hex or decimal)
  if (/^(?:0x)?[0-9A-Fa-f]{2,4}([\s,;:]+(?:0x)?[0-9A-Fa-f]{2,4}){2,}[\s,;:]*$/.test(trimmed)) {
    const parts = trimmed.split(/[\s,;:]+/).filter(Boolean);
    const base = parts[0].startsWith('0x') ? 16 : (/[A-Fa-f]/.test(trimmed) ? 16 : 0);
    if (base) {
      const nums = parts.map((p) => parseInt(p.replace(/^0x/i, ''), base));
      if (nums.every((n) => n >= 32 && n <= 0x10FFFF)) {
        const decoded = String.fromCodePoint(...nums);
        if (decoded.length > 0) addSuggestion(suggestions, 'From Charcode', [base === 16 ? 'Space' : 'Space', base], decoded);
      }
    }
  }

  // From Morse Code — dots and dashes with letter/word separators
  if (/^[.\-·\u2022_ /|\\]{5,}$/.test(trimmed) || /^(?:(?:\.\-?|\-\.?){1,6}[\s/|])+/.test(trimmed)) {
    const normalized = trimmed.replace(/·|\u2022/g, '.').replace(/_/g, '-');
    if (/^[.\- /|\\]+$/.test(normalized) && /[.\-]{2,}/.test(normalized)) {
      const words = normalized.split(/\s{2,}|[/|\\]/);
      const decoded = words.map((w) =>
        w.trim().split(/\s+/).map((ch) => MORSE_REVERSE.get(ch) ?? '?').join(''),
      ).join(' ');
      if (decoded.length > 0 && !decoded.includes('?'))
        addSuggestion(suggestions, 'From Morse Code', ['Space', 'Line feed'], decoded);
    }
  }

  // From HTML Entity — &...; patterns
  if (/&(?:#\d{2,4}|#x[\da-fA-F]{2,4}|[a-zA-Z]{2,8});/.test(trimmed)) {
    const count = (trimmed.match(/&(?:#\d{2,4}|#x[\da-fA-F]{2,4}|[a-zA-Z]{2,8});/g) || []).length;
    if (count >= 2) {
      const decoded = trimmed
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
        .replace(/&#x([\da-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
        .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"').replace(/&apos;/gi, "'");
      if (decoded !== trimmed) addSuggestion(suggestions, 'From HTML Entity', [], decoded);
    }
  }

  // From Hexdump — address:hex:ascii format
  if (/^[\da-fA-F]{4,8}[:\s]+(?:[\da-fA-F]{2}\s)+/m.test(trimmed) && trimmed.includes('\n')) {
    addSuggestion(suggestions, 'From Hexdump', [], 'Hexdump data');
  }

  // From Quoted Printable — =XX encoding
  if (/=[0-9A-Fa-f]{2}/.test(trimmed)) {
    const qpCount = (trimmed.match(/=[0-9A-Fa-f]{2}/g) || []).length;
    if (qpCount >= 2 && qpCount / trimmed.length > 0.03) {
      const decoded = trimmed.replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/=\r?\n/g, '');
      if (decoded !== trimmed) addSuggestion(suggestions, 'From Quoted Printable', [], decoded);
    }
  }

  // From Braille — Unicode braille characters U+2800-U+28FF
  if (/[\u2800-\u28FF]{3,}/.test(trimmed)) {
    addSuggestion(suggestions, 'From Braille', [], 'Braille-encoded text');
  }

  // From Hex Content — |XX XX| SNORT format
  if (/\|[\da-fA-F]{2}(?:\s[\da-fA-F]{2})*\|/.test(trimmed)) {
    addSuggestion(suggestions, 'From Hex Content', [], 'Hex content (SNORT format)');
  }

  // From Modhex — Yubico modified hex [cbdefghijklnrtuv]+
  if (/^[cbdefghijklnrtuv]{16,}$/.test(trimmed)) {
    addSuggestion(suggestions, 'From Modhex', ['Auto'], 'Modhex-encoded data (Yubico)');
  }

  // URL Decode — %XX patterns
  if (/%[0-9A-Fa-f]{2}/.test(trimmed)) {
    const pctCount = (trimmed.match(/%[0-9A-Fa-f]{2}/g) || []).length;
    if (pctCount >= 2 && pctCount / trimmed.length > 0.05) {
      try {
        const decoded = decodeURIComponent(trimmed);
        if (decoded !== trimmed && isPrintableAscii(decoded.slice(0, 100)))
          addSuggestion(suggestions, 'URL Decode', [], decoded);
      } catch { /* invalid URL encoding */ }
    }
  }

  // From Punycode — xn-- prefix (internationalized domain names)
  if (/xn--[\w-]+/i.test(trimmed)) {
    addSuggestion(suggestions, 'From Punycode', [true], 'Punycode domain name');
  }

  // From UNIX Timestamp — 10-digit number (or 13-digit ms)
  if (/^1\d{9}$/.test(trimmed) || /^1\d{12}$/.test(trimmed)) {
    const unit = trimmed.length === 13 ? 'Milliseconds (ms)' : 'Seconds (s)';
    const ts = trimmed.length === 13 ? parseInt(trimmed) : parseInt(trimmed) * 1000;
    const date = new Date(ts);
    if (date.getFullYear() >= 2000 && date.getFullYear() <= 2100)
      addSuggestion(suggestions, 'From UNIX Timestamp', [unit], date.toISOString());
  }

  // From Case Insensitive Regex — [aA][bB] patterns
  if (/^\[.\.\](?:\[.\.\]){3,}$/.test(trimmed.replace(/\s/g, '')) ||
      /^(?:\[[A-Za-z][A-Za-z]\]){4,}$/.test(trimmed.replace(/\s/g, ''))) {
    const decoded = trimmed.replace(/\[(.)\.\]/g, '$1').replace(/\[(.).\]/g, '$1');
    if (decoded !== trimmed) addSuggestion(suggestions, 'From Case Insensitive Regex', [], decoded);
  }

  // Reverse — backwards text that reads better when reversed
  // Note: letter frequencies are identical when reversed, so chi-squared won't work.
  // Use bigram frequency analysis instead — English text has characteristic bigrams.
  if (trimmed.length >= 10) {
    const reversed = [...trimmed].reverse().join('');
    if (isMoreReadable(reversed, trimmed)) {
      addSuggestion(suggestions, 'Reverse', ['Character'], reversed.slice(0, 80));
    }
  }

  // ROT13 — alphabetic text where ROT13 produces better English frequency match
  if (trimmed.length >= 10) {
    const alphaOnly = trimmed.replace(/[^A-Za-z]/g, '');
    if (alphaOnly.length >= 8 && alphaOnly.length / trimmed.replace(/\s/g, '').length > 0.4) {
      const rot13 = applyROT13(trimmed);
      if (isMoreEnglishLike(rot13, trimmed)) {
        addSuggestion(suggestions, 'ROT13', [true, true, false, 13], rot13.slice(0, 80));
      }
    }
  }

  // ROT47 — printable ASCII where ROT47 produces more readable text
  if (trimmed.length >= 10 && /[!-~]/.test(trimmed)) {
    // Only try if text has unusual chars (non-alpha punctuation heavy)
    const unusual = [...trimmed].filter((c) => {
      const code = c.charCodeAt(0);
      return code >= 0x21 && code <= 0x7e && !((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a) || (code >= 0x30 && code <= 0x39) || code === 0x20);
    }).length;
    if (unusual / trimmed.length > 0.15) {
      const rot47 = applyROT47(trimmed);
      if (isMoreEnglishLike(rot47, trimmed)) {
        addSuggestion(suggestions, 'ROT47', [47], rot47.slice(0, 80));
      }
    }
  }

  // From Base92 — charset: ! (33), #-_ (35-95), a-} (97-125)
  // Must not contain spaces/newlines (Base92 never has them) and must have
  // a high ratio of non-alphanumeric special chars to distinguish from English text.
  if (/^[!#-_a-}]{16,}$/.test(trimmed) && !/\s/.test(trimmed)) {
    const specialCount = [...trimmed].filter((c) => {
      const code = c.charCodeAt(0);
      return (code >= 0x21 && code <= 0x2f) || // !#$%&'()*+,-./
             (code >= 0x3a && code <= 0x40) || // :;<=>?@
             (code >= 0x5b && code <= 0x5f) || // [\]^_
             code === 0x7b || code === 0x7c || code === 0x7d; // {|}
    }).length;
    // Base92 data typically has ~35% special chars; require at least 15%
    if (specialCount / trimmed.length >= 0.15) {
      addSuggestion(suggestions, 'From Base92', [], 'Base92-encoded data');
    }
  }

  // From Base62 — 0-9A-Za-z only, long strings (no +/= like Base64)
  if (/^[0-9A-Za-z]{20,}$/.test(trimmed) && /\d/.test(trimmed) && /[A-Z]/.test(trimmed) && /[a-z]/.test(trimmed)) {
    addSuggestion(suggestions, 'From Base62', ['0-9A-Za-z'], 'Base62-encoded data');
  }

  // From Base45 — 0-9A-Z $%*+-./: (used in EU Digital COVID Certificates)
  if (/^[0-9A-Z $%*+\-./:]{10,}$/.test(trimmed) && /[$%*+\-./:]/.test(trimmed)) {
    addSuggestion(suggestions, 'From Base45', ['0-9A-Z $%*+-./:'], 'Base45-encoded data');
  }
}

/** Morse reverse lookup table for quick detection */
const MORSE_REVERSE = new Map([
  ['.-', 'A'], ['-...', 'B'], ['-.-.', 'C'], ['-..', 'D'], ['.', 'E'],
  ['..-.', 'F'], ['--.', 'G'], ['....', 'H'], ['..', 'I'], ['.---', 'J'],
  ['-.-', 'K'], ['.-..', 'L'], ['--', 'M'], ['-.', 'N'], ['---', 'O'],
  ['.--.', 'P'], ['--.-', 'Q'], ['.-.', 'R'], ['...', 'S'], ['-', 'T'],
  ['..-', 'U'], ['...-', 'V'], ['.--', 'W'], ['-..-', 'X'], ['-.--', 'Y'],
  ['--..', 'Z'], ['.----', '1'], ['..---', '2'], ['...--', '3'], ['....-', '4'],
  ['.....', '5'], ['-....', '6'], ['--...', '7'], ['---..', '8'], ['----.', '9'],
  ['-----', '0'],
]);

/** Minimal Base32 decoder for detection (RFC 4648). */
function base32Decode(input: string): string | null {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = input.replace(/=+$/, '');
  const bits: number[] = [];
  for (const c of clean) {
    const idx = alpha.indexOf(c);
    if (idx < 0) return null;
    for (let i = 4; i >= 0; i--) bits.push((idx >> i) & 1);
  }
  const bytes: number[] = [];
  for (let i = 0; i + 7 < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    bytes.push(byte);
  }
  const text = String.fromCharCode(...bytes);
  return isPrintableAscii(text) ? text : null;
}

/* ------------------------------------------------------------------ */
/*  Lightweight analysis for auto-magic on leaf nodes                   */
/* ------------------------------------------------------------------ */

export function quickMagic(buf: ArrayBuffer): MagicHint {
  patchMagicRunRecipe();
  const magic = createMagic(buf);

  const entropy = magic.calcEntropy();
  const ft: any = magic.detectFileType();
  const langs = magic.detectLanguage(false);
  const ops = magic.findMatchingInputOps();

  return {
    entropy,
    fileType: ft ? { mime: ft.mime, ext: ft.ext } : null,
    languages: langs.slice(0, 3).map((l: any) => ({
      lang: l.lang,
      probability: l.probability,
    })),
    matchingOps: ops.map((o: any) => ({ op: o.op, args: o.args })),
    isUTF8: !!magic.inputStr && isValidUTF8(buf),
    suggestions: [],
  };
}

/* ------------------------------------------------------------------ */
/*  Fast auto-magic: sync analysis + signature detection (no spec exec)*/
/* ------------------------------------------------------------------ */

/**
 * Lightweight magic analysis for auto-magic hints on leaf nodes.
 * Runs only safe synchronous analysis (entropy, file type, language)
 * plus fast signature detection.  Skips `findMatchingInputOps` which
 * can hang due to catastrophic regex backtracking on certain inputs,
 * and does NOT run `speculativeExecution`.
 */
export function quickMagicFast(buf: ArrayBuffer): MagicHint {
  patchMagicRunRecipe();
  const magic = createMagic(buf);

  const entropy = magic.calcEntropy();
  const ft: any = magic.detectFileType();
  const langs = magic.detectLanguage(false);
  // NOTE: magic.findMatchingInputOps() is intentionally omitted —
  // it can hang on certain inputs due to catastrophic backtracking.

  return {
    entropy,
    fileType: ft ? { mime: ft.mime, ext: ft.ext } : null,
    languages: langs.slice(0, 3).map((l: any) => ({
      lang: l.lang,
      probability: l.probability,
    })),
    matchingOps: [],
    isUTF8: !!magic.inputStr && isValidUTF8(buf),
    suggestions: detectSignatures(buf),
  };
}

/* ------------------------------------------------------------------ */
/*  Auto-magic: quick analysis + shallow speculative execution         */
/* ------------------------------------------------------------------ */

export async function quickMagicWithSuggestions(buf: ArrayBuffer): Promise<MagicHint> {
  const hint = quickMagic(buf);

  // Signature-based detection (instant, no speculative execution)
  const sigSuggestions = detectSignatures(buf);

  try {
    const magic = createMagic(buf);
    const results: any[] = await magic.speculativeExecution(3, true, false, [], false, null as any);

    // Filter: skip identity (no recipe) and deduplicate by preview text.
    const seen = new Set<string>();
    hint.suggestions = [];

    // Add signature suggestions first (highest priority)
    for (const s of sigSuggestions) {
      const key = s.recipe.map((r) => r.op).join('+');
      if (seen.has(key)) continue;
      seen.add(key);
      hint.suggestions.push(s);
    }

    for (const r of results) {
      const recipe = (r.recipe ?? []).map((step: any) => ({ op: step.op, args: step.args }));
      if (recipe.length === 0) continue; // skip identity/current
      const key = recipe.map((s: any) => s.op).join('+');
      if (seen.has(key)) continue; // skip duplicate recipe paths
      const preview = typeof r.data === 'string' ? r.data.slice(0, 100) : '';
      if (!isPrintableAscii(preview)) continue; // skip non-ASCII results
      seen.add(key);
      hint.suggestions.push({ recipe, preview, entropy: r.entropy ?? 0 });
      if (hint.suggestions.length >= 12) break;
    }
    hint.suggestions.sort((a, b) => a.entropy - b.entropy);
  } catch {
    if (hint.suggestions.length === 0) {
      hint.suggestions = sigSuggestions;
    }
  }

  return hint;
}

/* ------------------------------------------------------------------ */
/*  Intensive analysis for background magic pass                       */
/* ------------------------------------------------------------------ */

export async function intensiveMagicWithSuggestions(buf: ArrayBuffer): Promise<MagicHint> {
  const hint = quickMagic(buf);
  const sigSuggestions = detectSignatures(buf);

  try {
    const magic = createMagic(buf);
    const results: any[] = await magic.speculativeExecution(5, true, true, [], false, null as any);

    const seen = new Set<string>();
    hint.suggestions = [];

    for (const s of sigSuggestions) {
      const key = s.recipe.map((r) => r.op).join('+');
      if (seen.has(key)) continue;
      seen.add(key);
      hint.suggestions.push(s);
    }

    for (const r of results) {
      const recipe = (r.recipe ?? []).map((step: any) => ({ op: step.op, args: step.args }));
      if (recipe.length === 0) continue;
      const key = recipe.map((s: any) => s.op).join('+');
      if (seen.has(key)) continue;
      const preview = typeof r.data === 'string' ? r.data.slice(0, 100) : '';
      if (!isPrintableAscii(preview)) continue;
      seen.add(key);
      hint.suggestions.push({ recipe, preview, entropy: r.entropy ?? 0 });
      if (hint.suggestions.length >= 12) break;
    }
    hint.suggestions.sort((a, b) => a.entropy - b.entropy);
  } catch {
    if (hint.suggestions.length === 0) {
      hint.suggestions = sigSuggestions;
    }
  }

  return hint;
}

/* ------------------------------------------------------------------ */
/*  Full speculative execution for the Magic node                      */
/* ------------------------------------------------------------------ */

export async function runMagic(
  buf: ArrayBuffer,
  depth: number,
  intensive: boolean,
  extLang: boolean,
  crib: string,
): Promise<MagicSuggestion[]> {
  patchMagicRunRecipe();
  const magic = createMagic(buf);
  const cribRegex: any = crib ? new RegExp(crib, 'i') : null;

  let results: any[] = await magic.speculativeExecution(
    depth,
    extLang,
    intensive,
    [],
    false,
    cribRegex,
  );

  // Filter to crib matches when a crib is provided (same as CyberChef)
  if (cribRegex) {
    results = results.filter((r: any) => r.matchesCrib);
  }

  const mapped = results.map((r: any) => ({
    recipe: (r.recipe ?? []).map((s: any) => ({ op: s.op, args: s.args })),
    data: typeof r.data === 'string' ? r.data.slice(0, 100) : '',
    fileType: r.fileType ? { mime: r.fileType.mime ?? '', ext: r.fileType.ext ?? '' } : null,
    entropy: r.entropy,
    isUTF8: !!r.isUTF8,
    useful: !!r.useful,
    matchesCrib: !!r.matchesCrib,
    languageScores: (r.languageScores ?? []).slice(0, 3).map((l: any) => ({
      lang: l.lang, probability: l.probability,
    })),
    matchingOps: (r.matchingOps ?? []).map((o: any) => ({
      op: o.op,
      args: o.args,
    })),
  }));

  // Augment with our custom text encoding detections (ROT13, Reverse, etc.)
  // that CyberChef's speculative execution doesn't cover.
  const sigSuggestions = detectSignatures(buf);
  const seenOps = new Set(mapped.map((m) => m.recipe.map((step: any) => step.op).join('+')));
  for (const s of sigSuggestions) {
    const key = s.recipe.map((r) => r.op).join('+');
    if (seenOps.has(key)) continue;
    seenOps.add(key);
    // Check if crib matches the preview
    const matchesCrib = cribRegex ? cribRegex.test(s.preview) : false;
    if (cribRegex && !matchesCrib) continue; // skip non-matching when crib filter is active
    mapped.push({
      recipe: s.recipe,
      data: s.preview,
      fileType: null,
      entropy: s.entropy,
      isUTF8: true,
      useful: true,
      matchesCrib,
      languageScores: [],
      matchingOps: [],
    });
  }

  return mapped;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Returns true if every character is printable ASCII (0x20–0x7E) or common whitespace. */
function isPrintableAscii(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0x20 && c <= 0x7e) continue;
    if (c === 0x09 || c === 0x0a || c === 0x0d) continue; // tab, LF, CR
    return false;
  }
  return true;
}

/** Try to decode a Uint8Array as printable text. Returns null if it's not printable. */
function tryDecodeText(u8: Uint8Array): string | null {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(u8);
    if (text.length < 2) return null;
    // At least 70% of characters should be printable ASCII
    let printable = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if ((c >= 0x20 && c <= 0x7e) || c === 0x09 || c === 0x0a || c === 0x0d) printable++;
    }
    if (printable / text.length < 0.7) return null;
    return text;
  } catch {
    return null;
  }
}

/** Try to decode raw buffer bytes as printable text. Returns null if not printable. */
function tryDecodeTextFromBuf(u8: Uint8Array): string | null {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(u8);
    return text;
  } catch {
    return null;
  }
}

function isValidUTF8(buf: ArrayBuffer): boolean {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    decoder.decode(buf);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  ROT13 / ROT47 helpers                                              */
/* ------------------------------------------------------------------ */

function applyROT13(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c >= 0x41 && c <= 0x5a) out += String.fromCharCode(((c - 0x41 + 13) % 26) + 0x41);
    else if (c >= 0x61 && c <= 0x7a) out += String.fromCharCode(((c - 0x61 + 13) % 26) + 0x61);
    else out += text[i];
  }
  return out;
}

function applyROT47(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c >= 0x21 && c <= 0x7e) out += String.fromCharCode(((c - 0x21 + 47) % 94) + 0x21);
    else out += text[i];
  }
  return out;
}

// English letter frequencies for chi-squared comparison
const ENGLISH_FREQ_MAGIC = [
  0.082, 0.015, 0.028, 0.043, 0.127, 0.022, 0.020, 0.061, 0.070, 0.002,
  0.008, 0.040, 0.024, 0.067, 0.075, 0.019, 0.001, 0.060, 0.063, 0.091,
  0.028, 0.010, 0.023, 0.001, 0.020, 0.001,
];

/** Compute chi-squared of letter frequencies vs English. Lower = better match. */
function englishChi(text: string): number {
  const counts = new Array(26).fill(0);
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    let idx = -1;
    if (c >= 0x41 && c <= 0x5a) idx = c - 0x41;
    else if (c >= 0x61 && c <= 0x7a) idx = c - 0x61;
    if (idx >= 0) { counts[idx]++; total++; }
  }
  if (total < 5) return Infinity;
  let chi = 0;
  for (let i = 0; i < 26; i++) {
    const expected = ENGLISH_FREQ_MAGIC[i] * total;
    if (expected > 0) {
      const diff = counts[i] - expected;
      chi += (diff * diff) / expected;
    }
  }
  return chi;
}

/** Returns true if `candidate` has significantly better English frequency match than `original`. */
function isMoreEnglishLike(candidate: string, original: string): boolean {
  const chiOrig = englishChi(original);
  const chiCand = englishChi(candidate);
  // Candidate must be at least 40% better and reasonably English-like
  return chiCand < chiOrig * 0.6 && chiCand < 200;
}

/** Common English bigrams — the 30 most frequent letter pairs. */
const COMMON_BIGRAMS = new Set([
  'th','he','in','er','an','re','ed','on','es','st',
  'en','at','to','nt','ha','nd','ou','ea','ng','as',
  'or','ti','is','et','it','ar','te','se','hi','of',
]);

/**
 * Count how many alphabetic bigrams in `text` are common English bigrams.
 * Returns ratio of common bigrams to total alphabetic bigrams.
 */
function bigramScore(text: string): number {
  const lower = text.toLowerCase();
  let common = 0;
  let total = 0;
  for (let i = 0; i < lower.length - 1; i++) {
    const a = lower.charCodeAt(i);
    const b = lower.charCodeAt(i + 1);
    if ((a >= 97 && a <= 122) && (b >= 97 && b <= 122)) {
      total++;
      if (COMMON_BIGRAMS.has(lower[i] + lower[i + 1])) common++;
    }
  }
  return total > 0 ? common / total : 0;
}

/**
 * Returns true if `candidate` is more readable than `original`.
 * Uses multiple heuristics since letter frequencies (chi-squared) are
 * identical in both directions and can't detect reversal.
 */
function isMoreReadable(candidate: string, original: string): boolean {
  let candPts = 0;
  let origPts = 0;

  // 1. Bigram analysis — for English prose
  const candBi = bigramScore(candidate);
  const origBi = bigramScore(original);
  if (candBi > origBi + 0.03) candPts += 2;
  else if (origBi > candBi + 0.03) origPts += 2;

  // 2. Bracket ordering — { before }, ( before ), [ before ]
  candPts += bracketOrderScore(candidate);
  origPts += bracketOrderScore(original);

  // 3. Common word fragments (case-insensitive)
  candPts += wordHitScore(candidate);
  origPts += wordHitScore(original);

  return candPts > origPts && candPts >= 2;
}

/** Score based on correct bracket nesting: { before }, etc. */
function bracketOrderScore(text: string): number {
  let score = 0;
  const pairs: [string, string][] = [['{', '}'], ['(', ')'], ['[', ']']];
  for (const [open, close] of pairs) {
    const oi = text.indexOf(open);
    const ci = text.indexOf(close);
    if (oi >= 0 && ci >= 0) {
      if (oi < ci) score += 2; // correct order
    }
  }
  return score;
}

/** Common short words to detect in mixed alphanumeric text. */
const COMMON_WORDS = [
  'the','and','for','are','but','not','you','all','can','had','her','was','one',
  'our','out','day','get','has','him','his','how','its','may','new','now','old',
  'see','way','who','did','got','let','say','she','too','use','flag','key','ctf',
  'pico','hack','code','pass','word','text','file','data','test','true','good',
  'cool','find','open','read','this','that','with','from','have','been','make',
  'like','just','know','take','come','more','some','time','very','when','also',
];

/** Score based on how many common words appear as substrings. */
function wordHitScore(text: string): number {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const w of COMMON_WORDS) {
    if (lower.includes(w)) hits++;
  }
  return Math.min(hits, 4); // cap at 4 points
}
