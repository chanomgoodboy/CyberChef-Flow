/**
 * Character encoding definitions and helpers.
 *
 * Uses the browser-native TextDecoder/TextEncoder for encoding support.
 * "Raw Bytes" (default) maps each byte 0-255 to one character (Latin-1).
 */

export interface EncodingOption {
  label: string;
  value: string;  // TextDecoder label, or 'raw' for Raw Bytes
  group: string;
}

export const ENCODINGS: EncodingOption[] = [
  // Special
  { label: 'Raw Bytes',           value: 'raw',           group: 'Default' },

  // Unicode
  { label: 'UTF-8',               value: 'utf-8',         group: 'Unicode' },
  { label: 'UTF-16LE',            value: 'utf-16le',      group: 'Unicode' },
  { label: 'UTF-16BE',            value: 'utf-16be',      group: 'Unicode' },

  // Western
  { label: 'ISO-8859-1 (Latin-1)',  value: 'iso-8859-1',   group: 'Western' },
  { label: 'ISO-8859-15 (Latin-9)', value: 'iso-8859-15',  group: 'Western' },
  { label: 'Windows-1252',          value: 'windows-1252', group: 'Western' },
  { label: 'Macintosh',             value: 'macintosh',    group: 'Western' },

  // Central European
  { label: 'ISO-8859-2 (Latin-2)',   value: 'iso-8859-2',   group: 'Central European' },
  { label: 'Windows-1250',           value: 'windows-1250', group: 'Central European' },

  // Cyrillic
  { label: 'ISO-8859-5',    value: 'iso-8859-5',    group: 'Cyrillic' },
  { label: 'Windows-1251',  value: 'windows-1251',  group: 'Cyrillic' },
  { label: 'KOI8-R',        value: 'koi8-r',        group: 'Cyrillic' },
  { label: 'KOI8-U',        value: 'koi8-u',        group: 'Cyrillic' },
  { label: 'IBM866',        value: 'ibm866',        group: 'Cyrillic' },

  // Greek
  { label: 'ISO-8859-7',    value: 'iso-8859-7',    group: 'Greek' },
  { label: 'Windows-1253',  value: 'windows-1253',  group: 'Greek' },

  // Turkish
  { label: 'ISO-8859-9',    value: 'iso-8859-9',    group: 'Turkish' },
  { label: 'Windows-1254',  value: 'windows-1254',  group: 'Turkish' },

  // Hebrew
  { label: 'ISO-8859-8',    value: 'iso-8859-8',    group: 'Hebrew' },
  { label: 'Windows-1255',  value: 'windows-1255',  group: 'Hebrew' },

  // Arabic
  { label: 'ISO-8859-6',    value: 'iso-8859-6',    group: 'Arabic' },
  { label: 'Windows-1256',  value: 'windows-1256',  group: 'Arabic' },

  // Baltic
  { label: 'ISO-8859-13',   value: 'iso-8859-13',   group: 'Baltic' },
  { label: 'Windows-1257',  value: 'windows-1257',  group: 'Baltic' },

  // Other European
  { label: 'ISO-8859-3 (Latin-3)',   value: 'iso-8859-3',   group: 'Other' },
  { label: 'ISO-8859-4 (Latin-4)',   value: 'iso-8859-4',   group: 'Other' },
  { label: 'ISO-8859-10 (Latin-6)',  value: 'iso-8859-10',  group: 'Other' },
  { label: 'ISO-8859-14 (Celtic)',   value: 'iso-8859-14',  group: 'Other' },
  { label: 'ISO-8859-16',           value: 'iso-8859-16',  group: 'Other' },

  // Thai / Vietnamese
  { label: 'Windows-874 (Thai)',       value: 'windows-874',  group: 'Southeast Asian' },
  { label: 'Windows-1258 (Vietnamese)', value: 'windows-1258', group: 'Southeast Asian' },

  // Japanese
  { label: 'Shift_JIS',     value: 'shift_jis',     group: 'Japanese' },
  { label: 'EUC-JP',        value: 'euc-jp',        group: 'Japanese' },
  { label: 'ISO-2022-JP',   value: 'iso-2022-jp',   group: 'Japanese' },

  // Chinese
  { label: 'GBK',           value: 'gbk',           group: 'Chinese' },
  { label: 'GB18030',       value: 'gb18030',       group: 'Chinese' },
  { label: 'Big5',          value: 'big5',          group: 'Chinese' },

  // Korean
  { label: 'EUC-KR',        value: 'euc-kr',        group: 'Korean' },
];

/** Group encodings for <optgroup> rendering. */
export function getEncodingGroups(): { group: string; options: EncodingOption[] }[] {
  const map = new Map<string, EncodingOption[]>();
  for (const enc of ENCODINGS) {
    if (!map.has(enc.group)) map.set(enc.group, []);
    map.get(enc.group)!.push(enc);
  }
  return Array.from(map, ([group, options]) => ({ group, options }));
}

/**
 * Decode raw bytes to a string using the specified encoding.
 * For 'raw', uses Latin-1 (1 byte = 1 char).
 */
export function decodeBytes(buf: ArrayBuffer, encoding: string): string {
  const bytes = new Uint8Array(buf);
  if (encoding === 'raw') {
    const chunks: string[] = [];
    const CHUNK = 8192;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      chunks.push(String.fromCharCode(...bytes.subarray(i, i + CHUNK)));
    }
    return chunks.join('');
  }
  try {
    return new TextDecoder(encoding).decode(bytes);
  } catch {
    // Fallback to raw
    return decodeBytes(buf, 'raw');
  }
}

/**
 * Encode a string to bytes using the specified encoding.
 * For 'raw', uses Latin-1. For 'utf-8', uses TextEncoder.
 * Other encodings fall back to UTF-8 (TextEncoder only supports UTF-8).
 */
export function encodeString(str: string, encoding: string): ArrayBuffer {
  if (encoding === 'raw') {
    const buf = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i) & 0xFF;
    return buf.buffer;
  }
  // TextEncoder only supports UTF-8
  return new TextEncoder().encode(str).buffer;
}

/**
 * Re-decode a Latin-1 display string using a different encoding.
 * Converts the string back to raw bytes, then decodes with the target encoding.
 */
export function reDecodeString(latin1Str: string, encoding: string): string {
  if (encoding === 'raw' || !latin1Str) return latin1Str;
  const bytes = new Uint8Array(latin1Str.length);
  for (let i = 0; i < latin1Str.length; i++) {
    bytes[i] = latin1Str.charCodeAt(i) & 0xFF;
  }
  try {
    return new TextDecoder(encoding).decode(bytes);
  } catch {
    return latin1Str;
  }
}
