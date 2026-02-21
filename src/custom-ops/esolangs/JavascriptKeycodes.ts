import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Javascript Keycodes';

/**
 * Decode JavaScript keycode/charcode sequences to text.
 * Handles:
 *   - String.fromCharCode(72, 101, 108, 108, 111)
 *   - [72, 101, 108, 108, 111] (plain arrays)
 *   - 72 101 108 108 111 (space/comma separated decimals)
 *   - 0x48 0x65 0x6C 0x6C 0x6F (hex values)
 */
function decodeKeycodes(input: string): string {
  const trimmed = input.trim();

  // Strategy 1: Extract from String.fromCharCode(...)
  const fromCharCodeMatch = trimmed.match(/String\.fromCharCode\s*\(([^)]+)\)/gi);
  if (fromCharCodeMatch) {
    let result = '';
    for (const match of fromCharCodeMatch) {
      const argsStr = match.replace(/String\.fromCharCode\s*\(/i, '').replace(/\)$/, '');
      const codes = parseNumberList(argsStr);
      if (codes.length > 0) result += String.fromCharCode(...codes);
    }
    if (result.length > 0) return result;
  }

  // Strategy 2: Extract from array notation [72, 101, ...]
  const arrayMatch = trimmed.match(/\[([0-9xXa-fA-F,\s+]+)\]/g);
  if (arrayMatch) {
    let result = '';
    for (const match of arrayMatch) {
      const inner = match.slice(1, -1);
      const codes = parseNumberList(inner);
      if (codes.length > 0) result += String.fromCharCode(...codes);
    }
    if (result.length > 0) return result;
  }

  // Strategy 3: Plain number list (space, comma, newline separated)
  const codes = parseNumberList(trimmed);
  if (codes.length > 0) {
    return String.fromCharCode(...codes);
  }

  return '[Error: No valid keycode sequences found]';
}

/** Parse a string of numbers (decimal or hex) separated by commas/spaces/newlines */
function parseNumberList(str: string): number[] {
  const parts = str.split(/[,\s]+/).filter(Boolean);
  const codes: number[] = [];
  for (const part of parts) {
    const trimPart = part.trim();
    let num: number;
    if (/^0x[0-9a-fA-F]+$/i.test(trimPart)) {
      num = parseInt(trimPart, 16);
    } else if (/^\d+$/.test(trimPart)) {
      num = parseInt(trimPart, 10);
    } else {
      return []; // invalid, abort
    }
    if (isNaN(num) || num < 0 || num > 0x10FFFF) return [];
    codes.push(num);
  }
  return codes;
}

class JavascriptKeycodes extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes JavaScript keycodes/charcodes to text. Handles String.fromCharCode(), arrays, and plain number lists (decimal or hex).';
    this.infoURL = 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCharCode';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    const trimmed = input.trim();
    if (trimmed.length === 0) return '';
    return decodeKeycodes(trimmed);
  }
}

registerCustomOp(JavascriptKeycodes, {
  name: NAME,
  module: 'Custom',
  description: 'Decodes JavaScript keycodes/charcodes (String.fromCharCode, arrays, number lists) to text.',
  infoURL: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCharCode',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Esoteric Languages');

export default JavascriptKeycodes;
