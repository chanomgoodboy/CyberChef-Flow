/**
 * Cipher Identifier Engine
 *
 * Analyzes input text and produces a ranked list of possible
 * ciphers/encodings based on character set analysis, frequency
 * analysis, index of coincidence, and pattern matching.
 *
 * Supports optional "clues" (cribs / known secrets) which are tried
 * as both keys and known plaintext fragments to boost identification.
 */

import { esolangDetectors } from './esolangDetect';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CipherMatch {
  name: string;
  score: number;       // 0-100 confidence
  description: string; // brief explanation of why it matched
  category: string;    // grouping
  reversed?: string;   // decrypted / decoded output (when computable)
  recipe?: { op: string; args: any[] }[];  // operations to add to graph (empty = not clickable)
}

/* ------------------------------------------------------------------ */
/*  Clue cache (populated from worker via sync-cribs message)          */
/* ------------------------------------------------------------------ */

let _clueCache: string[] = [];

/** Called by the worker when cribs are synced from the main thread. */
export function setClueCache(clues: string[]) {
  _clueCache = [...clues];
}

/** Read cached clues (from crib store settings). */
export function getClueCache(): string[] {
  return _clueCache;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ENGLISH_IC = 0.0667;
const RANDOM_IC = 0.0385; // 1/26

// English letter frequencies (A-Z)
const ENGLISH_FREQ: number[] = [
  0.082, 0.015, 0.028, 0.043, 0.127, 0.022, 0.020, 0.061, 0.070, 0.002,
  0.008, 0.040, 0.024, 0.067, 0.075, 0.019, 0.001, 0.060, 0.063, 0.091,
  0.028, 0.010, 0.023, 0.001, 0.020, 0.001,
];

/* ------------------------------------------------------------------ */
/*  Analysis helpers                                                   */
/* ------------------------------------------------------------------ */

function letterFrequencies(text: string): number[] {
  const freq = new Array(26).fill(0);
  let total = 0;
  for (const ch of text.toUpperCase()) {
    const c = ch.charCodeAt(0) - 65;
    if (c >= 0 && c < 26) { freq[c]++; total++; }
  }
  if (total === 0) return freq;
  return freq.map((f) => f / total);
}

function letterCounts(text: string): number[] {
  const counts = new Array(26).fill(0);
  for (const ch of text.toUpperCase()) {
    const c = ch.charCodeAt(0) - 65;
    if (c >= 0 && c < 26) counts[c]++;
  }
  return counts;
}

function indexOfCoincidence(text: string): number {
  const counts = letterCounts(text);
  const n = counts.reduce((a, b) => a + b, 0);
  if (n <= 1) return 0;
  let sum = 0;
  for (const c of counts) sum += c * (c - 1);
  return sum / (n * (n - 1));
}

function chiSquared(observed: number[], expected: number[]): number {
  let chi = 0;
  for (let i = 0; i < observed.length; i++) {
    if (expected[i] > 0) {
      const diff = observed[i] - expected[i];
      chi += (diff * diff) / expected[i];
    }
  }
  return chi;
}

/* ---- ROT8000 helper (lazy-built rotation map) ---- */
let _rot8000Map: Map<number, number> | null = null;
function getRot8000Map(): Map<number, number> {
  if (_rot8000Map) return _rot8000Map;
  // Valid code point transitions from the ROT8000 spec
  const transitions: Record<number, boolean> = {
    33: true, 127: false, 161: true, 5760: false, 5761: true,
    8192: false, 8203: true, 8232: false, 8234: true, 8239: false,
    8240: true, 8287: false, 8288: true, 12288: false, 12289: true,
    55296: false, 57344: true,
  };
  const validList: number[] = [];
  let valid = false;
  for (let i = 0; i < 0x10000; i++) {
    if (transitions[i] !== undefined) valid = transitions[i];
    if (valid) validList.push(i);
  }
  const half = validList.length / 2;
  const map = new Map<number, number>();
  for (let i = 0; i < validList.length; i++) {
    map.set(validList[i], validList[(i + half) % validList.length]);
  }
  _rot8000Map = map;
  return map;
}
function rot8000(input: string): string {
  const map = getRot8000Map();
  let out = '';
  for (const ch of input) {
    const cp = ch.charCodeAt(0);
    const mapped = map.get(cp);
    out += mapped !== undefined ? String.fromCharCode(mapped) : ch;
  }
  return out;
}

function countAlpha(text: string): number {
  let c = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) c++;
  }
  return c;
}

function countDigits(text: string): number {
  let c = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 48 && code <= 57) c++;
  }
  return c;
}

function countUpperOnly(text: string): number {
  let c = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) c++;
  }
  return c;
}

function countLowerOnly(text: string): number {
  let c = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 97 && code <= 122) c++;
  }
  return c;
}

function uniqueChars(text: string): Set<string> {
  return new Set(text);
}

function hasOnlyChars(text: string, charset: string): boolean {
  const set = new Set(charset);
  for (const ch of text.replace(/\s/g, '')) {
    if (!set.has(ch)) return false;
  }
  return true;
}

function entropy(text: string): number {
  if (text.length === 0) return 0;
  const freq = new Map<string, number>();
  for (const ch of text) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  let h = 0;
  const len = text.length;
  for (const count of freq.values()) {
    const p = count / len;
    h -= p * Math.log2(p);
  }
  return h;
}

/* ------------------------------------------------------------------ */
/*  Reverse / decode helpers                                           */
/* ------------------------------------------------------------------ */

function reverseBase64(s: string): string | undefined {
  try {
    return decodeURIComponent(escape(atob(s.replace(/\s/g, ''))));
  } catch {
    try { return atob(s.replace(/\s/g, '')); } catch { return undefined; }
  }
}

function reverseHex(s: string): string | undefined {
  const clean = s.replace(/[\s:,]+/g, '');
  if (clean.length % 2 !== 0) return undefined;
  let out = '';
  for (let i = 0; i < clean.length; i += 2) {
    out += String.fromCharCode(parseInt(clean.slice(i, i + 2), 16));
  }
  return isPrintable(out) ? out : undefined;
}

function reverseBinary(s: string): string | undefined {
  const groups = s.trim().split(/\s+/).filter(Boolean);
  if (!groups.every((g) => g.length === 8 && /^[01]+$/.test(g))) return undefined;
  const out = groups.map((g) => String.fromCharCode(parseInt(g, 2))).join('');
  return isPrintable(out) ? out : undefined;
}

function reverseOctal(s: string): string | undefined {
  const parts = s.trim().split(/\s+/).filter(Boolean);
  const nums = parts.map((p) => parseInt(p, 8));
  if (!nums.every((n) => n >= 0 && n <= 255)) return undefined;
  const out = nums.map((n) => String.fromCharCode(n)).join('');
  return isPrintable(out) ? out : undefined;
}

function reverseDecimal(s: string): string | undefined {
  const nums = s.trim().split(/\s+/).map(Number);
  if (!nums.every((n) => n >= 0 && n <= 255)) return undefined;
  const out = nums.map((n) => String.fromCharCode(n)).join('');
  return isPrintable(out) ? out : undefined;
}

function reverseMorse(s: string): string | undefined {
  const MORSE: Record<string, string> = {
    '.-':'A','-...':'B','-.-.':'C','-..':'D','.':'E','..-.':'F','--.':'G',
    '....':'H','..':'I','.---':'J','-.-':'K','.-..':'L','--':'M','-.':'N',
    '---':'O','.--.':'P','--.-':'Q','.-.':'R','...':'S','-':'T','..-':'U',
    '...-':'V','.--':'W','-..-':'X','-.--':'Y','--..':'Z','.----':'1',
    '..---':'2','...--':'3','....-':'4','.....':'5','-....':'6','--...':'7',
    '---..':'8','----.':'9','-----':'0',
  };
  const normalized = s.replace(/[·•]/g, '.').replace(/_/g, '-');
  const words = normalized.split(/\s{2,}|[/|]/);
  const decoded = words.map((w) =>
    w.trim().split(/\s+/).map((ch) => MORSE[ch] ?? '?').join(''),
  ).join(' ');
  return decoded.includes('?') ? undefined : decoded;
}

function reverseUrl(s: string): string | undefined {
  try { const d = decodeURIComponent(s); return d !== s ? d : undefined; } catch { return undefined; }
}

function reverseHtmlEntities(s: string): string | undefined {
  const d = s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([\da-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&apos;/gi, "'");
  return d !== s ? d : undefined;
}

function reverseROT13(s: string): string {
  let out = '';
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (c >= 65 && c <= 90) out += String.fromCharCode(((c - 65 + 13) % 26) + 65);
    else if (c >= 97 && c <= 122) out += String.fromCharCode(((c - 97 + 13) % 26) + 97);
    else out += ch;
  }
  return out;
}

function reverseROT47(s: string): string {
  let out = '';
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (c >= 33 && c <= 126) out += String.fromCharCode(((c - 33 + 47) % 94) + 33);
    else out += ch;
  }
  return out;
}

function reverseAtbash(s: string): string {
  let out = '';
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (c >= 65 && c <= 90) out += String.fromCharCode(90 - (c - 65));
    else if (c >= 97 && c <= 122) out += String.fromCharCode(122 - (c - 97));
    else out += ch;
  }
  return out;
}

function reverseCaesar(s: string, shift: number): string {
  let out = '';
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (c >= 65 && c <= 90) out += String.fromCharCode(((c - 65 - shift + 26) % 26) + 65);
    else if (c >= 97 && c <= 122) out += String.fromCharCode(((c - 97 - shift + 26) % 26) + 97);
    else out += ch;
  }
  return out;
}

function reverseVigenere(s: string, key: string): string {
  const upper = s.toUpperCase();
  const k = key.toUpperCase();
  let out = '';
  let ki = 0;
  for (const ch of upper) {
    const c = ch.charCodeAt(0);
    if (c >= 65 && c <= 90) {
      out += String.fromCharCode(((c - 65 - (k.charCodeAt(ki % k.length) - 65) + 26) % 26) + 65);
      ki++;
    } else {
      out += ch;
    }
  }
  return out;
}

function reverseBeaufort(s: string, key: string): string {
  const upper = s.toUpperCase();
  const k = key.toUpperCase();
  let out = '';
  let ki = 0;
  for (const ch of upper) {
    const c = ch.charCodeAt(0);
    if (c >= 65 && c <= 90) {
      out += String.fromCharCode(((k.charCodeAt(ki % k.length) - 65 - (c - 65) + 26) % 26) + 65);
      ki++;
    } else {
      out += ch;
    }
  }
  return out;
}

function reverseXorKey(s: string, key: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    out += String.fromCharCode(s.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return out;
}

function reverseAutokey(s: string, primer: string): string {
  const ct = s.toUpperCase();
  const k = primer.toUpperCase();
  const result: number[] = [];
  const keyStream = [...k].map((c) => c.charCodeAt(0) - 65);
  for (let i = 0; i < ct.length; i++) {
    const c = ct.charCodeAt(i);
    if (c < 65 || c > 90) continue;
    const ki = i < keyStream.length ? keyStream[i] : result[i - k.length];
    const p = (c - 65 - ki + 26) % 26;
    result.push(p);
  }
  return result.map((c) => String.fromCharCode(c + 65)).join('');
}

function reverseBacon(s: string): string | undefined {
  // Standard 24-letter Bacon: I/J share code 8, U/V share code 19
  const BACON: Record<string, string> = {
    'AAAAA':'A','AAAAB':'B','AAABA':'C','AAABB':'D','AABAA':'E','AABAB':'F',
    'AABBA':'G','AABBB':'H','ABAAA':'I','ABAAB':'K','ABABA':'L','ABABB':'M',
    'ABBAA':'N','ABBAB':'O','ABBBA':'P','ABBBB':'Q','BAAAA':'R','BAAAB':'S',
    'BAABA':'T','BAABB':'U','BABAA':'W','BABAB':'X','BABBA':'Y','BABBB':'Z',
  };
  const clean = s.toUpperCase().replace(/\s/g, '');
  if (clean.length % 5 !== 0) return undefined;
  let out = '';
  for (let i = 0; i < clean.length; i += 5) {
    const g = clean.slice(i, i + 5);
    out += BACON[g] ?? '?';
  }
  return out.includes('?') ? undefined : out;
}

function reverseUnicodeEscape(s: string): string | undefined {
  const decoded = s
    .replace(/\\u([0-9A-Fa-f]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/U\+([0-9A-Fa-f]{4,5})/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));
  return decoded !== s ? decoded : undefined;
}

function reversePolybius(s: string): string | undefined {
  const clean = s.replace(/\s/g, '');
  if (clean.length % 2 !== 0) return undefined;
  const GRID = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // 5x5, no J
  let out = '';
  for (let i = 0; i < clean.length; i += 2) {
    const r = parseInt(clean[i]) - 1;
    const c = parseInt(clean[i + 1]) - 1;
    if (r < 0 || r > 4 || c < 0 || c > 4) return undefined;
    out += GRID[r * 5 + c];
  }
  return out;
}

/* ---- Trial decode helpers for base encodings ---- */

function reverseZBase32(s: string): string | undefined {
  const ZBASE = 'ybndrfg8ejkmcpqxot1uwisza345h769';
  const DEC = new Map<string, number>();
  for (let i = 0; i < ZBASE.length; i++) DEC.set(ZBASE[i], i);
  const clean = s.toLowerCase().replace(/\s+/g, '');
  let bits = 0, numBits = 0;
  const bytes: number[] = [];
  for (const ch of clean) {
    const v = DEC.get(ch);
    if (v === undefined) return undefined;
    bits = (bits << 5) | v;
    numBits += 5;
    if (numBits >= 8) { numBits -= 8; bytes.push((bits >> numBits) & 0xFF); }
  }
  const out = new TextDecoder().decode(new Uint8Array(bytes));
  return isPrintable(out) ? out : undefined;
}

function reverseBase32Crockford(s: string): string | undefined {
  const ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const DEC = new Map<string, number>();
  for (let i = 0; i < ALPHA.length; i++) DEC.set(ALPHA[i], i);
  const clean = s.toUpperCase().replace(/[-\s]/g, '');
  let bits = 0, numBits = 0;
  const bytes: number[] = [];
  for (const ch of clean) {
    const v = DEC.get(ch);
    if (v === undefined) return undefined;
    bits = (bits << 5) | v;
    numBits += 5;
    if (numBits >= 8) { numBits -= 8; bytes.push((bits >> numBits) & 0xFF); }
  }
  const out = new TextDecoder().decode(new Uint8Array(bytes));
  return isPrintable(out) ? out : undefined;
}

function reverseBase32(s: string): string | undefined {
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const DEC = new Map<string, number>();
  for (let i = 0; i < ALPHA.length; i++) DEC.set(ALPHA[i], i);
  const clean = s.toUpperCase().replace(/[=\s]/g, '');
  let bits = 0, numBits = 0;
  const bytes: number[] = [];
  for (const ch of clean) {
    const v = DEC.get(ch);
    if (v === undefined) return undefined;
    bits = (bits << 5) | v;
    numBits += 5;
    if (numBits >= 8) { numBits -= 8; bytes.push((bits >> numBits) & 0xFF); }
  }
  const out = new TextDecoder().decode(new Uint8Array(bytes));
  return isPrintable(out) ? out : undefined;
}

function reverseBase58(s: string): string | undefined {
  const ALPHA = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const clean = s.replace(/\s/g, '');
  let n = 0n;
  for (const ch of clean) {
    const idx = ALPHA.indexOf(ch);
    if (idx < 0) return undefined;
    n = n * 58n + BigInt(idx);
  }
  let hex = n.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const bytes: number[] = [];
  // Leading 1s in Base58 map to 0x00 bytes
  for (const ch of clean) { if (ch === '1') bytes.push(0); else break; }
  for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16));
  try {
    const out = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
    return isPrintable(out) ? out : undefined;
  } catch { return undefined; }
}

