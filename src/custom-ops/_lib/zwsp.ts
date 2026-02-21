/**
 * Zero-Width Unicode Character Steganography
 * Adapted from Kei Misawa's library (MIT License)
 *
 * Encodes/decodes hidden text or binary data within cover text
 * using zero-width Unicode characters (U+200C, U+200D, U+202C, U+FEFF).
 */

const DEFAULT_CHARS = ['\u200c', '\u200d', '\u202c', '\ufeff'];

interface ZWSPConfig {
  chars: string[];
  radix: number;
  codelengthText: number;
  codelengthBinary: number;
}

function makeConfig(chars: string[]): ZWSPConfig {
  const radix = chars.length;
  return {
    chars,
    radix,
    codelengthText: Math.ceil(Math.log(65536) / Math.log(radix)),
    codelengthBinary: Math.ceil(Math.log(256) / Math.log(radix)),
  };
}

const DEFAULT_CONFIG = makeConfig(DEFAULT_CHARS);

/* ------------------------------------------------------------------ */
/*  Encode helpers                                                     */
/* ------------------------------------------------------------------ */

function encodeToZWText(str: string, cfg: ZWSPConfig): string {
  const { chars, radix, codelengthText } = cfg;
  const base = '0'.repeat(codelengthText);
  const result: string[] = [];

  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    const d = c.toString(radix);
    result.push((base + d).slice(-codelengthText));
  }

  let r = result.join('');
  for (let i = 0; i < radix; i++) {
    r = r.replace(new RegExp(String(i), 'g'), chars[i]);
  }
  return r;
}

function encodeToZWBinary(data: Uint8Array, cfg: ZWSPConfig): string {
  const { chars, radix, codelengthBinary } = cfg;
  const base = '0'.repeat(codelengthBinary);
  const result: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const d = data[i].toString(radix);
    result.push((base + d).slice(-codelengthBinary));
  }

  let r = result.join('');
  for (let i = 0; i < radix; i++) {
    r = r.replace(new RegExp(String(i), 'g'), chars[i]);
  }
  return r;
}

/**
 * Interleave cover text segments with zero-width encoded chunks.
 * Uses deterministic interleaving (alternating) instead of random
 * so the operation is reproducible.
 */
function combineStrings(cover: string, encoded: string, codelength: number): string {
  // Split cover into word-level tokens
  const coverParts = cover.split(/(\s+)/);
  const encodedParts: string[] = [];
  for (let i = 0; i < encoded.length; i += codelength) {
    encodedParts.push(encoded.slice(i, i + codelength));
  }

  const result: string[] = [];
  let ci = 0;
  let ei = 0;

  // Interleave: after each cover token, insert an encoded chunk
  while (ci < coverParts.length || ei < encodedParts.length) {
    if (ci < coverParts.length) {
      result.push(coverParts[ci++]);
    }
    if (ei < encodedParts.length) {
      result.push(encodedParts[ei++]);
    }
  }

  return result.join('');
}

/* ------------------------------------------------------------------ */
/*  Decode helpers                                                     */
/* ------------------------------------------------------------------ */

function splitZWChars(text: string, chars: string[]): { originalText: string; hiddenText: string } {
  const charSet = new Set(chars);
  let original = '';
  let hidden = '';
  for (const ch of text) {
    if (charSet.has(ch)) {
      hidden += ch;
    } else {
      original += ch;
    }
  }
  return { originalText: original, hiddenText: hidden };
}

function decodeZWText(encoded: string, cfg: ZWSPConfig): string {
  const { chars, radix, codelengthText } = cfg;
  let r = encoded;
  for (let i = 0; i < radix; i++) {
    r = r.replace(new RegExp(escapeRegex(chars[i]), 'g'), String(i));
  }
  const result: string[] = [];
  for (let i = 0; i < r.length; i += codelengthText) {
    const code = parseInt(r.slice(i, i + codelengthText), radix);
    if (!isNaN(code) && code > 0) {
      result.push(String.fromCharCode(code));
    }
  }
  return result.join('');
}

function decodeZWBinary(encoded: string, cfg: ZWSPConfig): Uint8Array {
  const { chars, radix, codelengthBinary } = cfg;
  let r = encoded;
  for (let i = 0; i < radix; i++) {
    r = r.replace(new RegExp(escapeRegex(chars[i]), 'g'), String(i));
  }
  const bytes: number[] = [];
  for (let i = 0; i < r.length; i += codelengthBinary) {
    const val = parseInt(r.slice(i, i + codelengthBinary), radix);
    if (!isNaN(val)) bytes.push(val & 0xff);
  }
  return new Uint8Array(bytes);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export function zwspEncodeText(coverText: string, hiddenText: string): string {
  const cfg = DEFAULT_CONFIG;
  const encoded = encodeToZWText(hiddenText, cfg);
  return combineStrings(coverText, encoded, cfg.codelengthText);
}

export function zwspDecodeText(stegoText: string): { originalText: string; hiddenText: string } {
  const cfg = DEFAULT_CONFIG;
  const { originalText, hiddenText } = splitZWChars(stegoText, cfg.chars);
  return {
    originalText,
    hiddenText: decodeZWText(hiddenText, cfg),
  };
}

export function zwspEncodeBinary(coverText: string, data: Uint8Array): string {
  const cfg = DEFAULT_CONFIG;
  const encoded = encodeToZWBinary(data, cfg);
  return combineStrings(coverText, encoded, cfg.codelengthBinary);
}

export function zwspDecodeBinary(stegoText: string): { originalText: string; hiddenData: Uint8Array } {
  const cfg = DEFAULT_CONFIG;
  const { originalText, hiddenText } = splitZWChars(stegoText, cfg.chars);
  return {
    originalText,
    hiddenData: decodeZWBinary(hiddenText, cfg),
  };
}

/**
 * Detect if text contains zero-width steganographic characters.
 */
export function zwspDetect(text: string): boolean {
  for (const ch of DEFAULT_CHARS) {
    if (text.includes(ch)) return true;
  }
  return false;
}

/** The zero-width characters used for encoding. */
export const ZWSP_CHARS = DEFAULT_CHARS;
