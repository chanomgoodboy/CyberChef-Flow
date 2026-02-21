/**
 * UUencode/UUdecode.
 * Reference: https://en.wikipedia.org/wiki/Uuencoding
 *
 * Traditional Unix-to-Unix encoding. Each group of 3 bytes is encoded
 * as 4 printable characters (adding 32 to each 6-bit value, space
 * represented as backtick in modern variants).
 */

function encChar(n: number): string {
  // Add 32 to get printable ASCII, use backtick for 0 (space)
  return n === 0 ? '`' : String.fromCharCode(n + 32);
}

function decChar(ch: string): number {
  if (ch === '`') return 0;
  const code = ch.charCodeAt(0) - 32;
  return code & 0x3F;
}

/**
 * Decode a single UUencoded data line (with length prefix).
 */
function decodeLine(line: string): number[] {
  const bytes: number[] = [];
  const lineLen = decChar(line[0]);
  if (lineLen === 0) return bytes;

  let decoded = 0;
  for (let i = 1; i < line.length; i += 4) {
    if (decoded >= lineLen) break;
    const c0 = decChar(line[i] ?? '`');
    const c1 = decChar(line[i + 1] ?? '`');
    const c2 = decChar(line[i + 2] ?? '`');
    const c3 = decChar(line[i + 3] ?? '`');

    if (decoded < lineLen) bytes.push(((c0 << 2) | (c1 >> 4)) & 0xFF);
    decoded++;
    if (decoded < lineLen) bytes.push(((c1 << 4) | (c2 >> 2)) & 0xFF);
    decoded++;
    if (decoded < lineLen) bytes.push(((c2 << 6) | c3) & 0xFF);
    decoded++;
  }
  return bytes;
}

/**
 * Encode bytes to UUencoded string with header/footer.
 */
export function uuencode(data: Uint8Array, filename: string = 'data'): string {
  const lines: string[] = [];
  lines.push(`begin 644 ${filename}`);

  let offset = 0;
  while (offset < data.length) {
    const remaining = data.length - offset;
    const lineLen = Math.min(45, remaining); // max 45 bytes per line
    let line = encChar(lineLen);

    for (let i = 0; i < lineLen; i += 3) {
      const b0 = data[offset + i] ?? 0;
      const b1 = (i + 1 < lineLen) ? (data[offset + i + 1] ?? 0) : 0;
      const b2 = (i + 2 < lineLen) ? (data[offset + i + 2] ?? 0) : 0;

      line += encChar((b0 >> 2) & 0x3F);
      line += encChar(((b0 << 4) | (b1 >> 4)) & 0x3F);
      line += encChar(((b1 << 2) | (b2 >> 6)) & 0x3F);
      line += encChar(b2 & 0x3F);
    }

    lines.push(line);
    offset += lineLen;
  }

  lines.push('`');  // empty line (0 bytes)
  lines.push('end');
  return lines.join('\n');
}

/**
 * Decode UUencoded string back to bytes.
 * Supports both wrapped (begin/end) and raw UUencoded data.
 */
export function uudecode(input: string): Uint8Array {
  const lines = input.split(/\r?\n/);
  const bytes: number[] = [];

  // Check if input has begin/end wrapper
  const hasHeader = lines.some(l => l.startsWith('begin '));

  if (hasHeader) {
    // Wrapped format: skip to after "begin" line, stop at "end"
    let started = false;
    for (const line of lines) {
      if (line.startsWith('begin ')) {
        started = true;
        continue;
      }
      if (!started) continue;
      if (line === 'end' || line === '`' || line.trim() === '') {
        if (line === 'end') break;
        continue;
      }
      bytes.push(...decodeLine(line));
    }
  } else {
    // Raw format: each line is a UUencoded data line with length prefix
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed === '`') continue;
      bytes.push(...decodeLine(trimmed));
    }
  }

  return new Uint8Array(bytes);
}