function reverseBase45(s: string): string | undefined {
  const ALPHA = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
  const clean = s.replace(/\s/g, '').replace(/^HC1:/, '');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 3) {
    const c0 = ALPHA.indexOf(clean[i]);
    const c1 = i + 1 < clean.length ? ALPHA.indexOf(clean[i + 1]) : -1;
    const c2 = i + 2 < clean.length ? ALPHA.indexOf(clean[i + 2]) : -1;
    if (c0 < 0 || c1 < 0) return undefined;
    if (c2 >= 0) {
      const val = c0 + c1 * 45 + c2 * 45 * 45;
      bytes.push((val >> 8) & 0xFF, val & 0xFF);
    } else {
      bytes.push(c0 + c1 * 45);
    }
  }
  try {
    const out = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
    return isPrintable(out) ? out : undefined;
  } catch { return undefined; }
}

/** Check if >= 70% printable ASCII. */
function isPrintable(s: string): boolean {
  if (s.length === 0) return false;
  let p = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if ((c >= 0x20 && c <= 0x7e) || c === 9 || c === 10 || c === 13) p++;
  }
  return p / s.length >= 0.7;
}

/* ------------------------------------------------------------------ */
/*  Reverse readability detection                                      */
/* ------------------------------------------------------------------ */

/** Common English bigrams for readability scoring. */
const CI_COMMON_BIGRAMS = new Set([
  'th','he','in','er','an','re','ed','on','es','st',
  'en','at','to','nt','ha','nd','ou','ea','ng','as',
  'or','ti','is','et','it','ar','te','se','hi','of',
]);

/** Common short words for reverse detection. */
const CI_COMMON_WORDS = [
  'the','and','for','are','but','not','you','all','can','had','was','one',
  'our','out','get','has','how','new','now','old','see','way','who','did',
  'flag','key','ctf','pico','hack','code','pass','word','text','file',
  'data','test','true','good','cool','find','open','read','this','that',
  'with','from','have','been','make','like','just','know','take','come',
];

/**
 * Score how much more readable `candidate` is vs `original`.
 * Uses bracket ordering, common words, and bigram analysis.
 * Returns a positive number if candidate is more readable.
 */
function reverseReadabilityScore(candidate: string, original: string): number {
  let candPts = 0;
  let origPts = 0;

  // 1. Bigram analysis
  const candBi = ciBigramScore(candidate);
  const origBi = ciBigramScore(original);
  if (candBi > origBi + 0.03) candPts += 2;
  else if (origBi > candBi + 0.03) origPts += 2;

  // 2. Bracket ordering: { before }, ( before ), [ before ]
  const pairs: [string, string][] = [['{', '}'], ['(', ')'], ['[', ']']];
  for (const [open, close] of pairs) {
    const oi = candidate.indexOf(open);
    const ci = candidate.indexOf(close);
    if (oi >= 0 && ci >= 0 && oi < ci) candPts += 2;
    const oi2 = original.indexOf(open);
    const ci2 = original.indexOf(close);
    if (oi2 >= 0 && ci2 >= 0 && oi2 < ci2) origPts += 2;
  }

  // 3. Common word detection
  const candLower = candidate.toLowerCase();
  const origLower = original.toLowerCase();
  let candWords = 0, origWords = 0;
  for (const w of CI_COMMON_WORDS) {
    if (candLower.includes(w)) candWords++;
    if (origLower.includes(w)) origWords++;
  }
  candPts += Math.min(candWords, 4);
  origPts += Math.min(origWords, 4);

  return candPts - origPts;
}

function ciBigramScore(text: string): number {
  const lower = text.toLowerCase();
  let common = 0, total = 0;
  for (let i = 0; i < lower.length - 1; i++) {
    const a = lower.charCodeAt(i);
    const b = lower.charCodeAt(i + 1);
    if ((a >= 97 && a <= 122) && (b >= 97 && b <= 122)) {
      total++;
      if (CI_COMMON_BIGRAMS.has(lower[i] + lower[i + 1])) common++;
    }
  }
  return total > 0 ? common / total : 0;
}

/* ------------------------------------------------------------------ */
/*  Phone Keypad / Multi-tap decoder                                   */
/* ------------------------------------------------------------------ */

const CI_KEY_MAX: Record<string, number> = {
  '2': 3, '3': 3, '4': 3, '5': 3, '6': 3,
  '7': 4, '8': 3, '9': 4, '0': 1, '1': 1,
};

const CI_KEYPAD: Record<string, string> = {
  '2':'A','22':'B','222':'C',
  '3':'D','33':'E','333':'F',
  '4':'G','44':'H','444':'I',
  '5':'J','55':'K','555':'L',
  '6':'M','66':'N','666':'O',
  '7':'P','77':'Q','777':'R','7777':'S',
  '8':'T','88':'U','888':'V',
  '9':'W','99':'X','999':'Y','9999':'Z',
  '0':' ',
};

function decodeMultiTap(input: string): string | undefined {
  let result = '';
  let i = 0;
  while (i < input.length) {
    const digit = input[i];
    const max = CI_KEY_MAX[digit] ?? 1;
    let count = 1;
    while (i + 1 < input.length && input[i + 1] === digit) {
      i++;
      count++;
    }
    while (count > 0) {
      const chunk = Math.min(count, max);
      const letter = CI_KEYPAD[digit.repeat(chunk)];
      if (letter === undefined) return undefined;
      result += letter;
      count -= chunk;
    }
    i++;
  }
  return result.length > 0 ? result : undefined;
}

/* ------------------------------------------------------------------ */
/*  Detectors                                                          */
/* ------------------------------------------------------------------ */

