import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Javascript Unobfuscator';

/**
 * Deobfuscate common JavaScript obfuscation patterns.
 * Handles hex/octal/unicode escapes, String.fromCharCode, unescape, atob, etc.
 * Uses Function() for full eval when pattern matching is insufficient.
 */
function unobfuscateJS(input: string): string {
  let result = input;

  // Pass 1: Resolve escape sequences in string literals
  result = resolveEscapes(result);

  // Pass 2: Resolve String.fromCharCode(...) calls
  result = result.replace(/String\.fromCharCode\s*\(([^)]+)\)/gi, (_match, args) => {
    try {
      const codes = args.split(',').map((s: string) => {
        const t = s.trim();
        return t.startsWith('0x') ? parseInt(t, 16) : parseInt(t, 10);
      });
      if (codes.every((c: number) => !isNaN(c) && c >= 0 && c <= 0x10FFFF)) {
        return JSON.stringify(String.fromCharCode(...codes));
      }
    } catch { /* skip */ }
    return _match;
  });

  // Pass 3: Resolve unescape('%XX') calls
  result = result.replace(/unescape\s*\(\s*(['"])([^'"]*)\1\s*\)/gi, (_match, _q, encoded) => {
    try {
      return JSON.stringify(decodeURIComponent(encoded.replace(/%u([0-9a-fA-F]{4})/g, (_: string, hex: string) =>
        String.fromCharCode(parseInt(hex, 16))
      ).replace(/%([0-9a-fA-F]{2})/g, (_: string, hex: string) =>
        String.fromCharCode(parseInt(hex, 16))
      )));
    } catch { /* skip */ }
    return _match;
  });

  // Pass 4: Resolve decodeURIComponent('%XX') calls
  result = result.replace(/decodeURIComponent\s*\(\s*(['"])([^'"]*)\1\s*\)/gi, (_match, _q, encoded) => {
    try {
      return JSON.stringify(decodeURIComponent(encoded));
    } catch { /* skip */ }
    return _match;
  });

  // Pass 5: Resolve atob('...') calls
  result = result.replace(/atob\s*\(\s*(['"])([^'"]*)\1\s*\)/gi, (_match, _q, b64) => {
    try {
      return JSON.stringify(atob(b64));
    } catch { /* skip */ }
    return _match;
  });

  // Pass 6: Resolve simple string concatenation: "abc" + "def"
  result = resolveConcat(result);

  // If the input looks like it's entirely an expression, try eval
  if (result === input) {
    const evalResult = tryEval(input);
    if (evalResult !== null) return evalResult;
  }

  return result;
}

/** Resolve hex (\xNN), unicode (\uNNNN), and octal (\NNN) escapes in the string */
function resolveEscapes(input: string): string {
  return input
    // \xNN hex escapes
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // \uNNNN unicode escapes
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // \u{NNNN} ES6 unicode escapes
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    // \NNN octal escapes (1-3 digits, value <= 377)
    .replace(/\\([0-3]?[0-7]{1,2})/g, (match, oct) => {
      const val = parseInt(oct, 8);
      return val <= 255 ? String.fromCharCode(val) : match;
    });
}

/** Resolve adjacent string literal concatenation: "a" + "b" → "ab" */
function resolveConcat(input: string): string {
  // Repeatedly merge "..." + "..." and '...' + '...'
  let prev = '';
  let result = input;
  while (result !== prev) {
    prev = result;
    result = result.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"\s*\+\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g, '"$1$2"');
    result = result.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'\s*\+\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, "'$1$2'");
  }
  return result;
}

/** Try to evaluate the input as a JavaScript expression and return the string result */
function tryEval(input: string): string | null {
  const trimmed = input.trim();
  try {
    /* eslint-disable no-new-func */
    const fn = new Function(`return String(${trimmed})`);
    /* eslint-enable no-new-func */
    const result = fn();
    if (typeof result === 'string' && result !== trimmed && result.length > 0) {
      return result;
    }
  } catch { /* not a valid expression */ }

  // Try as statements that produce a value
  try {
    /* eslint-disable no-new-func */
    const fn = new Function(`
      var __output = [];
      var __origLog = console.log;
      console.log = function() { __output.push([].slice.call(arguments).join(' ')); };
      try { ${trimmed} } catch(e) {}
      console.log = __origLog;
      return __output.join('\\n');
    `);
    /* eslint-enable no-new-func */
    const result = fn();
    if (result && result.length > 0) return result;
  } catch { /* skip */ }

  return null;
}

class JavascriptUnobfuscator extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Deobfuscates JavaScript: resolves hex/octal/unicode escapes, String.fromCharCode, unescape, decodeURIComponent, atob, string concatenation, and eval-based decoding.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Obfuscation_(software)';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    const trimmed = input.trim();
    if (trimmed.length === 0) return '';
    return unobfuscateJS(trimmed);
  }
}

registerCustomOp(JavascriptUnobfuscator, {
  name: NAME,
  module: 'Custom',
  description: 'Deobfuscates JavaScript (escape sequences, fromCharCode, unescape, atob, eval).',
  infoURL: 'https://en.wikipedia.org/wiki/Obfuscation_(software)',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Esoteric Languages');

export default JavascriptUnobfuscator;
