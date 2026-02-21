/**
 * End-of-line sequence definitions matching CyberChef's editorUtils.mjs.
 */

export interface EolOption {
  code: string;
  seq: string;
  label: string;
}

export const EOL_OPTIONS: EolOption[] = [
  { code: 'LF',   seq: '\u000a',         label: 'Line Feed, U+000A' },
  { code: 'VT',   seq: '\u000b',         label: 'Vertical Tab, U+000B' },
  { code: 'FF',   seq: '\u000c',         label: 'Form Feed, U+000C' },
  { code: 'CR',   seq: '\u000d',         label: 'Carriage Return, U+000D' },
  { code: 'CRLF', seq: '\u000d\u000a',   label: 'CR+LF, U+000D U+000A' },
  { code: 'LS',   seq: '\u2028',         label: 'Line Separator, U+2028' },
  { code: 'PS',   seq: '\u2029',         label: 'Paragraph Separator, U+2029' },
];

const codeToSeq = new Map(EOL_OPTIONS.map((o) => [o.code, o.seq]));

export function eolCodeToSeq(code: string): string {
  return codeToSeq.get(code) ?? '\n';
}