export function identifyCipher(
  input: string,
  key1: string = '',
  key2: string = '',
  extraClues: string[] = [],
): CipherMatch[] {
  const results: CipherMatch[] = [];
  const trimmed = input.trim();
  if (trimmed.length < 2) return results;

  const alphaCount = countAlpha(trimmed);
  const digitCount = countDigits(trimmed);
  const upperCount = countUpperOnly(trimmed);
  const lowerCount = countLowerOnly(trimmed);
  const noSpaces = trimmed.replace(/\s+/g, '');
  const len = noSpaces.length;
  const uniq = uniqueChars(noSpaces);
  const ent = entropy(noSpaces);

  // Flag: input is exclusively binary digits (0/1) + whitespace.
  // When true, skip alphabet-based detectors that would false-positive
  // (hex, base64, base32, base45, triliteral, etc.)
  const isBinaryOnly = /^[01\s]+$/.test(trimmed) && len >= 3;

  // Flag: input is exclusively decimal numbers (0-9) + whitespace.
  // When true, skip alphabet-based detectors that would false-positive.
  const isDecimalOnly = /^[0-9\s]+$/.test(trimmed) && len >= 3;

  // Letter-only analysis
  const lettersOnly = trimmed.replace(/[^A-Za-z]/g, '');
  const ic = lettersOnly.length > 10 ? indexOfCoincidence(lettersOnly) : 0;
  const freq = letterFrequencies(lettersOnly);
  const freqCounts = letterCounts(lettersOnly);
  const totalLetters = freqCounts.reduce((a, b) => a + b, 0);

  // ---- Encodings ----

  // Base64
  if (!isBinaryOnly && !isDecimalOnly && /^[A-Za-z0-9+/\n\r]+={0,2}$/.test(noSpaces) && len >= 4) {
    let score = 60;
    if (noSpaces.endsWith('=')) score += 20;
    if (noSpaces.endsWith('==')) score += 10;
    if (len % 4 === 0) score += 5;
    results.push({ name: 'Base64', score: Math.min(score, 95), description: 'A-Za-z0-9+/= charset, valid padding', category: 'Encoding', reversed: reverseBase64(noSpaces) });
  }

  // Base32
  if (!isBinaryOnly && !isDecimalOnly && /^[A-Z2-7]+=*$/i.test(noSpaces) && len >= 8) {
    let score = 55;
    if (noSpaces.endsWith('=')) score += 15;
    if (len % 8 === 0) score += 10;
    results.push({ name: 'Base32', score: Math.min(score, 90), description: 'A-Z2-7= charset', category: 'Encoding' });
  }

  // Base85 / ASCII85
  {
    // Standard ASCII85 alphabet: '!' (33) through 'u' (117) = 85 printable chars
    // Also matches with <~ ~> wrapper (Adobe format)
    const stripped85 = trimmed.replace(/^<~/, '').replace(/~>$/, '');
    const hasWrapper = trimmed.startsWith('<~') && trimmed.endsWith('~>');
    // Check: all chars in ASCII 33-117 range ('!' to 'u'), plus 'z' (all-zero shortcut)
    const isB85Charset = [...stripped85].every(ch => {
      const c = ch.charCodeAt(0);
      return (c >= 33 && c <= 117) || ch === 'z' || ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t';
    });
    const cleanB85 = stripped85.replace(/\s+/g, '');
    if (isB85Charset && cleanB85.length >= 4) {
      // Must have special chars (not just alphanumeric) to distinguish from plain text
      const specialCount = [...cleanB85].filter(ch => {
        const c = ch.charCodeAt(0);
        return (c >= 33 && c <= 47) || (c >= 58 && c <= 64); // !"#$%&'()*+,-./ and :;<=>?@
      }).length;
      if (specialCount >= 1 && specialCount / cleanB85.length >= 0.05) {
        let score = 70;
        if (hasWrapper) score += 20; // <~ ~> is definitive
        if (cleanB85.length % 5 === 0) score += 5;
        if (specialCount / cleanB85.length >= 0.1) score += 5;
        // No chars beyond 'u' (117) — tighter fit than Base91
        const hasHighChars = [...cleanB85].some(ch => {
          const c = ch.charCodeAt(0);
          return c > 117; // v=118, w=119 ... ~=126
        });
        if (!hasHighChars) score += 5;
        results.push({ name: 'Base85 / ASCII85', score: Math.min(score, 95), description: hasWrapper ? 'ASCII85 with <~ ~> wrapper' : `ASCII85 charset (chars !-u), ${specialCount} special chars`, category: 'Encoding' });
      }
    }
  }

  // Base91
  {
    // basE91 alphabet: A-Za-z0-9 plus !#$%&()*+,./:;<=>?@[]^_`{|}~"
    // Key distinguisher from Base64: contains chars like !#$%&(){}|~ but NO - or space in the data
    const b91Chars = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"');
    const cleanB91 = noSpaces;
    if (cleanB91.length >= 4 && [...cleanB91].every(ch => b91Chars.has(ch))) {
      // Must have some non-alphanumeric Base91-specific chars to distinguish from plain text
      const specialCount = [...cleanB91].filter(ch => '!#$%&()*+,./:;<=>?@[]^_`{|}~"'.includes(ch)).length;
      if (specialCount >= 1 && specialCount / cleanB91.length >= 0.05) {
        let score = 55;
        // Higher score if it has many special chars typical of base91
        if (specialCount / cleanB91.length >= 0.1) score += 15;
        if (cleanB91.length >= 8) score += 10;
        // Chars unique to Base91 (not in Base85): v-z, {, |, }, ~, "
        // If input has these, it's more likely Base91 than Base85
        const b91OnlyCount = [...cleanB91].filter(ch => 'vwxyz{|}~"'.includes(ch)).length;
        if (b91OnlyCount > 0) score += 5;
        else score -= 10; // likely Base85 instead
        results.push({ name: 'Base91', score: Math.min(Math.max(score, 30), 85), description: `basE91 charset — ${specialCount} special characters among ${cleanB91.length} total`, category: 'Encoding' });
      }
    }
  }

  // Hexadecimal
  if (!isBinaryOnly && !isDecimalOnly && /^[0-9A-Fa-f\s:]+$/.test(trimmed) && len >= 4 && noSpaces.replace(/:/g, '').length % 2 === 0) {
    let score = 65;
    if (/^([0-9A-Fa-f]{2}\s?)+$/.test(trimmed)) score += 15;
    results.push({ name: 'Hexadecimal', score: Math.min(score, 90), description: 'Hex digit pairs', category: 'Encoding', reversed: reverseHex(trimmed) });
  }

  // Binary
  if (/^[01\s]+$/.test(trimmed)) {
    const bits = noSpaces;
    let score = 50;
    if (bits.length % 8 === 0) score += 25;
    if (/^([01]{8}\s?)+$/.test(trimmed)) score += 15;
    results.push({ name: 'Binary', score: Math.min(score, 90), description: '0/1 characters, groups of 8', category: 'Encoding', reversed: reverseBinary(trimmed) });
  }

  // Octal
  if (/^[0-7\s]+$/.test(trimmed) && !/^[01\s]+$/.test(trimmed)) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.every((p) => parseInt(p, 8) <= 255)) {
      results.push({ name: 'Octal', score: 55, description: 'Digits 0-7, values 0-377', category: 'Encoding', reversed: reverseOctal(trimmed) });
    }
  }

  // Decimal / ASCII codes
  if (!isBinaryOnly && /^\d{1,3}(\s+\d{1,3})+$/.test(trimmed)) {
    const nums = trimmed.split(/\s+/).map(Number);
    if (nums.every((n) => n >= 0 && n <= 255)) {
      let decScore = 70;
      // Purely numeric + spaces is a strong decimal signal
      if (isDecimalOnly) decScore += 10;
      // Values in printable ASCII range (32-126) boost confidence
      const printable = nums.filter(n => n >= 32 && n <= 126).length;
      if (printable / nums.length >= 0.8) decScore += 10;
      if (nums.length >= 5) decScore += 5;
      results.push({ name: 'Decimal / ASCII Codes', score: Math.min(decScore, 95), description: `${nums.length} space-separated decimal values (0-255)`, category: 'Encoding', reversed: reverseDecimal(trimmed) });
    }
  }

  // Morse
  if (/^[.\-\u2022·_ /|]+$/u.test(trimmed) && trimmed.length >= 5) {
    results.push({ name: 'Morse Code', score: 80, description: 'Dots and dashes with separators', category: 'Encoding', reversed: reverseMorse(trimmed) });
  }

  // URL encoding
  if (/%[0-9A-Fa-f]{2}/.test(trimmed)) {
    const pctCount = (trimmed.match(/%[0-9A-Fa-f]{2}/g) || []).length;
    if (pctCount >= 2) {
      results.push({ name: 'URL Encoding', score: 70 + Math.min(pctCount * 2, 20), description: `${pctCount} percent-encoded sequences`, category: 'Encoding', reversed: reverseUrl(trimmed) });
    }
  }

  // HTML Entities
  if (/&(?:#\d+|#x[\da-fA-F]+|[a-zA-Z]+);/.test(trimmed)) {
    const entCount = (trimmed.match(/&(?:#\d+|#x[\da-fA-F]+|[a-zA-Z]+);/g) || []).length;
    if (entCount >= 2) {
      results.push({ name: 'HTML Entities', score: 75, description: `${entCount} HTML entity sequences`, category: 'Encoding', reversed: reverseHtmlEntities(trimmed) });
    }
  }

  // Braille
  if (/[\u2800-\u28FF]/.test(trimmed)) {
    const brailleCount = [...trimmed].filter((c) => c.charCodeAt(0) >= 0x2800 && c.charCodeAt(0) <= 0x28FF).length;
    if (brailleCount > trimmed.length * 0.5) {
      results.push({ name: 'Braille', score: 90, description: 'Unicode Braille characters', category: 'Encoding' });
    }
  }

  // Unicode escapes
  if (/\\u[0-9A-Fa-f]{4}/.test(trimmed) || /U\+[0-9A-Fa-f]{4,5}/.test(trimmed)) {
    results.push({ name: 'Unicode Escape', score: 80, description: '\\uXXXX or U+XXXX notation', category: 'Encoding', reversed: reverseUnicodeEscape(trimmed) });
  }

  // ---- Zero-Width Steganography ----
  if (/[\u200c\u200d\u202c\ufeff]/.test(trimmed)) {
    const zwCount = [...trimmed].filter((c) => '\u200c\u200d\u202c\ufeff'.includes(c)).length;
    if (zwCount >= 4) {
      results.push({ name: 'Zero-Width Steganography', score: 85, description: `${zwCount} zero-width characters detected (ZWNJ, ZWJ, PDF, BOM)`, category: 'Steganography' });
    }
  }

  // ---- ADFGX / ADFGVX ----
  if (hasOnlyChars(noSpaces.toUpperCase(), 'ADFGX') && alphaCount >= 10) {
    results.push({ name: 'ADFGX Cipher', score: 85, description: 'Only A,D,F,G,X characters', category: 'Cipher' });
  }
  if (hasOnlyChars(noSpaces.toUpperCase(), 'ADFGVX') && !hasOnlyChars(noSpaces.toUpperCase(), 'ADFGX') && alphaCount >= 10) {
    results.push({ name: 'ADFGVX Cipher', score: 85, description: 'Only A,D,F,G,V,X characters', category: 'Cipher' });
  }

  // ---- Polybius (digit pairs 1-5) ----
  if (/^[1-5\s]+$/.test(trimmed) && noSpaces.length >= 4 && noSpaces.length % 2 === 0) {
    results.push({ name: 'Polybius Square', score: 75, description: 'Digit pairs from 1-5 (5x5 grid coordinates)', category: 'Cipher', reversed: reversePolybius(noSpaces) });
  }

  // ---- Tap Code (dots/numbers 1-5) ----
  if (/^[\s.·\d]+$/.test(trimmed) && /[.·]/.test(trimmed)) {
    results.push({ name: 'Tap Code', score: 60, description: 'Dot groups representing Polybius coordinates', category: 'Cipher' });
  }

  // ---- Bacon Cipher (a/b or A/B binary) ----
  if (/^[AaBb\s]+$/.test(trimmed) && noSpaces.length >= 10) {
    const clean = noSpaces.toUpperCase();
    if (clean.includes('A') && clean.includes('B') && clean.length % 5 === 0) {
      results.push({ name: 'Bacon Cipher', score: 80, description: 'Groups of 5 A/B characters (binary encoding)', category: 'Cipher', reversed: reverseBacon(clean) });
    }
  }

  // ---- Book Cipher / Number groups ----
  if (/^\d+[.,:\- ]\d+[.,:\- ]\d+/.test(trimmed) && /^\d+([.,:\- ]+\d+)+$/.test(noSpaces.replace(/\s/g, ','))) {
    const groups = trimmed.split(/[.,:\-\s]+/).filter(Boolean);
    if (groups.length >= 6) {
      results.push({ name: 'Book Cipher / Number Code', score: 65, description: `${groups.length} number groups (page-line-word or similar)`, category: 'Cipher' });
    }
  }

  // ---- ROT13 / Caesar detection (letter-only, IC near English) ----
  if (alphaCount > 10 && digitCount === 0 && alphaCount / len > 0.85) {
    if (ic > 0.055) {
      // IC close to English — likely monoalphabetic
      const bestShift = findBestCaesarShift(freqCounts);

      results.push({
        name: 'Caesar / ROT Cipher',
        score: Math.min(55 + Math.round((ic - 0.04) * 500), 85),
        description: `IC=${ic.toFixed(4)} (near English). Best shift: ${bestShift}${bestShift === 13 ? ' (ROT13)' : ''}`,
        category: 'Cipher',
        reversed: bestShift !== 0 ? reverseCaesar(trimmed, bestShift) : undefined,
      });

      results.push({
        name: 'Simple Substitution',
        score: Math.min(50 + Math.round((ic - 0.04) * 400), 75),
        description: `IC=${ic.toFixed(4)} suggests monoalphabetic substitution`,
        category: 'Cipher',
      });

      results.push({
        name: 'Atbash Cipher',
        score: Math.min(40 + Math.round((ic - 0.04) * 300), 65),
        description: `IC=${ic.toFixed(4)}, could be reversed alphabet (A↔Z, B↔Y, ...)`,
        category: 'Cipher',
        reversed: reverseAtbash(trimmed),
      });

      results.push({
        name: 'Affine Cipher',
        score: Math.min(35 + Math.round((ic - 0.04) * 300), 60),
        description: `IC=${ic.toFixed(4)}, monoalphabetic — could be affine (ax+b mod 26)`,
        category: 'Cipher',
      });

      // Transposition (same IC, same frequencies, different order)
      results.push({
        name: 'Transposition Cipher',
        score: Math.min(45 + Math.round((ic - 0.04) * 400), 70),
        description: `IC=${ic.toFixed(4)} near English — letters may be rearranged (columnar, rail fence, route)`,
        category: 'Cipher',
      });
    }

    // Polyalphabetic ciphers (IC between random and English)
    if (ic > 0.038 && ic < 0.055) {
      results.push({
        name: 'Vigenère Cipher',
        score: Math.min(65 + Math.round((0.055 - ic) * 800), 85),
        description: `IC=${ic.toFixed(4)} between random (0.038) and English (0.067) — polyalphabetic`,
        category: 'Cipher',
      });

      results.push({
        name: 'Beaufort Cipher',
        score: Math.min(45 + Math.round((0.055 - ic) * 500), 65),
        description: `IC=${ic.toFixed(4)} — reciprocal polyalphabetic (variant of Vigenère)`,
        category: 'Cipher',
      });

      results.push({
        name: 'Autokey Cipher',
        score: Math.min(40 + Math.round((0.055 - ic) * 400), 55),
        description: `IC=${ic.toFixed(4)} — polyalphabetic with self-keying`,
        category: 'Cipher',
      });
    }

    // Near-random IC
    if (ic <= 0.038 && ic > 0) {
      results.push({
        name: 'Enigma / Rotor Machine',
        score: 40,
        description: `IC=${ic.toFixed(4)} near random — complex polyalphabetic`,
        category: 'Cipher',
      });

      results.push({
        name: 'One-Time Pad',
        score: 30,
        description: `IC=${ic.toFixed(4)} ≈ random — possibly unbreakable`,
        category: 'Cipher',
      });
    }

    // Playfair detection: letters only, no J, even length
    if (!lettersOnly.toUpperCase().includes('J') && lettersOnly.length % 2 === 0 && uniq.size <= 25) {
      results.push({
        name: 'Playfair Cipher',
        score: Math.min(35 + Math.round((ic - 0.04) * 300), 55),
        description: `No letter J, even length, ${uniq.size} unique chars — digraphic cipher`,
        category: 'Cipher',
      });
    }

    // Hill cipher: letters only, length divisible by 2 or 3
    if (lettersOnly.length >= 6 && (lettersOnly.length % 2 === 0 || lettersOnly.length % 3 === 0)) {
      results.push({
        name: 'Hill Cipher',
        score: 30,
        description: `Letters only, length ${lettersOnly.length} (divisible by ${lettersOnly.length % 2 === 0 ? 2 : 3}) — polygraphic`,
        category: 'Cipher',
      });
    }
  }

  // ---- XOR / Stream cipher (binary with some printable) ----
  if (len >= 8) {
    let nonPrintable = 0;
    for (const ch of noSpaces) {
      const c = ch.charCodeAt(0);
      if (c < 0x20 || c > 0x7e) nonPrintable++;
    }
    if (nonPrintable > 0 && nonPrintable / len > 0.1 && nonPrintable / len < 0.9) {
      results.push({ name: 'XOR Cipher', score: 55, description: `Mix of printable/non-printable bytes (${Math.round(nonPrintable / len * 100)}% non-printable)`, category: 'Cipher' });
      results.push({ name: 'RC4 / Stream Cipher', score: 40, description: 'Binary output from stream cipher', category: 'Cipher' });
    }
  }

  // ---- Rail Fence ----
  if (alphaCount > 15 && ic > 0.05) {
    results.push({
      name: 'Rail Fence Cipher',
      score: Math.min(30 + Math.round((ic - 0.04) * 300), 50),
      description: `IC=${ic.toFixed(4)} — zigzag transposition pattern`,
      category: 'Cipher',
    });
  }

  // ---- Pigpen / Masonic (special Unicode or description-based) ----
  // Can't detect actual pigpen glyphs easily, but if someone describes coordinates...

  // ---- ROT47 (printable ASCII rotation) ----
  if (alphaCount + digitCount < len * 0.5 && len >= 10) {
    const printable = [...noSpaces].filter((c) => c.charCodeAt(0) >= 33 && c.charCodeAt(0) <= 126).length;
    if (printable === len) {
      results.push({ name: 'ROT47', score: 35, description: 'All printable ASCII — could be ROT47 rotation', category: 'Cipher', reversed: reverseROT47(trimmed) });
    }
  }

  // ---- Reversed text detection ----
  if (len >= 8) {
    const reversed = [...trimmed].reverse().join('');
    const revScore = reverseReadabilityScore(reversed, trimmed);
    if (revScore >= 2) {
      results.push({
        name: 'Reversed Text',
        score: Math.min(50 + revScore * 10, 90),
        description: 'Text appears to be reversed (brackets, common words, bigrams)',
        category: 'Encoding',
        reversed,
      });
    }
  }

  // ---- Phone Keypad / Multi-tap ----
  if (/^[0-9]+$/.test(noSpaces) && len >= 4) {
    // Check if it looks like multi-tap: runs of same digit, mostly 2-9
    const digits29 = [...noSpaces].filter((c) => c >= '2' && c <= '9').length;
    if (digits29 / len >= 0.8) {
      // Check for characteristic multi-tap runs (same digit repeated)
      let runs = 0;
      let prevDigit = '';
      for (const ch of noSpaces) {
        if (ch !== prevDigit) { runs++; prevDigit = ch; }
      }
      // Multi-tap text has fewer runs than characters (grouping effect)
      if (runs < len * 0.8) {
        const decoded = decodeMultiTap(noSpaces);
        if (decoded && isPrintable(decoded)) {
          results.push({
            name: 'Phone Keypad (Multi-tap)',
            score: Math.min(60 + Math.round((1 - runs / len) * 30), 85),
            description: `Digit groups map to phone keypad letters`,
            category: 'Encoding',
            reversed: decoded,
          });
        }
      }
    }
  }

  // ---- Consonants/Vowels Rank (V/C prefixed numbers) ----
  if (/^[VC]\d+/i.test(trimmed)) {
    const tokens = trimmed.split(/[\s,]+/);
    const vcCount = tokens.filter((t) => /^[VC]\d+$/i.test(t)).length;
    if (vcCount >= 3 && vcCount >= tokens.length * 0.6) {
      results.push({ name: 'Consonants/Vowels Rank', score: 75, description: 'V/C prefixed numbers — separate vowel/consonant numbering', category: 'Cipher' });
    }
  }

  // ---- Triliteral (only digits 0-2 in groups of 3) ----
  if (!isBinaryOnly && !isDecimalOnly) {
    const clean = noSpaces.replace(/[,\s]/g, '');
    if (/^[012]+$/.test(clean) && clean.length >= 6 && clean.length % 3 === 0) {
      results.push({ name: 'Triliteral Cipher', score: 75, description: 'Digits 0-2 in groups of 3 (base-3 letter encoding)', category: 'Cipher' });
    }
  }

  // ---- Gravity Falls (Caesar-3 pattern) ----
  // Detected via normal Caesar detection above (best shift = 3)

  // ---- DTMF (frequency pairs) ----
  if (/\d{3}\+\d{4}/.test(trimmed)) {
    const pairs = trimmed.split(/\s+/).filter((t) => /^\d{3}\+\d{4}$/.test(t));
    const validFreqs = new Set(['697', '770', '852', '941']);
    const validHigh = new Set(['1209', '1336', '1477', '1633']);
    const dtmfCount = pairs.filter((p) => {
      const [lo, hi] = p.split('+');
      return validFreqs.has(lo) && validHigh.has(hi);
    }).length;
    if (dtmfCount >= 2) {
      results.push({ name: 'DTMF Code', score: 80, description: `${dtmfCount} valid DTMF frequency pairs detected`, category: 'Encoding' });
    }
  }

  // ---- ALT Codes (ALT+NNN format) ----
  if (/ALT\+\d+/i.test(trimmed)) {
    const altCount = (trimmed.match(/ALT\+\d+/gi) || []).length;
    if (altCount >= 2) {
      results.push({ name: 'ALT Codes', score: 80, description: `${altCount} ALT+NNN codes detected`, category: 'Encoding' });
    }
  }

  // ---- ASCII Control abbreviations ----
  {
    const ctrlNames = new Set(['NUL', 'SOH', 'STX', 'ETX', 'EOT', 'ENQ', 'ACK', 'BEL', 'BS', 'HT', 'LF', 'VT', 'FF', 'CR', 'SO', 'SI', 'DLE', 'DC1', 'DC2', 'DC3', 'DC4', 'NAK', 'SYN', 'ETB', 'CAN', 'EM', 'SUB', 'ESC', 'FS', 'GS', 'RS', 'US', 'DEL']);
    const words = trimmed.split(/\s+/);
    const ctrlCount = words.filter((w) => ctrlNames.has(w.toUpperCase())).length;
    if (ctrlCount >= 3 && ctrlCount >= words.length * 0.4) {
      results.push({ name: 'ASCII Control Characters', score: 70, description: `${ctrlCount} ASCII control character abbreviations detected`, category: 'Encoding' });
    }
  }

  // ---- LSPK90 Clockwise (Leet Speak 90° ASCII art substitution) ----
  {
    const LSPK90_TOKENS = new Set([
      '<{', '^^', '|_|', '/\\', '\\|/', 'LL', 'LD', '][', "'--", "'\u00AF7",
      '_V_', '_|', '()', '/\\_', "O'", '^<', 'v^', '|--', '><', '>-',
      '{}', '\u00AF\u00AF', '(V', '/|\\', '_+', 'V|', 'L0', '|\u00AF\u00AF', '(X)', '0\u00AF|',
      // alternatives
      '<>', 'LL|', '[/]',
    ]);
    const hasMacron = trimmed.includes('\u00AF');
    const tokens = trimmed.split(/\s+/);
    if (tokens.length >= 3) {
      const matchCount = tokens.filter((t) => LSPK90_TOKENS.has(t)).length;
      if (matchCount >= tokens.length * 0.5 && matchCount >= 3) {
        results.push({ name: 'LSPK90 Clockwise', score: Math.min(90, 60 + matchCount * 3), description: `${matchCount}/${tokens.length} tokens match LSPK90 substitution table`, category: 'Cipher' });
      }
    } else if (hasMacron && /[<>{}\[\]|^_\\/()'v\-]/.test(trimmed)) {
      // Unspaced mode: macron is very distinctive + ASCII art chars
      const artChars = [...trimmed].filter((c) => '<>{}[]|^_\\/()\'v-\u00AF'.includes(c)).length;
      if (artChars >= trimmed.length * 0.6) {
        results.push({ name: 'LSPK90 Clockwise', score: 55, description: 'Macron (¯) + high density of ASCII art characters', category: 'Cipher' });
      }
    }
  }

  // ---- Kenny Language (only m/p/f trigrams) ----
  {
    const cleaned = noSpaces.toLowerCase();
    if (cleaned.length >= 6 && cleaned.length % 3 === 0 && /^[mpf]+$/.test(cleaned)) {
      results.push({ name: 'Kenny Language', score: 85, description: 'Only m, p, f characters in groups of 3 (South Park cipher)', category: 'Cipher' });
    }
  }

  // ---- Dice Numbers (Unicode dice faces) ----
  {
    const diceChars = [...trimmed].filter((c) => {
      const cp = c.codePointAt(0)!;
      return cp >= 0x2680 && cp <= 0x2685;
    });
    if (diceChars.length > 0 && diceChars.length >= [...trimmed].filter((c) => !(/\s/.test(c))).length * 0.7) {
      results.push({ name: 'Dice Numbers', score: 90, description: 'Unicode dice face characters (⚀-⚅)', category: 'Encoding' });
    }
  }

  // ---- Music Notes (solfege) ----
  {
    const words = trimmed.split(/[\s,\-]+/).map((w) => w.toUpperCase());
    const noteSet = new Set(['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI', 'TI']);
    const noteCount = words.filter((w) => noteSet.has(w)).length;
    if (noteCount >= 3 && noteCount >= words.length * 0.6) {
      results.push({ name: 'Music Notes', score: 80, description: 'Solfege notation (Do Re Mi Fa Sol La Si)', category: 'Cipher' });
    }
  }

  // ---- Greek Letters ----
  {
    const greekCount = [...trimmed].filter((c) => {
      const cp = c.charCodeAt(0);
      return (cp >= 0x0391 && cp <= 0x03C9);
    }).length;
    if (greekCount >= 3 && greekCount >= noSpaces.length * 0.5) {
      results.push({ name: 'Greek Letter Number', score: 75, description: 'Greek Unicode characters detected', category: 'Cipher' });
    }
  }

  // ---- Navajo Code (known words) ----
  {
    const NAVAJO_WORDS = new Set([
      'WOL-LA-CHEE', 'BE-LA-SANA', 'TSE-NILL', 'NA-HASH-CHID', 'SHUSH',
      'MOASI', 'TLA-GIN', 'BE', 'CHINDI', 'AH-JAH', 'DZEH', 'CHUO',
      'AH-TAD', 'KLIZZIE', 'TSE-GAH', 'CHA', 'TKIN', 'YEH-HES',
      'DIBEH', 'KLESH', 'GAH', 'CA-YEILTH', 'TSAH', 'A-CHIN',
    ]);
    const words = trimmed.toUpperCase().split(/\s+/);
    const navajoCount = words.filter((w) => NAVAJO_WORDS.has(w)).length;
    if (navajoCount >= 2 && navajoCount >= words.length * 0.3) {
      results.push({ name: 'Navajo Code', score: 75, description: 'Known Navajo Code Talker words detected', category: 'Cipher' });
    }
  }

  // ---- Alphabetical Ranks (triangular numbers) ----
  {
    const triSet = new Set([1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66, 78, 91, 105, 120, 136, 153, 171, 190, 210, 231, 253, 276, 300, 325, 351]);
    if (/^\d{1,3}([\s,\-]+\d{1,3})+$/.test(trimmed)) {
      const nums = trimmed.split(/[\s,\-]+/).map(Number);
      const triCount = nums.filter((n) => triSet.has(n)).length;
      if (triCount >= nums.length * 0.7 && triCount >= 3) {
        results.push({ name: 'Alphabetical Ranks Added', score: 70, description: 'Triangular numbers (1,3,6,10,15...) — cumulative letter positions', category: 'Cipher' });
      }
    }
  }

  // ---- Base100 (emoji range U+1F000-U+1F6FF, AdamNiederer scheme) ----
  {
    const emojiChars = [...trimmed].filter((c) => {
      const cp = c.codePointAt(0)!;
      return cp >= 0x1F000 && cp <= 0x1F6FF;
    });
    if (emojiChars.length > 0 && emojiChars.length >= [...trimmed].filter((c) => !(/\s/.test(c))).length * 0.7) {
      results.push({ name: 'Base100', score: 90, description: `${emojiChars.length} emoji characters in Base100 range`, category: 'Encoding' });
    }
  }

  // ---- Letter Positions (numbers 1-26) ----
  if (/^\d{1,2}([\s,\-]+\d{1,2})+$/.test(trimmed)) {
    const nums = trimmed.split(/[\s,\-]+/).map(Number);
    if (nums.every((n) => n >= 1 && n <= 26)) {
      results.push({ name: 'Letter Positions', score: 65, description: 'Numbers 1-26 — alphabet position encoding (A=1...Z=26)', category: 'Encoding' });
    }
  }

  // ---- ROT5 / ROT18 (digit rotation) ----
  if (!isBinaryOnly && !isDecimalOnly && alphaCount > 0 && digitCount > 0 && alphaCount + digitCount > len * 0.8) {
    results.push({ name: 'ROT18 Cipher', score: 35, description: 'Mixed letters and digits — could be ROT13+ROT5', category: 'Cipher' });
  } else if (!isBinaryOnly && !isDecimalOnly && digitCount > 0 && alphaCount === 0 && digitCount > len * 0.5) {
    results.push({ name: 'ROT5 Cipher', score: 35, description: 'Digits present — could be ROT5 (digits rotated by 5)', category: 'Cipher' });
  }

  // ---- Nak Nak / Duckspeak (repeated words separated by |) ----
  if (/\|/.test(trimmed)) {
    const groups = trimmed.split(/\s*\|\s*/).filter(Boolean);
    if (groups.length >= 3) {
      // Check if groups are word repetitions
      const firstWord = groups[0].trim().split(/[\s\-]+/)[0]?.toLowerCase();
      if (firstWord && firstWord.length >= 2) {
        const pattern = new RegExp(firstWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const allMatch = groups.every((g) => {
          const clean = g.trim();
          if (clean === '/') return true;
          const matches = clean.match(pattern);
          return matches && matches.length >= 1 && matches.length <= 26;
        });
        if (allMatch) {
          results.push({ name: 'Nak Nak (Duckspeak)', score: 75, description: `Repeated word "${firstWord}" separated by | — letter count encoding`, category: 'Cipher' });
        }
      }
    }
  }

  // ---- Binary Character Shapes (groups of 5 numbers 0-31) ----
  {
    const allNums = trimmed.split(/\s+/).map(Number).filter((n) => !isNaN(n));
    if (allNums.length >= 10 && allNums.length % 5 === 0 && allNums.every((n) => n >= 0 && n <= 31)) {
      results.push({ name: 'Binary Character Shapes', score: 60, description: `${allNums.length / 5} groups of 5 numbers (0-31) — could be 5×5 bitmap font`, category: 'Cipher' });
    }
  }

  // ---- Twin Hex (nibble pairs with dot/dash separator) ----
  if (/^[0-9A-Fa-f][.\-][0-9A-Fa-f]/.test(trimmed)) {
    const pairs = trimmed.split(/[\s,\n]+/).filter(Boolean);
    const twinCount = pairs.filter((p) => /^[0-9A-Fa-f][.\-][0-9A-Fa-f]$/.test(p)).length;
    if (twinCount >= 3 && twinCount >= pairs.length * 0.7) {
      results.push({ name: 'Twin Hex Cipher', score: 70, description: `${twinCount} nibble pairs detected (hex digits with separator)`, category: 'Encoding' });
    }
  }

  // ---- Prime Numbers Cipher (first 26 primes) ----
  {
    const PRIME_SET = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101]);
    if (/^\d{1,3}([\s,\-]+\d{1,3})+$/.test(trimmed)) {
      const nums = trimmed.split(/[\s,\-]+/).map(Number);
      const primeCount = nums.filter((n) => PRIME_SET.has(n)).length;
      if (primeCount >= nums.length * 0.7 && primeCount >= 3) {
        results.push({ name: 'Prime Numbers Cipher', score: 70, description: 'Numbers matching first 26 primes (2,3,5,7...101)', category: 'Cipher' });
      }
    }
  }

  // ---- Periodic Table (element symbols) ----
  {
    const ELEMENT_SYMS = new Set(['H','HE','LI','BE','B','C','N','O','F','NE','NA','MG','AL','SI','P','S','CL','AR','K','CA','SC','TI','V','CR','MN','FE','CO','NI','CU','ZN','GA','GE','AS','SE','BR','KR','RB','SR','Y','ZR','NB','MO','TC','RU','RH','PD','AG','CD','IN','SN','SB','TE','I','XE','CS','BA','LA','CE','PR','ND','PM','SM','EU','GD','TB','DY','HO','ER','TM','YB','LU','HF','TA','W','RE','OS','IR','PT','AU','HG','TL','PB','BI','PO','AT','RN','FR','RA','AC','TH','PA','U','NP','PU','AM','CM','BK','CF','ES','FM','MD','NO','LR']);
    const tokens = trimmed.split(/[\s\-]+/).filter(Boolean);
    const symCount = tokens.filter((t) => ELEMENT_SYMS.has(t.toUpperCase())).length;
    if (symCount >= 3 && symCount >= tokens.length * 0.5) {
      results.push({ name: 'Periodic Table Cipher', score: 65, description: `${symCount} element symbols detected`, category: 'Cipher' });
    }
  }

  // ---- Trithemius Ave Maria (Latin prayer words) ----
  {
    const AVE_WORDS = new Set(['deus', 'clemens', 'creator', 'coelestis', 'aeternus', 'fidelis', 'gloriosus', 'humilis', 'immortalis', 'justus', 'laudabilis', 'magnificus', 'misericors', 'nobilis', 'omnipotens', 'pius', 'potens', 'regens', 'salvator', 'trinitas', 'unitas', 'veritas', 'virtus', 'excelsus', 'zelator', 'altissimus']);
    const words = trimmed.split(/[\s,\/]+/).filter(Boolean);
    const aveCount = words.filter((w) => AVE_WORDS.has(w.toLowerCase())).length;
    if (aveCount >= 3 && aveCount >= words.length * 0.4) {
      results.push({ name: 'Trithemius Ave Maria', score: 80, description: `${aveCount} Ave Maria codebook words detected`, category: 'Cipher' });
    }
  }

  // ---- PGP Word List ----
  {
    const PGP_SAMPLE = new Set(['aardvark', 'absurd', 'accrue', 'acme', 'adrift', 'adult', 'afflict', 'ahead', 'aimless', 'baboon', 'backfield', 'backward', 'banjo', 'beaming', 'bedlamp', 'adroitness', 'adviser', 'aftermath', 'aggregate', 'alkali', 'almighty', 'amulet', 'amusement', 'antenna', 'applicant', 'babylon', 'backwater', 'barbecue']);
    const words = trimmed.split(/\s+/).filter(Boolean);
    const pgpCount = words.filter((w) => PGP_SAMPLE.has(w.toLowerCase())).length;
    if (pgpCount >= 2 && pgpCount >= words.length * 0.3) {
      results.push({ name: 'PGP Word List', score: 65, description: 'Known PGP biometric words detected', category: 'Encoding' });
    }
  }

  // ---- Wabun Code (Japanese Morse) ----
  if (/^[.\-\s/]+$/.test(trimmed) && trimmed.length >= 5) {
    // Check for Wabun-specific patterns (longer sequences than standard Morse)
    const codes = trimmed.split(/\s+/).filter((c) => c !== '/');
    const longCodes = codes.filter((c) => c.length >= 4).length;
    if (longCodes >= codes.length * 0.3 && codes.length >= 3) {
      results.push({ name: 'Wabun Code', score: 45, description: 'Morse-like patterns with longer sequences — could be Wabun (Japanese Morse)', category: 'Cipher' });
    }
  }

  // ---- GS8 Braille (8-dot Braille U+2800-U+28FF) ----
  {
    const brailleCount = [...trimmed].filter((ch) => {
      const cp = ch.codePointAt(0)!;
      return cp >= 0x2800 && cp <= 0x28FF;
    }).length;
    if (brailleCount >= 3 && brailleCount >= trimmed.length * 0.6) {
      results.push({ name: 'GS8 Braille', score: 85, description: `${brailleCount} 8-dot Braille characters (U+2800-U+28FF)`, category: 'Encoding' });
    }
  }

  // ---- Weather WKS (METAR codes) ----
  {
    const WKS_CODES = new Set(['RA', 'SN', 'FG', 'TS', 'BR', 'HZ', 'DZ', 'GR', 'GS', 'SQ', 'FC', 'SS', 'DS', 'PO', 'SA', 'FU', 'VA', 'DU', 'IC', 'PL', 'SG', 'UP', 'FZ', 'MI', 'PR', 'BC', 'DR', 'BL', 'SH']);
    const tokens = trimmed.split(/[\s,]+/).filter(Boolean);
    const wksCount = tokens.filter((t) => WKS_CODES.has(t.toUpperCase())).length;
    if (wksCount >= 1 && wksCount >= tokens.length * 0.5 && tokens.length <= 10) {
      results.push({ name: 'Weather WKS', score: 70, description: `${wksCount} METAR weather codes detected`, category: 'Encoding' });
    }
  }

  // ---- K6 Code (phone dial key-position format) ----
  if (/^\d-\d(\s+\d-\d)*$/.test(trimmed)) {
    results.push({ name: 'K6 Code', score: 65, description: 'Key-position pairs (e.g. 2-1 3-2) — K6 phone dial encoding', category: 'Cipher' });
  }

  // ---- JIS Keyboard (Mikaka — kana characters) ----
  {
    const kanaCount = [...trimmed].filter((ch) => {
      const cp = ch.codePointAt(0)!;
      return (cp >= 0x3040 && cp <= 0x309F) || (cp >= 0x30A0 && cp <= 0x30FF);
    }).length;
    const nonSpace = [...trimmed].filter((ch) => ch !== ' ').length;
    if (kanaCount >= 3 && nonSpace > 0 && kanaCount >= nonSpace * 0.7) {
      results.push({ name: 'JIS Keyboard', score: 55, description: `${kanaCount} Japanese kana characters — could be JIS keyboard mapping`, category: 'Cipher' });
    }
  }

  // ---- Base65536 (CJK + SMP ranges used by qntm/base65536) ----
  {
    const isB65536 = (cp: number) =>
      (cp >= 0x3400 && cp <= 0x4CFF) ||   // CJK Ext A
      (cp >= 0x4E00 && cp <= 0x9EFF) ||   // CJK Unified
      (cp >= 0xA100 && cp <= 0xA3FF) ||   // Yi Syllables
      (cp >= 0xA500 && cp <= 0xA5FF) ||   // Vai
      (cp >= 0x1500 && cp <= 0x15FF) ||   // Unified Canadian Aboriginal (padding)
      (cp >= 0x10600 && cp <= 0x106FF) || // Linear A
      (cp >= 0x12000 && cp <= 0x122FF) || // Cuneiform
      (cp >= 0x13000 && cp <= 0x133FF) || // Egyptian Hieroglyphs
      (cp >= 0x14400 && cp <= 0x145FF) || // Anatolian Hieroglyphs
      (cp >= 0x16800 && cp <= 0x169FF) || // Bamum Supplement
      (cp >= 0x20000 && cp <= 0x285FF);   // CJK Ext B
    const b65kCount = [...trimmed].filter(ch => isB65536(ch.codePointAt(0)!)).length;
    const totalChars = [...trimmed].filter(ch => ch.trim() !== '').length;
    if (b65kCount >= 3 && totalChars > 0 && b65kCount >= totalChars * 0.8) {
      results.push({ name: 'Base65536', score: 85, description: `${b65kCount} Base65536 characters (CJK/SMP ranges)`, category: 'Encoding' });
    }
  }

  // ---- Baudot Code (5-bit binary groups) ----
  {
    const baudotMatch = trimmed.match(/^(?:[01]{5}[\s]+)*[01]{5}$/);
    if (baudotMatch) {
      const groups = trimmed.split(/\s+/).filter(Boolean);
      if (groups.length >= 3 && groups.every(g => g.length === 5 && /^[01]+$/.test(g))) {
        let score = 80;
        // More groups = higher confidence
        if (groups.length >= 6) score += 5;
        if (groups.length >= 10) score += 5;
        results.push({ name: 'Baudot Code', score: Math.min(score, 95), description: `${groups.length} 5-bit binary groups — Baudot/ITA2 encoding`, category: 'Encoding' });
      }
    }
  }

  // ---- Bubble Babble (x...x with dash-separated CVCVC/VCVCV tuples) ----
  {
    const bbLower = trimmed.toLowerCase();
    // Must start with x, end with x, have dash-separated groups of lowercase letters
    if (bbLower.length >= 5 && bbLower[0] === 'x' && bbLower[bbLower.length - 1] === 'x' &&
        /^x[a-z]{2,5}(?:-[a-z]{3,6})*(?:-[a-z]{2,5})?x$/.test(bbLower)) {
      const bbVowels = new Set('aeiouy');
      const bbConsonants = new Set('bcdfghklmnprstvz');
      // Strip x...x and split tuples
      const inner = bbLower.slice(1, -1);
      const tuples = inner.split('-');
      // Check that all chars are from the Bubble Babble alphabet (vowels + consonants + x)
      const allBBChars = [...inner.replace(/-/g, '')].every(ch =>
        bbVowels.has(ch) || bbConsonants.has(ch) || ch === 'x'
      );
      if (allBBChars && tuples.length >= 1) {
        // Check CVCVC or VCVCV patterns in middle tuples
        const midTuples = tuples.slice(1, -1);
        const midOk = midTuples.every(t => {
          if (t.length !== 5) return false;
          // Bubble Babble tuples: VCVCC (standard), CVCVC, or VCVCV
          const p = [...t].map(ch => bbVowels.has(ch) ? 'V' : 'C').join('');
          return p === 'VCVCC' || p === 'CVCVC' || p === 'VCVCV';
        });
        if (midOk || tuples.length <= 2) {
          let score = 80;
          if (tuples.length >= 3) score += 5;
          if (tuples.length >= 5) score += 5;
          // Consistent alternating V/C pattern is strong signal
          if (midTuples.length >= 2) score += 5;
          results.push({ name: 'Bubble Babble', score: Math.min(score, 95), description: `Bubble Babble format — ${tuples.length} tuples, x...x wrapper with dash separators`, category: 'Encoding' });
        }
      }
    }
  }

  // ---- Chuck Norris Unary (only "0" and "00" groups) ----
  {
    const cnTokens = trimmed.split(/\s+/).filter(Boolean);
    if (cnTokens.length >= 4 && cnTokens.length % 2 === 0 && cnTokens.every(t => /^0+$/.test(t))) {
      const prefixesValid = cnTokens.every((t, i) => i % 2 === 1 || t === '0' || t === '00');
      if (prefixesValid) {
        results.push({ name: 'Chuck Norris Unary', score: 80, description: `${cnTokens.length} groups of 0s — Chuck Norris unary encoding`, category: 'Encoding' });
      }
    }
  }

  // ---- UUencode (ASCII 32-95 + backtick, length prefix) ----
  {
    // Check for "begin NNN filename" header (wrapped format)
    const hasBegin = /^begin\s+\d{3}\s+\S+/m.test(trimmed);
    if (hasBegin) {
      results.push({ name: 'UUencode', score: 95, description: 'UUencoded data with "begin" header', category: 'Encoding' });
    } else {
      // Raw UUencode: chars in range 32-95 + backtick (96), first char is length prefix
      const uuLines = trimmed.split(/\r?\n/).filter(l => l.length > 0);
      if (uuLines.length >= 1) {
        const allValid = uuLines.every(line => {
          // Every char must be in UUencode range: ASCII 32-95 or backtick (96)
          return [...line].every(ch => {
            const c = ch.charCodeAt(0);
            return (c >= 32 && c <= 95) || c === 96;
          });
        });
        if (allValid) {
          // Check length prefix: first char decodes to line length
          const validPrefixes = uuLines.every(line => {
            const prefixLen = (line.charCodeAt(0) - 32) & 0x3F;
            const expectedChars = 1 + Math.ceil(prefixLen / 3) * 4;
            // Allow some slack (padding may add extra chars)
            return prefixLen >= 1 && prefixLen <= 45 && line.length >= expectedChars - 1 && line.length <= expectedChars + 2;
          });
          // Must have special chars (not just alphanumeric) to distinguish from plain text
          const hasSpecial = /[!-/:-@\[-`]/.test(trimmed);
          if (validPrefixes && hasSpecial) {
            let score = 75;
            // Exact length match is strong signal
            const exactMatch = uuLines.every(line => {
              const pl = (line.charCodeAt(0) - 32) & 0x3F;
              return line.length === 1 + Math.ceil(pl / 3) * 4;
            });
            if (exactMatch) score += 5;
            // More lines = higher confidence
            if (uuLines.length >= 2) score += 5;
            // Backtick present is strong signal (UU-specific)
            if (trimmed.includes('`')) score += 10;
            results.push({ name: 'UUencode', score: Math.min(score, 95), description: `${uuLines.length} UUencoded data line(s) with valid length prefix`, category: 'Encoding' });
          }
        }
      }
    }
  }

  // ---- Wingdings (known Wingdings Unicode symbols) ----
  {
    const wdSymbols = [...trimmed].filter(ch => {
      const cp = ch.codePointAt(0)!;
      return (cp >= 0x2600 && cp <= 0x27BF) || // Misc symbols, Dingbats
             (cp >= 0x2700 && cp <= 0x27FF) || // Dingbats
             (cp >= 0x1F300 && cp <= 0x1F6FF); // Misc Symbols & Pictographs
    }).length;
    const nonSpace = [...trimmed].filter(ch => ch.trim() !== '').length;
    if (wdSymbols >= 3 && nonSpace > 0 && wdSymbols >= nonSpace * 0.7) {
      results.push({ name: 'Wingdings', score: 55, description: `${wdSymbols} symbol characters — possible Wingdings font encoding`, category: 'Encoding' });
    }
  }

  // ---- Zalgo Text (lots of combining diacritical marks) ----
  {
    const combiningCount = [...trimmed].filter(ch => {
      const cp = ch.codePointAt(0)!;
      return (cp >= 0x0300 && cp <= 0x036F) || (cp >= 0x1AB0 && cp <= 0x1AFF) ||
             (cp >= 0x1DC0 && cp <= 0x1DFF) || (cp >= 0x20D0 && cp <= 0x20FF) ||
             (cp >= 0xFE20 && cp <= 0xFE2F);
    }).length;
    const totalLen = [...trimmed].length;
    if (combiningCount >= 5 && totalLen > 0 && combiningCount / totalLen > 0.3) {
      results.push({ name: 'Zalgo Text', score: 90, description: `${combiningCount} combining marks — Zalgo/corrupted text`, category: 'Encoding' });
    }
  }

  // ---- Hexagram (I Ching U+4DC0-U+4DFF) ----
  {
    const hexagramCount = [...trimmed].filter(ch => {
      const cp = ch.codePointAt(0)!;
      return cp >= 0x4DC0 && cp <= 0x4DFF;
    }).length;
    const nonSpace2 = [...trimmed].filter(ch => ch.trim() !== '').length;
    if (hexagramCount >= 3 && nonSpace2 > 0 && hexagramCount >= nonSpace2 * 0.7) {
      results.push({ name: 'Hexagram', score: 85, description: `${hexagramCount} I Ching hexagram characters (U+4DC0-U+4DFF)`, category: 'Encoding' });
    }
  }

  // ---- LEB128 (hex byte pairs where MSB continuation bits are set) ----
  {
    const hexParts = trimmed.split(/\s+/).filter(Boolean);
    if (hexParts.length >= 2 && hexParts.every(p => /^[0-9A-Fa-f]{2}$/.test(p))) {
      const bytes = hexParts.map(h => parseInt(h, 16));
      let hasContBits = false;
      for (const b of bytes) {
        if (b & 0x80) { hasContBits = true; break; }
      }
      if (hasContBits && bytes[bytes.length - 1] !== undefined && (bytes[bytes.length - 1] & 0x80) === 0) {
        results.push({ name: 'LEB128', score: 40, description: 'Hex bytes with continuation bits — possible LEB128 encoding', category: 'Encoding' });
      }
    }
  }

  // ---- Base36 / Base26 / Base37 (word-as-number ciphers) ----
  if (!isBinaryOnly) {
    const b36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numTokens = trimmed.split(/[\s,]+/).filter(Boolean);
    const allDecimal = numTokens.length >= 1 && numTokens.every(t => /^\d+$/.test(t));
    if (allDecimal && numTokens.length >= 1) {
      // Try Base36 decode: decimal → base-36 string
      try {
        const words36: string[] = [];
        let valid36 = true;
        for (const t of numTokens) {
          let n = BigInt(t);
          if (n < 0n) { valid36 = false; break; }
          if (n === 0n) { words36.push('0'); continue; }
          let w = '';
          while (n > 0n) { w = b36[Number(n % 36n)] + w; n = n / 36n; }
          // Base36 words should be alphanumeric and reasonable length
          if (w.length > 20) { valid36 = false; break; }
          words36.push(w.toLowerCase());
        }
        if (valid36 && words36.length >= 1) {
          const decoded = words36.join(' ');
          // Check readability: mostly printable with some letter content
          const hasLetters = /[a-z]/i.test(decoded);
          if (hasLetters) {
            let score = 50;
            if (numTokens.length >= 2) score += 10;
            // Boost if decoded contains common words
            const lower = decoded.toLowerCase();
            let wordHits = 0;
            for (const w of CI_COMMON_WORDS) {
              if (lower.includes(w)) wordHits++;
            }
            if (wordHits >= 2) score += 20;
            else if (wordHits >= 1) score += 10;
            results.push({ name: 'Base36', score: Math.min(score, 95), description: `Decimal numbers → base-36 words: "${decoded}"`, category: 'Encoding', reversed: decoded });
          }
        }
      } catch { /* BigInt parse error */ }

      // Try Base26 decode: decimal → A-Z letters
      try {
        const words26: string[] = [];
        let valid26 = true;
        for (const t of numTokens) {
          let n = BigInt(t);
          if (n < 0n) { valid26 = false; break; }
          if (n === 0n) { words26.push('A'); continue; }
          let w = '';
          while (n > 0n) { w = String.fromCharCode(Number(n % 26n) + 65) + w; n = n / 26n; }
          if (w.length > 20) { valid26 = false; break; }
          words26.push(w);
        }
        if (valid26 && words26.length >= 1) {
          const decoded = words26.join(' ');
          let score = 45;
          if (numTokens.length >= 2) score += 10;
          const lower = decoded.toLowerCase();
          let wordHits = 0;
          for (const w of CI_COMMON_WORDS) {
            if (lower.includes(w)) wordHits++;
          }
          if (wordHits >= 2) score += 20;
          else if (wordHits >= 1) score += 10;
          results.push({ name: 'Base26', score: Math.min(score, 90), description: `Decimal numbers → base-26 letters: "${decoded}"`, category: 'Encoding', reversed: decoded });
        }
      } catch { /* BigInt parse error */ }
    }

    // Try Base37 decode: single decimal → text with spaces (0-9, A-Z, space)
    if (allDecimal && numTokens.length === 1 && numTokens[0].length >= 4) {
      try {
        const B37 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ ';
        let n = BigInt(numTokens[0]);
        if (n > 0n) {
          let decoded = '';
          let tooLong = false;
          while (n > 0n) {
            decoded = B37[Number(n % 37n)] + decoded;
            n = n / 37n;
            if (decoded.length > 100) { tooLong = true; break; }
          }
          if (!tooLong && decoded.length >= 2 && /[A-Z]/.test(decoded)) {
            let score = 40;
            // Boost if contains spaces (real text)
            if (decoded.includes(' ')) score += 15;
            const lower = decoded.toLowerCase();
            let wordHits = 0;
            for (const w of CI_COMMON_WORDS) {
              if (lower.includes(w)) wordHits++;
            }
            if (wordHits >= 2) score += 20;
            else if (wordHits >= 1) score += 10;
            results.push({ name: 'Base37', score: Math.min(score, 90), description: `Decimal → base-37 text: "${decoded}"`, category: 'Encoding', reversed: decoded });
          }
        }
      } catch { /* BigInt parse error */ }
    }
  }

  // ---- Z-Base-32 (uses z-base-32 alphabet: ybndrfg8ejkmcpqxot1uwisza345h769) ----
  {
    const zb32Chars = new Set('ybndrfg8ejkmcpqxot1uwisza345h769');
    const clean = trimmed.toLowerCase().replace(/\s+/g, '');
    if (clean.length >= 4 && [...clean].every(ch => zb32Chars.has(ch)) && /[a-z]/.test(clean) && /[0-9]/.test(clean)) {
      results.push({ name: 'Z-Base-32', score: 55, description: 'Characters match z-base-32 alphabet', category: 'Encoding' });
    }
  }

  // ---- Base58 (Bitcoin: 1-9 A-Z a-z excluding 0, O, I, l) ----
  {
    const b58Chars = new Set('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
    if (noSpaces.length >= 4 && [...noSpaces].every(ch => b58Chars.has(ch))) {
      // Key: must NOT contain 0, O, I, or l
      const hasExcluded = /[0OIl]/.test(noSpaces);
      if (!hasExcluded) {
        let score = 55;
        const hasDigits = /[1-9]/.test(noSpaces);
        const hasUpper = /[A-Z]/.test(noSpaces);
        const hasLower = /[a-z]/.test(noSpaces);
        // Mixed case + digits is strong Base58 signal
        if (hasDigits && hasUpper && hasLower) score += 15;
        else if ((hasDigits && hasUpper) || (hasDigits && hasLower) || (hasUpper && hasLower)) score += 10;
        if (noSpaces.length >= 10) score += 5;
        if (noSpaces.length >= 20) score += 5;
        // Bitcoin addresses start with 1 or 3 or bc1
        if (/^[13][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(noSpaces)) score += 15;
        results.push({ name: 'Base58', score: Math.min(score, 90), description: `Base58 charset (1-9, A-Z, a-z minus 0/O/I/l), ${noSpaces.length} chars`, category: 'Encoding' });
      }
    }
  }

  // ---- Base45 (0-9A-Z $%*+-./:) ----
  if (!isBinaryOnly && !isDecimalOnly) {
    // Base45 alphabet: 0-9 A-Z space $ % * + - . / :
    const b45Chars = new Set('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:');
    const cleanB45 = trimmed.toUpperCase();
    if (cleanB45.length >= 3 && [...cleanB45].every(ch => b45Chars.has(ch))) {
      // Must be uppercase-only (no lowercase in input — Base45 is case-sensitive uppercase)
      const hasLowercase = /[a-z]/.test(trimmed);
      if (!hasLowercase) {
        let score = 50;
        const hasDigits = /[0-9]/.test(cleanB45);
        const hasLetters = /[A-Z]/.test(cleanB45);
        if (hasDigits && hasLetters) score += 10;
        // Base45 special chars ($%*+-./:) boost confidence
        const b45Special = [...cleanB45].filter(ch => '$%*+-./:'.includes(ch)).length;
        if (b45Special > 0) score += 15;
        // EU DCC prefix HC1: is very strong signal
        if (trimmed.startsWith('HC1:')) score += 25;
        // Length divisible by 3 (Base45 encodes 2 bytes into 3 chars)
        if (cleanB45.replace(/\s/g, '').length % 3 === 0) score += 5;
        // Longer strings more likely encoded
        if (cleanB45.length >= 10) score += 5;
        results.push({ name: 'Base45', score: Math.min(score, 95), description: trimmed.startsWith('HC1:') ? 'EU Digital COVID Certificate (HC1: prefix) — Base45 encoded' : `Base45 charset (0-9, A-Z, $%*+-./: space), ${cleanB45.length} chars`, category: 'Encoding' });
      }
    }
  }

  // ---- Base32 Crockford (0-9A-Z excluding I, L, O, U) ----
  if (!isBinaryOnly && !isDecimalOnly) {
    const crockfordAlpha = new Set('0123456789ABCDEFGHJKMNPQRSTVWXYZ');
    const cleanCF = noSpaces.toUpperCase().replace(/-/g, '');
    if (cleanCF.length >= 4 && [...cleanCF].every(ch => crockfordAlpha.has(ch))) {
      // Key distinguisher: must NOT contain I, L, O, or U (excluded in Crockford)
      const hasExcluded = /[ILOU]/i.test(noSpaces);
      if (!hasExcluded) {
        let score = 50;
        // Strong signal: contains digits mixed with uppercase letters
        const hasDigits = /[0-9]/.test(cleanCF);
        const hasLetters = /[A-Z]/.test(cleanCF);
        if (hasDigits && hasLetters) score += 15;
        // Longer strings are more likely encoded data
        if (cleanCF.length >= 10) score += 10;
        if (cleanCF.length >= 20) score += 5;
        // Hyphens in original (common Crockford formatting) boost score
        if (noSpaces.includes('-')) score += 10;
        results.push({ name: 'Base32 Crockford', score: Math.min(score, 85), description: `Crockford Base32 charset (0-9, A-Z minus I/L/O/U), ${cleanCF.length} chars`, category: 'Encoding' });
      }
    }
  }

  // ---- ROT8000 (Unicode Caesar shift through valid BMP code points) ----
  {
    // Check if input has significant non-ASCII chars that could be ROT8000 output
    const nonAsciiCount = [...trimmed].filter(ch => ch.charCodeAt(0) > 127).length;
    const totalChars = [...trimmed].filter(ch => ch.trim().length > 0).length;
    if (totalChars >= 3 && nonAsciiCount / totalChars >= 0.5) {
      // Try ROT8000 decode and check if result is readable ASCII
      const decoded = rot8000(trimmed);
      const asciiCount = [...decoded].filter(ch => {
        const cp = ch.charCodeAt(0);
        return cp >= 32 && cp <= 126;
      }).length;
      const decodedNonWs = [...decoded].filter(ch => ch.trim().length > 0).length;
      if (decodedNonWs > 0 && asciiCount / decodedNonWs >= 0.8) {
        let score = 70;
        // Higher non-ASCII ratio → more confident
        if (nonAsciiCount / totalChars >= 0.8) score += 10;
        // Check if decoded text has English letter distribution
        const letterCount = [...decoded].filter(ch => /[a-zA-Z]/.test(ch)).length;
        if (letterCount / decodedNonWs >= 0.5) score += 10;
        results.push({
          name: 'ROT8000',
          score: Math.min(score, 95),
          description: `${nonAsciiCount}/${totalChars} non-ASCII chars → decodes to readable ASCII`,
          category: 'Cipher',
          reversed: decoded.length > 200 ? decoded.slice(0, 200) + '\u2026' : decoded,
        });
      }
    }
  }

  // ---- RSA / Large Number ----
  {
    // Detect large decimal numbers (>=64 digits) or hex (>=48 hex chars)
    const decimalMatch = /^[0-9]+$/.test(noSpaces);
    const hexMatch = /^(0x)?[0-9a-fA-F]+$/i.test(noSpaces);
    const hexClean = noSpaces.replace(/^0x/i, '');
    if (decimalMatch && noSpaces.length >= 64) {
      // Score scales with digit count: 64→35, 128→55, 256→75
      const score = Math.min(35 + Math.floor((noSpaces.length - 64) * 40 / 192), 75);
      results.push({
        name: 'RSA Ciphertext',
        score,
        description: `Large ${noSpaces.length}-digit decimal number — possible RSA ciphertext`,
        category: 'Cipher',
      });
    } else if (!decimalMatch && hexMatch && hexClean.length >= 48) {
      const score = Math.min(35 + Math.floor((hexClean.length - 48) * 40 / 192), 75);
      results.push({
        name: 'RSA Ciphertext',
        score,
        description: `Large ${hexClean.length}-char hex number — possible RSA ciphertext`,
        category: 'Cipher',
      });
    }
  }

  // ---- Esoteric Languages ----
  for (const detector of esolangDetectors) {
    const match = detector.detect(trimmed);
    if (match) {
      let reversed: string | undefined;
      if (detector.tryExecute) {
        try { reversed = detector.tryExecute(trimmed); } catch { /* ignore */ }
      }
      results.push({
        name: detector.name,
        score: match.score,
        description: match.description,
        category: 'Esoteric Language',
        reversed,
      });
    }
  }

  // ---- Build clue list from key1, key2, and extraClues ----
  const allClues: string[] = [];
  if (key1) allClues.push(key1);
  if (key2) allClues.push(key2);
  for (const c of extraClues) {
    if (c && c !== key1 && c !== key2) allClues.push(c);
  }

  // ---- Clue-based analysis ----
  if (allClues.length > 0) {
    applyClueAnalysis(trimmed, lettersOnly, allClues, results);
  }

  // ---- Encryption analysis (key+IV pairs, key-only ciphers) ----
  if (key1 || key2) {
    applyKeyPairAnalysis(trimmed, key1 || '', key2 || '', results);
  }

  // ---- Trial decode for encoding results: boost score if decode gives readable ASCII ----
  {
    const trialDecoders: Record<string, (s: string) => string | undefined> = {
      'Base64': (s) => reverseBase64(noSpaces),
      'Base32': (s) => reverseBase32(noSpaces),
      'Hexadecimal': (s) => reverseHex(s),
      'Binary': (s) => reverseBinary(s),
      'Octal': (s) => reverseOctal(s),
      'Z-Base-32': (s) => reverseZBase32(s),
      'Base32 Crockford': (s) => reverseBase32Crockford(s),
      'Base58': (s) => reverseBase58(noSpaces),
      'Base45': (s) => reverseBase45(noSpaces),
    };
    for (const r of results) {
      if (r.category !== 'Encoding') continue;

      // Use existing reversed if available, otherwise try decoder
      let decoded: string | undefined = r.reversed || undefined;
      if (!decoded) {
        const decoder = trialDecoders[r.name];
        if (!decoder) continue;
        try { decoded = decoder(trimmed); } catch { /* decode failed */ }
      }

      if (decoded && decoded.length > 0) {
        const printableCount = [...decoded].filter(ch => {
          const c = ch.charCodeAt(0);
          return (c >= 32 && c <= 126) || c === 9 || c === 10 || c === 13;
        }).length;
        const ratio = printableCount / decoded.length;
        if (ratio >= 0.9) {
          r.reversed = decoded;
          r.score = Math.min(r.score + 25, 95);
        } else if (ratio >= 0.7) {
          r.reversed = decoded;
          r.score = Math.min(r.score + 15, 90);
        } else {
          // Decode produced mostly non-printable: penalize
          r.score = Math.max(r.score - 10, 10);
          r.reversed = undefined; // don't show garbage preview
        }
      } else if (trialDecoders[r.name]) {
        // Had a decoder but it returned empty/failed: slight penalty
        r.score = Math.max(r.score - 5, 10);
      }
    }
  }

  // ---- Sort and return ----
  results.sort((a, b) => b.score - a.score);
  return results;
}

/* ------------------------------------------------------------------ */
/*  Caesar shift finder                                                */
/* ------------------------------------------------------------------ */

function findBestCaesarShift(counts: number[]): number {
  const n = counts.reduce((a, b) => a + b, 0);
  if (n === 0) return 0;

  let bestShift = 0;
  let bestChi = Infinity;

  for (let shift = 0; shift < 26; shift++) {
    const expected = ENGLISH_FREQ.map((f) => f * n);
    const shifted = new Array(26);
    for (let i = 0; i < 26; i++) {
      shifted[i] = counts[(i + shift) % 26];
    }
    const chi = chiSquared(shifted, expected);
    if (chi < bestChi) {
      bestChi = chi;
      bestShift = shift;
    }
  }

  return bestShift;
}

/* ------------------------------------------------------------------ */
/*  Clue / Crib analysis                                               */
/* ------------------------------------------------------------------ */

/**
 * Try each clue as both a key (decrypt and check output) and a crib
 * (known plaintext — derive key and check consistency).
 */
function applyClueAnalysis(
  input: string,
  lettersOnly: string,
  clues: string[],
  results: CipherMatch[],
) {
  for (const clue of clues) {
    if (clue.length < 1) continue;

    const clueLetters = clue.replace(/[^A-Za-z]/g, '').toUpperCase();

    // --- Clue as CRIB (known plaintext) ---
    if (clueLetters.length >= 2 && lettersOnly.length >= clueLetters.length) {
      const caesarCrib = tryCaesarCrib(lettersOnly, clueLetters);
      if (caesarCrib !== null) {
        boostOrAdd(results, 'Caesar / ROT Cipher', 30,
          `Crib "${clue}" found at shift ${caesarCrib.shift}${caesarCrib.shift === 13 ? ' (ROT13)' : ''}`, 'Cipher',
          reverseCaesar(input, caesarCrib.shift));
      }
    }

    if (clue.length >= 2 && input.length >= clue.length) {
      const xorCrib = tryXorCrib(input, clue);
      if (xorCrib !== null) {
        boostOrAdd(results, 'XOR Cipher', 35,
          `Crib "${clue}" → repeating key pattern detected (key: ${xorCrib})`, 'Cipher',
          reverseXorKey(input, xorCrib));
      }
    }

    // --- Clue as KEY (decrypt with it) ---
    const upperLetters = lettersOnly.toUpperCase();
    if (clueLetters.length >= 1 && upperLetters.length >= 4) {
      // Vigenere: decrypt with clue as key, check IC + readability
      const vig = tryVigenereKey(upperLetters, clueLetters);
      if (looksReadable(vig.text)) {
        boostOrAdd(results, 'Vigenère Cipher', 30,
          `Key "${clue}" → IC=${vig.ic.toFixed(4)} (English-like)`, 'Cipher',
          reverseVigenere(input, clueLetters),
          [{ op: 'Vigenère Decode', args: [clue] }]);
      }

      // Beaufort: decrypt with clue as key, check IC + readability
      const beau = tryBeaufortKey(upperLetters, clueLetters);
      if (looksReadable(beau.text)) {
        boostOrAdd(results, 'Beaufort Cipher', 30,
          `Key "${clue}" → IC=${beau.ic.toFixed(4)} (English-like)`, 'Cipher',
          reverseBeaufort(input, clueLetters),
          [{ op: 'Beaufort Cipher', args: [clue] }]);
      }

      // Autokey: decrypt with clue as primer, check IC + readability
      const autokey = tryAutokeyKey(upperLetters, clueLetters);
      if (looksReadable(autokey.text)) {
        boostOrAdd(results, 'Autokey Cipher', 25,
          `Key "${clue}" → IC=${autokey.ic.toFixed(4)} (English-like)`, 'Cipher',
          reverseAutokey(input, clueLetters),
          [{ op: 'Autokey Cipher', args: [clue, 'Decode'] }]);
      }
    }

    // XOR as key
    if (clue.length >= 1 && input.length >= 4) {
      if (tryXorKey(input, clue)) {
        boostOrAdd(results, 'XOR Cipher', 30,
          `XOR with key "${clue}" produces printable output`, 'Cipher',
          reverseXorKey(input, clue),
          [{ op: 'XOR', args: [{ option: 'UTF8', string: clue }, 'Standard', false] }]);
      }
    }

    // RC4: try clue as passphrase on raw byte input
    if (clue.length >= 1 && input.length >= 4) {
      const rc4Result = tryRC4Key(input, clue);
      if (rc4Result) {
        boostOrAdd(results, 'RC4', 35,
          `RC4 with key "${clue}" → readable output`, 'Cipher',
          rc4Result,
          [{ op: 'RC4', args: [{ string: clue, option: 'UTF8' }, 'Latin1', 'UTF8'] }]);
      }
    }

    // Caesar: check if clue is a numeric shift
    const numClue = parseInt(clue, 10);
    if (!isNaN(numClue) && numClue >= 1 && numClue <= 25 && upperLetters.length >= 4) {
      const shifted = caesarDecrypt(upperLetters, numClue);
      if (looksReadable(shifted)) {
        const shiftedIC = indexOfCoincidence(shifted);
        boostOrAdd(results, 'Caesar / ROT Cipher', 25,
          `Shift ${numClue} → IC=${shiftedIC.toFixed(4)} (English-like)`, 'Cipher',
          reverseCaesar(input, numClue));
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Key+IV/Nonce pair analysis for ALL encryption operations            */
/* ------------------------------------------------------------------ */

/** Detect if a string looks like hex-encoded bytes. */
function isHexStr(s: string): boolean {
  return /^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0 && s.length >= 2;
}

/** Build a toggleString arg value. */
function toggleStr(s: string, fmt: 'Hex' | 'UTF8'): { string: string; option: string } {
  return { string: s, option: fmt };
}

/** A key/IV interpretation: raw string, format, and byte length. */
interface KeyInterp { str: string; fmt: 'Hex' | 'UTF8'; bytes: number }

/** Get all plausible interpretations (UTF8 always; Hex if valid). */
function keyInterpretations(s: string): KeyInterp[] {
  const r: KeyInterp[] = [{ str: s, fmt: 'UTF8', bytes: s.length }];
  if (isHexStr(s)) r.push({ str: s, fmt: 'Hex', bytes: s.length / 2 });
  return r;
}

/**
 * Analyze key1+key2 as key/IV|nonce pairs for all CyberChef encryption operations.
 * Tries both orderings and both format interpretations (Hex/UTF8).
 *
 * Covered operations:
 *   Block ciphers:  AES, DES, 3DES, Blowfish, RC2, SM4, GOST
 *   Stream ciphers: ChaCha, Salsa20, XSalsa20, Rabbit, RC4, RC4 Drop
 *   Key-only:       CipherSaber2, XXTEA, Fernet, LS47
 */
function applyKeyPairAnalysis(
  input: string,
  key1: string,
  key2: string,
  results: CipherMatch[],
) {
  const inputIsHex = /^[0-9a-fA-F\s]+$/.test(input.trim()) && input.trim().length >= 4;
  const inputFmt = inputIsHex ? 'Hex' : 'Raw';

  const interps1 = keyInterpretations(key1);
  const interps2 = keyInterpretations(key2);
  const added = new Set<string>();

  /** Deduplicated add helper */
  const emit = (
    label: string, score: number, desc: string,
    recipe: { op: string; args: any[] }[],
    k: KeyInterp, iv: KeyInterp | null,
  ) => {
    const dk = `${label}:${k.fmt}:${iv?.fmt ?? 'none'}`;
    if (added.has(dk)) return;
    added.add(dk);
    const fmtNote = iv ? `[key:${k.fmt}, iv:${iv.fmt}]` : `[key:${k.fmt}]`;
    boostOrAdd(results, label, score, `${desc} ${fmtNote}`, 'Cipher', undefined, recipe);
  };

  // ─── AES: key 16/24/32, IV 16 ──────────────────────────────
  const aesKeySizes = [16, 24, 32];
  const aesModes = ['CBC', 'CTR', 'GCM', 'ECB', 'CFB', 'OFB'];
  const tryAes = (k: KeyInterp, iv: KeyInterp) => {
    if (!aesKeySizes.includes(k.bytes) || iv.bytes !== 16) return;
    const bits = k.bytes * 8;
    for (const mode of aesModes) {
      const score = mode === 'CBC' ? 30 : mode === 'CTR' || mode === 'GCM' ? 25 : 15;
      const args: any[] = [toggleStr(k.str, k.fmt), toggleStr(iv.str, iv.fmt), mode, inputFmt, 'Raw'];
      if (mode === 'GCM') { args.push({ string: '', option: 'Hex' }); args.push({ string: '', option: 'Hex' }); }
      emit(`AES-${bits}-${mode}`, score, `Key ${bits}-bit${mode === 'ECB' ? '' : ' + IV'}`,
        [{ op: 'AES Decrypt', args }], k, iv);
    }
  };

  // ─── SM4: key 16, IV 16 ────────────────────────────────────
  const sm4Modes = ['CBC', 'CTR', 'ECB', 'CFB', 'OFB'];
  const trySM4 = (k: KeyInterp, iv: KeyInterp) => {
    if (k.bytes !== 16 || iv.bytes !== 16) return;
    for (const mode of sm4Modes) {
      const score = mode === 'CBC' ? 20 : 10;
      emit(`SM4-${mode}`, score, `Key 128-bit${mode === 'ECB' ? '' : ' + IV'}`,
        [{ op: 'SM4 Decrypt', args: [toggleStr(k.str, k.fmt), toggleStr(iv.str, iv.fmt), mode, inputFmt, 'Raw'] }], k, iv);
    }
  };

  // ─── DES: key 8, IV 8 ─────────────────────────────────────
  const desModes = ['CBC', 'ECB', 'CTR', 'CFB', 'OFB'];
  const tryDES = (k: KeyInterp, iv: KeyInterp) => {
    if (k.bytes !== 8 || iv.bytes !== 8) return;
    for (const mode of desModes) {
      const score = mode === 'CBC' ? 25 : 15;
      emit(`DES-${mode}`, score, `Key 64-bit${mode === 'ECB' ? '' : ' + IV'}`,
        [{ op: 'DES Decrypt', args: [toggleStr(k.str, k.fmt), toggleStr(iv.str, iv.fmt), mode, inputFmt, 'Raw'] }], k, iv);
    }
  };

  // ─── Triple DES: key 24, IV 8 ─────────────────────────────
  const try3DES = (k: KeyInterp, iv: KeyInterp) => {
    if (k.bytes !== 24 || iv.bytes !== 8) return;
    for (const mode of desModes) {
      const score = mode === 'CBC' ? 25 : 15;
      emit(`3DES-${mode}`, score, `Key 192-bit${mode === 'ECB' ? '' : ' + IV'}`,
        [{ op: 'Triple DES Decrypt', args: [toggleStr(k.str, k.fmt), toggleStr(iv.str, iv.fmt), mode, inputFmt, 'Raw'] }], k, iv);
    }
  };

  // ─── Blowfish: key 4-56 (excl 8,24), IV 8 ─────────────────
  const tryBlowfish = (k: KeyInterp, iv: KeyInterp) => {
    if (k.bytes < 4 || k.bytes > 56 || k.bytes === 8 || k.bytes === 24 || iv.bytes !== 8) return;
    for (const mode of ['CBC', 'ECB', 'CTR', 'CFB', 'OFB']) {
      const score = mode === 'CBC' ? 20 : 10;
      emit(`Blowfish-${mode}`, score, `Key ${k.bytes * 8}-bit${mode === 'ECB' ? '' : ' + IV'}`,
        [{ op: 'Blowfish Decrypt', args: [toggleStr(k.str, k.fmt), toggleStr(iv.str, iv.fmt), mode, inputFmt, 'Raw'] }], k, iv);
    }
  };

  // ─── RC2: key 1-128 (common: 8,16), IV 8 ──────────────────
  // RC2 has no Mode arg: [Key, IV, Input, Output]
  const tryRC2 = (k: KeyInterp, iv: KeyInterp) => {
    if (k.bytes < 1 || k.bytes > 128 || iv.bytes !== 8) return;
    // Only suggest for common key sizes to avoid noise
    if (![5, 8, 16, 24, 32].includes(k.bytes)) return;
    emit('RC2', 15, `Key ${k.bytes * 8}-bit + IV`,
      [{ op: 'RC2 Decrypt', args: [toggleStr(k.str, k.fmt), toggleStr(iv.str, iv.fmt), inputFmt, 'Raw'] }], k, iv);
  };

  // ─── GOST: key 32, IV 8 ───────────────────────────────────
  // Args: [Key, IV, Input, Output, Algorithm, sBox, Block mode, Key meshing, Padding]
  const tryGOST = (k: KeyInterp, iv: KeyInterp) => {
    if (k.bytes !== 32 || iv.bytes !== 8) return;
    for (const algo of ['GOST 28147 (1989)', 'GOST R 34.12 (Kuznyechik, 2015)']) {
      const short = algo.includes('28147') ? 'GOST-89' : 'GOST-Kuznyechik';
      for (const mode of ['CBC', 'ECB', 'CFB', 'OFB', 'CTR']) {
        const score = mode === 'CBC' ? 15 : 10;
        const sBox = algo.includes('28147') ? 'E-TEST' : undefined;
        const args: any[] = [
          toggleStr(k.str, k.fmt), toggleStr(iv.str, iv.fmt),
          inputIsHex ? 'Hex' : 'Raw', 'Raw',
          algo,
        ];
        if (sBox) args.push(sBox);
        args.push(mode, 'NO', 'PKCS5');
        emit(`${short}-${mode}`, score, `Key 256-bit + IV`,
          [{ op: 'GOST Decrypt', args }], k, iv);
      }
    }
  };

  // ─── ChaCha: key 16/32, nonce 8/12 ────────────────────────
  // Args: [Key, Nonce, Counter, Rounds, Input, Output]
  const tryChaCha = (k: KeyInterp, n: KeyInterp) => {
    if (![16, 32].includes(k.bytes)) return;
    if (![8, 12].includes(n.bytes)) return;
    const bits = k.bytes * 8;
    for (const rounds of ['20', '12', '8']) {
      const label = `ChaCha${rounds}-${bits}`;
      emit(label, rounds === '20' ? 25 : 15, `Key ${bits}-bit + Nonce ${n.bytes * 8}-bit`,
        [{ op: 'ChaCha', args: [toggleStr(k.str, k.fmt), toggleStr(n.str, n.fmt), 0, rounds, inputFmt, 'Raw'] }], k, n);
    }
  };

  // ─── Salsa20: key 16/32, nonce 8 ──────────────────────────
  const trySalsa20 = (k: KeyInterp, n: KeyInterp) => {
    if (![16, 32].includes(k.bytes) || n.bytes !== 8) return;
    const bits = k.bytes * 8;
    for (const rounds of ['20', '12', '8']) {
      const label = `Salsa20/${rounds}-${bits}`;
      emit(label, rounds === '20' ? 20 : 10, `Key ${bits}-bit + Nonce 64-bit`,
        [{ op: 'Salsa20', args: [toggleStr(k.str, k.fmt), toggleStr(n.str, n.fmt), 0, rounds, inputFmt, 'Raw'] }], k, n);
    }
  };

  // ─── XSalsa20: key 32, nonce 24 ───────────────────────────
  const tryXSalsa20 = (k: KeyInterp, n: KeyInterp) => {
    if (k.bytes !== 32 || n.bytes !== 24) return;
    for (const rounds of ['20', '12', '8']) {
      const label = `XSalsa20/${rounds}`;
      emit(label, rounds === '20' ? 20 : 10, `Key 256-bit + Nonce 192-bit`,
        [{ op: 'XSalsa20', args: [toggleStr(k.str, k.fmt), toggleStr(n.str, n.fmt), 0, rounds, inputFmt, 'Raw'] }], k, n);
    }
  };

  // ─── Rabbit: key 16, IV 0/8 ───────────────────────────────
  // Args: [Key, IV, Endianness, Input, Output]
  const tryRabbit = (k: KeyInterp, iv: KeyInterp) => {
    if (k.bytes !== 16) return;
    if (iv.bytes !== 0 && iv.bytes !== 8) return;
    emit('Rabbit', 20, `Key 128-bit${iv.bytes ? ' + IV 64-bit' : ''}`,
      [{ op: 'Rabbit', args: [toggleStr(k.str, k.fmt), toggleStr(iv.str, iv.fmt), 'Big', inputFmt, 'Raw'] }], k, iv);
  };

  // ─── Apply all key+IV/nonce block & stream ciphers (need both keys) ─
  if (key1 && key2) {
  for (const i1 of interps1) {
    for (const i2 of interps2) {
      // Both orderings: (key1=key, key2=IV) and (key2=key, key1=IV)
      for (const [k, iv] of [[i1, i2], [i2, i1]] as const) {
        tryAes(k, iv);
        trySM4(k, iv);
        tryDES(k, iv);
        try3DES(k, iv);
        tryBlowfish(k, iv);
        tryRC2(k, iv);
        tryGOST(k, iv);
        tryChaCha(k, iv);
        trySalsa20(k, iv);
        tryXSalsa20(k, iv);
        tryRabbit(k, iv);
      }
    }
  }
  } // end if (key1 && key2)

  // ─── Single-key ciphers (ECB modes, key-only ops) ─────────
  // Combine both keys' interpretations for single-key checks
  const allInterps = [...interps1];
  if (key2 && key2 !== key1) allInterps.push(...interps2);

  for (const k of allInterps) {
    // AES ECB (no IV needed)
    if (aesKeySizes.includes(k.bytes)) {
      const bits = k.bytes * 8;
      emit(`AES-${bits}-ECB`, 15, `Key ${bits}-bit — AES ECB (no IV)`,
        [{ op: 'AES Decrypt', args: [toggleStr(k.str, k.fmt), { string: '', option: 'Hex' }, 'ECB', inputFmt, 'Raw'] }], k, null);
    }
    // SM4 ECB
    if (k.bytes === 16) {
      emit('SM4-ECB', 10, 'Key 128-bit — SM4 ECB (no IV)',
        [{ op: 'SM4 Decrypt', args: [toggleStr(k.str, k.fmt), { string: '', option: 'Hex' }, 'ECB', inputFmt, 'Raw'] }], k, null);
    }
    // DES ECB
    if (k.bytes === 8) {
      emit('DES-ECB', 15, 'Key 64-bit — DES ECB (no IV)',
        [{ op: 'DES Decrypt', args: [toggleStr(k.str, k.fmt), { string: '', option: 'Hex' }, 'ECB', inputFmt, 'Raw'] }], k, null);
    }
    // 3DES ECB
    if (k.bytes === 24) {
      emit('3DES-ECB', 15, 'Key 192-bit — 3DES ECB (no IV)',
        [{ op: 'Triple DES Decrypt', args: [toggleStr(k.str, k.fmt), { string: '', option: 'Hex' }, 'ECB', inputFmt, 'Raw'] }], k, null);
    }
    // XXTEA: key only (any length)
    emit('XXTEA', 10, `Key ${k.bytes * 8}-bit`,
      [{ op: 'XXTEA Decrypt', args: [toggleStr(k.str, k.fmt)] }], k, null);
    // CipherSaber2: key only (RC4 variant)
    if (k.bytes >= 1 && k.bytes <= 56) {
      emit('CipherSaber2', 10, `Key ${k.bytes * 8}-bit (RC4 variant)`,
        [{ op: 'CipherSaber2 Decrypt', args: [toggleStr(k.str, k.fmt), 20] }], k, null);
    }
    // RC4 Drop: key only
    if (k.bytes >= 1 && k.bytes <= 256) {
      emit('RC4 Drop', 10, `Key ${k.bytes * 8}-bit`,
        [{ op: 'RC4 Drop', args: [toggleStr(k.str, k.fmt), 'Latin1', 'Latin1', 192] }], k, null);
    }
    // Rabbit with no IV (key=16)
    if (k.bytes === 16) {
      emit('Rabbit (no IV)', 15, 'Key 128-bit — no IV',
        [{ op: 'Rabbit', args: [toggleStr(k.str, k.fmt), { string: '', option: 'Hex' }, 'Big', inputFmt, 'Raw'] }], k, null);
    }
    // Fernet: key is 32-byte base64-encoded (URL-safe base64, 44 chars)
    if (/^[A-Za-z0-9_\-]{43}=$/.test(k.str) || k.bytes === 32) {
      emit('Fernet', 15, 'Key detected (Fernet token)',
        [{ op: 'Fernet Decrypt', args: [k.str] }], k, null);
    }
    // LS47
    if (k.bytes >= 1 && k.bytes <= 64) {
      emit('LS47', 10, `Password ${k.bytes} chars`,
        [{ op: 'LS47 Decrypt', args: [k.str, 10] }], k, null);
    }
  }
}

/** Boost an existing result's score, or add a new one. */
function boostOrAdd(
  results: CipherMatch[],
  name: string,
  boost: number,
  detail: string,
  category: string,
  reversed?: string,
  recipe?: { op: string; args: any[] }[],
) {
  const existing = results.find((r) => r.name === name);
  if (existing) {
    existing.score = Math.min(existing.score + boost, 99);
    existing.description += ` | CLUE: ${detail}`;
    if (reversed && !existing.reversed) existing.reversed = reversed;
    if (recipe && !existing.recipe) existing.recipe = recipe;
  } else {
    results.push({
      name,
      score: Math.min(50 + boost, 95),
      description: `CLUE: ${detail}`,
      category,
      reversed,
      recipe,
    });
  }
}

/**
 * Try clue as known plaintext against Caesar cipher.
 * Checks if there's a consistent shift that maps ciphertext → crib.
 */
function tryCaesarCrib(
  ciphertext: string,
  crib: string,
): { shift: number; position: number } | null {
  const ct = ciphertext.toUpperCase();
  const cr = crib.toUpperCase();
  if (cr.length < 2 || ct.length < cr.length) return null;

  for (let pos = 0; pos <= ct.length - cr.length; pos++) {
    const shift = (ct.charCodeAt(pos) - cr.charCodeAt(0) + 26) % 26;
    let consistent = true;
    for (let i = 1; i < cr.length; i++) {
      if ((ct.charCodeAt(pos + i) - cr.charCodeAt(i) + 26) % 26 !== shift) {
        consistent = false;
        break;
      }
    }
    if (consistent && shift !== 0) return { shift, position: pos };
  }
  return null;
}

/**
 * Try clue as known plaintext against XOR cipher.
 * XORs crib with corresponding ciphertext and checks if the derived
 * key is printable and has a repeating pattern.
 */
function tryXorCrib(ciphertext: string, crib: string): string | null {
  if (crib.length < 2 || ciphertext.length < crib.length) return null;

  // Try at position 0 — derive key bytes
  const keyBytes: number[] = [];
  for (let i = 0; i < crib.length; i++) {
    keyBytes.push(ciphertext.charCodeAt(i) ^ crib.charCodeAt(i));
  }

  // Check if key bytes are all printable
  if (!keyBytes.every((b) => b >= 0x20 && b <= 0x7e)) return null;

  // Check for repeating pattern in derived key
  const keyStr = String.fromCharCode(...keyBytes);
  for (let klen = 1; klen <= Math.min(keyStr.length, 16); klen++) {
    const pattern = keyStr.slice(0, klen);
    let repeats = true;
    for (let i = klen; i < keyStr.length; i++) {
      if (keyStr[i] !== pattern[i % klen]) { repeats = false; break; }
    }
    if (repeats && klen < keyStr.length) {
      return pattern.length <= 20 ? pattern : pattern.slice(0, 20) + '...';
    }
  }

  return null;
}

/**
 * Check if decrypted text looks like readable English.
 * Uses IC for longer texts; for short texts (< 40 chars), falls back
 * to common-word and bigram analysis since IC is unreliable.
 */
function looksReadable(decrypted: string): boolean {
  // Too short to judge reliably
  if (decrypted.length < 8) return false;
  const ic = indexOfCoincidence(decrypted);
  if (ic > 0.055) return true;
  // Short text fallback: check common words and bigrams
  if (decrypted.length <= 50) {
    const lower = decrypted.toLowerCase();
    let wordHits = 0;
    for (const w of CI_COMMON_WORDS) {
      if (lower.includes(w)) wordHits++;
    }
    if (wordHits >= 2) return true;
    const biScore = ciBigramScore(lower);
    // Require higher threshold for shorter texts
    const biThreshold = decrypted.length < 15 ? 0.30 : 0.20;
    if (biScore >= biThreshold) return true;
    // Single strong word hit + decent bigrams
    if (wordHits >= 1 && biScore >= 0.12) return true;
  }
  return false;
}

/** Vigenere decrypt with key, return IC and decrypted text. */
function tryVigenereKey(ciphertext: string, key: string): { ic: number; text: string } {
  let decrypted = '';
  for (let i = 0; i < ciphertext.length; i++) {
    const c = (ciphertext.charCodeAt(i) - 65 - (key.charCodeAt(i % key.length) - 65) + 26) % 26;
    decrypted += String.fromCharCode(c + 65);
  }
  return { ic: indexOfCoincidence(decrypted), text: decrypted };
}

/** Beaufort decrypt with key (key - plaintext mod 26), return IC and text. */
function tryBeaufortKey(ciphertext: string, key: string): { ic: number; text: string } {
  let decrypted = '';
  for (let i = 0; i < ciphertext.length; i++) {
    const c = (key.charCodeAt(i % key.length) - 65 - (ciphertext.charCodeAt(i) - 65) + 26) % 26;
    decrypted += String.fromCharCode(c + 65);
  }
  return { ic: indexOfCoincidence(decrypted), text: decrypted };
}

/** Autokey decrypt with primer key, return IC and text. */
function tryAutokeyKey(ciphertext: string, primer: string): { ic: number; text: string } {
  const result: number[] = [];
  const keyStream = [...primer].map((c) => c.charCodeAt(0) - 65);

  for (let i = 0; i < ciphertext.length; i++) {
    const k = i < keyStream.length ? keyStream[i] : result[i - primer.length];
    const p = (ciphertext.charCodeAt(i) - 65 - k + 26) % 26;
    result.push(p);
  }

  const decrypted = result.map((c) => String.fromCharCode(c + 65)).join('');
  return { ic: indexOfCoincidence(decrypted), text: decrypted };
}

/** XOR input with repeating key, check if result is mostly printable. */
function tryXorKey(input: string, key: string): boolean {
  let printable = 0;
  const len = Math.min(input.length, 200); // check first 200 chars
  for (let i = 0; i < len; i++) {
    const c = input.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    if ((c >= 0x20 && c <= 0x7e) || c === 0x09 || c === 0x0a || c === 0x0d) printable++;
  }
  return printable / len >= 0.8;
}

/** RC4 decrypt input with key, return plaintext if mostly printable. */
function tryRC4Key(input: string, key: string): string | null {
  // Build key bytes from string
  const keyBytes: number[] = [];
  for (let i = 0; i < key.length; i++) keyBytes.push(key.charCodeAt(i) & 0xFF);
  if (keyBytes.length === 0) return null;

  // KSA
  const S = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + keyBytes[i % keyBytes.length]) & 0xFF;
    const tmp = S[i]; S[i] = S[j]; S[j] = tmp;
  }

  // PRGA + decrypt
  let ii = 0;
  j = 0;
  let printable = 0;
  const len = Math.min(input.length, 200);
  const out: number[] = [];
  for (let k = 0; k < len; k++) {
    ii = (ii + 1) & 0xFF;
    j = (j + S[ii]) & 0xFF;
    const tmp = S[ii]; S[ii] = S[j]; S[j] = tmp;
    const byte = input.charCodeAt(k) ^ S[(S[ii] + S[j]) & 0xFF];
    out.push(byte);
    if ((byte >= 0x20 && byte <= 0x7e) || byte === 0x09 || byte === 0x0a || byte === 0x0d) printable++;
  }

  if (printable / len >= 0.8) {
    return String.fromCharCode(...out);
  }
  return null;
}

/** Caesar decrypt by shift amount. */
function caesarDecrypt(text: string, shift: number): string {
  let out = '';
  for (const ch of text) {
    out += String.fromCharCode(((ch.charCodeAt(0) - 65 - shift + 26) % 26) + 65);
  }
  return out;
}
