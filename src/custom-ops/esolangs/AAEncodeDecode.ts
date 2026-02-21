import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'AAEncode Decode';

/**
 * Decode aaencode — JavaScript encoded using Japanese emoticons.
 *
 * aaencode works by:
 * 1. Setting up emoticon variables with numeric values
 * 2. Building a JavaScript string character by character via arithmetic
 * 3. Calling Function(Function(escapedStr)(1))('_') to:
 *    a) Resolve escape sequences via inner Function()
 *    b) Execute the decoded JS via outer Function()
 *
 * We intercept Function.prototype.constructor to capture the decoded string.
 * A with(Proxy) scope handles implicit emoticon variable references.
 */
function decodeAAEncode(source: string): string {
  const trimmed = source.trim();

  // Validate: must contain characteristic aaencode emoticon patterns
  if (!trimmed.includes('\uff9f') && !trimmed.includes('\u0414')) {
    return '[Error: Input does not appear to be aaencode (missing characteristic emoticon patterns)]';
  }

  try {
    /* eslint-disable no-new-func */
    const fn = new Function(`
      var __calls = [];
      var __origCtor = Function.prototype.constructor;

      Function.prototype.constructor = function() {
        var code = arguments.length > 0 ? String(arguments[arguments.length - 1]) : '';
        var callNum = __calls.length;
        __calls.push(code);
        if (callNum < 1) {
          // First call: let through to resolve escape sequences
          return __origCtor.apply(this, arguments);
        }
        // Second+ call: capture decoded JS, don't execute
        return function() { return code; };
      };

      try {
        // Use with(Proxy) to auto-define undeclared emoticon variables
        var __scope = new Proxy({}, {
          has: function() { return true; },
          get: function(t, k) { return k in t ? t[k] : undefined; },
          set: function(t, k, v) { t[k] = v; return true; }
        });
        var __fn = new Function('__scope', 'with(__scope){' + ${JSON.stringify(trimmed)} + '}');
        __fn(__scope);
      } catch(e) {}

      Function.prototype.constructor = __origCtor;

      // Return the last captured call (decoded JavaScript)
      if (__calls.length >= 2) return __calls[__calls.length - 1];
      if (__calls.length === 1) return __calls[0];
      return '';
    `);
    /* eslint-enable no-new-func */

    const result = fn();
    if (typeof result === 'string' && result.length > 0) return result;
  } catch { /* try fallback */ }

  // Fallback: execute as statements, capture console/alert output
  try {
    /* eslint-disable no-new-func */
    const fn2 = new Function(`
      var __output = [];
      var __origLog = console.log;
      console.log = function() { __output.push([].slice.call(arguments).join(' ')); };
      try {
        var __scope = new Proxy({}, {
          has: function() { return true; },
          get: function(t, k) { return k in t ? t[k] : undefined; },
          set: function(t, k, v) { t[k] = v; return true; }
        });
        var __fn = new Function('__scope', 'with(__scope){' + ${JSON.stringify(trimmed)} + '}');
        __fn(__scope);
      } catch(e) {}
      console.log = __origLog;
      return __output.join('\\n');
    `);
    /* eslint-enable no-new-func */

    const result2 = fn2();
    if (result2 && result2.length > 0) return result2;
  } catch (e: any) {
    return `[Error: Could not decode aaencode: ${e.message}]`;
  }

  return '[Error: aaencode detected but decoding produced no output]';
}

class AAEncodeDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes aaencode — JavaScript obfuscated using Japanese emoticons (゚ω゚ﾉ, ﾟДﾟ, etc.). Uses eval for full decoding.';
    this.infoURL = 'https://utf-8.jp/public/aaencode.html';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    const trimmed = input.trim();
    if (trimmed.length === 0) return '';
    return decodeAAEncode(trimmed);
  }
}

registerCustomOp(AAEncodeDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Decodes aaencode (Japanese emoticon JavaScript obfuscation) using eval.',
  infoURL: 'https://utf-8.jp/public/aaencode.html',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Esoteric Languages');

export default AAEncodeDecode;
