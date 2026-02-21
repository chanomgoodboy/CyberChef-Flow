import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'JSFuck Decode';

/**
 * Decode JSFuck — JavaScript encoded using only []()!+ characters.
 * Uses Function() constructor to evaluate the expression safely in the browser.
 */
function decodeJSFuck(source: string): string {
  const trimmed = source.trim();

  // Quick validation: must only contain JSFuck chars
  if (!/^[\[\]()!+\s]+$/.test(trimmed)) {
    return '[Error: Input contains characters outside the JSFuck charset []()!+]';
  }

  // JSFuck expressions typically either:
  // 1. Evaluate to a string directly (character/string construction)
  // 2. End with (...) which calls a function (code execution)
  // We want to capture the string value, not execute arbitrary code.

  // Strategy: wrap in a Function that returns the expression result as a string
  try {
    // First try: evaluate the expression to get its string value
    // This handles both string constructions and Function calls that return values
    const fn = new Function(`return String(${trimmed})`);
    const result = fn();
    if (typeof result === 'string') return result;
    return String(result);
  } catch (e: any) {
    // If the expression is meant to be executed (e.g., contains Function(...)()),
    // try capturing its output by overriding console/document methods
    try {
      // Try evaluating it as-is and capturing the result
      const fn2 = new Function(`
        var __output = [];
        var __origLog = console.log;
        console.log = function() { __output.push([].slice.call(arguments).join(' ')); };
        try {
          var __result = (${trimmed});
          if (__result !== undefined) __output.push(String(__result));
        } finally {
          console.log = __origLog;
        }
        return __output.join('\\n');
      `);
      const result2 = fn2();
      if (result2 && result2.length > 0) return result2;
    } catch { /* fall through */ }

    return `[Error: Could not decode JSFuck: ${e.message}]`;
  }
}

class JSFuckDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes JSFuck — JavaScript encoded using only []()!+ characters. Uses eval for full decoding.';
    this.infoURL = 'https://en.wikipedia.org/wiki/JSFuck';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    const trimmed = input.trim();
    if (trimmed.length === 0) return '';
    return decodeJSFuck(trimmed);
  }
}

registerCustomOp(JSFuckDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Decodes JSFuck ([]()!+ only JavaScript) using eval.',
  infoURL: 'https://en.wikipedia.org/wiki/JSFuck',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Esoteric Languages');

export default JSFuckDecode;
