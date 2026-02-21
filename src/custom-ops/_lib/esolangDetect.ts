/**
 * Esoteric language detection patterns and trial execution for cipher identifier.
 * Each detector can identify an esolang by pattern and optionally trial-execute it.
 */

import { executeBrainfuck, executeCOW } from './brainfuck';
import { executeWhitespace } from './whitespace';

export interface EsolangDetector {
  name: string;
  detect: (input: string) => { score: number; description: string } | null;
  tryExecute?: (input: string) => string | undefined;
}

const TRIAL_BF_OPTS = { maxSteps: 10_000, maxOutput: 1_000 };
const TRIAL_WS_OPTS = { maxSteps: 10_000, maxOutput: 1_000 };

/** Check if output looks meaningful (has printable ASCII) */
function isMeaningful(output: string): boolean {
  if (output.length < 1) return false;
  let printable = 0;
  for (const ch of output) {
    const c = ch.charCodeAt(0);
    if ((c >= 0x20 && c <= 0x7e) || c === 0x09 || c === 0x0a || c === 0x0d) printable++;
  }
  return printable / output.length >= 0.5;
}

// ---- Brainfuck ----
const bfDetector: EsolangDetector = {
  name: 'Brainfuck',
  detect(input) {
    const clean = input.replace(/\s+/g, '');
    // Must only contain BF chars
    if (!/^[+\-><.,\[\]]+$/.test(clean)) return null;
    if (clean.length < 5) return null;
    // Must have balanced brackets
    let depth = 0;
    for (const ch of clean) {
      if (ch === '[') depth++;
      if (ch === ']') depth--;
      if (depth < 0) return null;
    }
    if (depth !== 0) return null;
    // Must have output command
    const hasOutput = clean.includes('.');
    const score = hasOutput ? 85 : 60;
    return { score, description: `Only +-><.,[] chars (${clean.length} commands), balanced brackets` };
  },
  tryExecute(input) {
    const result = executeBrainfuck(input, '', TRIAL_BF_OPTS);
    if (result.output && isMeaningful(result.output)) return result.output;
    return undefined;
  },
};

// ---- Ook! ----
const ookDetector: EsolangDetector = {
  name: 'Ook!',
  detect(input) {
    const tokens = input.match(/Ook[.!?]/gi);
    if (!tokens || tokens.length < 4) return null;
    // Check that most of the non-whitespace content is Ook tokens
    const nonWS = input.replace(/\s+/g, '');
    const ookContent = tokens.join('');
    if (ookContent.length / nonWS.length < 0.8) return null;
    return { score: 90, description: `${tokens.length} Ook! tokens found` };
  },
  tryExecute(input) {
    const tokens = input.match(/Ook[.!?]/g);
    if (!tokens || tokens.length % 2 !== 0) return undefined;
    const map: Record<string, string> = {
      'Ook. Ook?': '>', 'Ook? Ook.': '<', 'Ook. Ook.': '+', 'Ook! Ook!': '-',
      'Ook! Ook.': '.', 'Ook. Ook!': ',', 'Ook! Ook?': '[', 'Ook? Ook!': ']',
    };
    let bf = '';
    for (let i = 0; i < tokens.length; i += 2) {
      bf += map[tokens[i] + ' ' + tokens[i + 1]] ?? '';
    }
    const result = executeBrainfuck(bf, '', TRIAL_BF_OPTS);
    if (result.output && isMeaningful(result.output)) return result.output;
    return undefined;
  },
};

// ---- Binaryfuck ----
const binaryfuckDetector: EsolangDetector = {
  name: 'Binaryfuck',
  detect(input) {
    const bits = input.replace(/\s+/g, '');
    if (!/^[01]+$/.test(bits)) return null;
    if (bits.length < 9 || bits.length % 3 !== 0) return null;
    // Must not be better explained as plain binary encoding
    // BF binary has wider char variety when decoded
    // If input has space-separated 5-bit groups, likely Baudot not Binaryfuck
    const groups5 = input.trim().split(/\s+/);
    if (groups5.length >= 3 && groups5.every(g => g.length === 5 && /^[01]+$/.test(g))) {
      return { score: 25, description: `Binary digits (${bits.length} bits), but 5-bit groups suggest Baudot` };
    }
    return { score: 50, description: `Binary digits (${bits.length} bits), length divisible by 3` };
  },
  tryExecute(input) {
    const bits = input.replace(/\s+/g, '');
    const map: Record<string, string> = {
      '000': '>', '001': '<', '010': '+', '011': '-',
      '100': '.', '101': ',', '110': '[', '111': ']',
    };
    let bf = '';
    for (let i = 0; i < bits.length; i += 3) {
      bf += map[bits.slice(i, i + 3)] ?? '';
    }
    const result = executeBrainfuck(bf, '', TRIAL_BF_OPTS);
    if (result.output && isMeaningful(result.output)) return result.output;
    return undefined;
  },
};

// ---- Blub! ----
const blubDetector: EsolangDetector = {
  name: 'Blub!',
  detect(input) {
    const tokens = input.match(/Blub[.!?]/gi);
    if (!tokens || tokens.length < 4) return null;
    const nonWS = input.replace(/\s+/g, '');
    const blubContent = tokens.join('');
    if (blubContent.length / nonWS.length < 0.8) return null;
    return { score: 90, description: `${tokens.length} Blub! tokens found` };
  },
  tryExecute(input) {
    const tokens = input.match(/Blub[.!?]/gi);
    if (!tokens || tokens.length % 2 !== 0) return undefined;
    let bf = '';
    for (let i = 0; i < tokens.length; i += 2) {
      const a = tokens[i].charAt(4);
      const b = tokens[i + 1].charAt(4);
      const pair = a + b;
      const map: Record<string, string> = {
        '.?': '>', '?.': '<', '..': '+', '!!': '-',
        '!.': '.', '.!': ',', '!?': '[', '?!': ']',
      };
      bf += map[pair] ?? '';
    }
    const result = executeBrainfuck(bf, '', TRIAL_BF_OPTS);
    if (result.output && isMeaningful(result.output)) return result.output;
    return undefined;
  },
};

// ---- Pikalang ----
const pikalangDetector: EsolangDetector = {
  name: 'Pikalang',
  detect(input) {
    const lower = input.toLowerCase();
    const pikaWords = lower.match(/pikachu|pikapi|pichu|pipi|pika|chu|pi|ka/g);
    if (!pikaWords || pikaWords.length < 3) return null;
    // Must contain at least one characteristic word
    if (!lower.includes('pikachu') && !lower.includes('pikapi') && !lower.includes('pipi')) return null;
    return { score: 85, description: `${pikaWords.length} Pikalang keywords found` };
  },
  tryExecute(input) {
    const keywords: [string, string][] = [
      ['pikachu', '.'], ['pikapi', ','], ['pichu', '-'], ['pipi', '+'],
      ['pika', '['], ['chu', ']'], ['pi', '>'], ['ka', '<'],
    ];
    let bf = '';
    let i = 0;
    const lower = input.toLowerCase();
    while (i < lower.length) {
      let matched = false;
      for (const [kw, cmd] of keywords) {
        if (lower.startsWith(kw, i)) {
          bf += cmd;
          i += kw.length;
          matched = true;
          break;
        }
      }
      if (!matched) i++;
    }
    const result = executeBrainfuck(bf, '', TRIAL_BF_OPTS);
    if (result.output && isMeaningful(result.output)) return result.output;
    return undefined;
  },
};

// ---- Spoon ----
const spoonDetector: EsolangDetector = {
  name: 'Spoon',
  detect(input) {
    const bits = input.replace(/\s+/g, '');
    if (!/^[01]+$/.test(bits)) return null;
    if (bits.length < 5) return null;
    // Try to decode — if it produces valid BF commands, it's probably Spoon
    const codes: [string, string][] = [
      ['00100', '['], ['00101', ']'], ['00110', '.'], ['00111', ','],
      ['010', '>'], ['011', '<'], ['000', '-'], ['1', '+'],
    ];
    let bf = '';
    let pos = 0;
    while (pos < bits.length) {
      let matched = false;
      for (const [code, cmd] of codes) {
        if (bits.startsWith(code, pos)) {
          bf += cmd;
          pos += code.length;
          matched = true;
          break;
        }
      }
      if (!matched) return null;
    }
    if (bf.length < 3) return null;
    return { score: 55, description: `Valid Spoon binary encoding (${bf.length} BF commands)` };
  },
  tryExecute(input) {
    const bits = input.replace(/\s+/g, '');
    const codes: [string, string][] = [
      ['00100', '['], ['00101', ']'], ['00110', '.'], ['00111', ','],
      ['010', '>'], ['011', '<'], ['000', '-'], ['1', '+'],
    ];
    let bf = '';
    let pos = 0;
    while (pos < bits.length) {
      let matched = false;
      for (const [code, cmd] of codes) {
        if (bits.startsWith(code, pos)) {
          bf += cmd;
          pos += code.length;
          matched = true;
          break;
        }
      }
      if (!matched) return undefined;
    }
    const result = executeBrainfuck(bf, '', TRIAL_BF_OPTS);
    if (result.output && isMeaningful(result.output)) return result.output;
    return undefined;
  },
};

// ---- COW ----
const cowDetector: EsolangDetector = {
  name: 'COW',
  detect(input) {
    const MOO_CMDS = ['moo', 'mOo', 'moO', 'mOO', 'Moo', 'MOo', 'MoO', 'MOO', 'OOO', 'MMM', 'OOM', 'oom'];
    const tokens = input.split(/\s+/).filter((t) => MOO_CMDS.includes(t));
    if (tokens.length < 3) return null;
    const totalWords = input.split(/\s+/).filter(Boolean).length;
    if (tokens.length / totalWords < 0.7) return null;
    return { score: 85, description: `${tokens.length} COW (moo) commands found` };
  },
  tryExecute(input) {
    const result = executeCOW(input, '', TRIAL_BF_OPTS);
    if (result.output && isMeaningful(result.output)) return result.output;
    return undefined;
  },
};

// ---- Deadfish ----
const deadfishDetector: EsolangDetector = {
  name: 'Deadfish',
  detect(input) {
    const clean = input.replace(/\s+/g, '');
    if (!/^[idso]+$/.test(clean)) return null;
    if (clean.length < 4) return null;
    if (!clean.includes('o')) return null;
    // Must have a reasonable pattern (many i's building up values)
    const iCount = (clean.match(/i/g) || []).length;
    if (iCount < clean.length * 0.3) return null;
    return { score: 75, description: `Only idso chars (${clean.length} commands), has output` };
  },
  tryExecute(input) {
    const clean = input.replace(/\s+/g, '');
    let acc = 0;
    let out = '';
    for (const ch of clean) {
      switch (ch) {
        case 'i': acc++; break;
        case 'd': acc--; break;
        case 's': acc = acc * acc; break;
        case 'o': out += String.fromCharCode(acc & 0xffff); break;
      }
      if (acc === -1 || acc === 256) acc = 0;
    }
    if (out && isMeaningful(out)) return out;
    return undefined;
  },
};

// ---- Whitespace ----
const whitespaceDetector: EsolangDetector = {
  name: 'Whitespace',
  detect(input) {
    // Only spaces, tabs, newlines
    const wsOnly = input.replace(/[^ \t\n]/g, '');
    if (wsOnly.length < 20) return null;
    // Input must be mostly or entirely whitespace
    if (wsOnly.length / input.length < 0.9) return null;
    // Must contain all three: space, tab, newline
    if (!input.includes(' ') || !input.includes('\t') || !input.includes('\n')) return null;
    return { score: 80, description: `${wsOnly.length} whitespace chars (space/tab/LF)` };
  },
  tryExecute(input) {
    const result = executeWhitespace(input, '', TRIAL_WS_OPTS);
    if (result.output && isMeaningful(result.output)) return result.output;
    return undefined;
  },
};

// ---- Alphuck ----
const alphuckDetector: EsolangDetector = {
  name: 'Alphuck',
  detect(input) {
    const clean = input.replace(/[^aceijops]/g, '');
    if (clean.length < 5) return null;
    // Must be mostly alphuck commands
    const nonWS = input.replace(/\s+/g, '');
    if (clean.length / nonWS.length < 0.7) return null;
    // Must have balanced brackets (p/s)
    let depth = 0;
    for (const ch of clean) {
      if (ch === 'p') depth++;
      if (ch === 's') depth--;
      if (depth < 0) return null;
    }
    if (depth !== 0) return null;
    const hasOutput = clean.includes('j');
    return { score: hasOutput ? 65 : 45, description: `Alphuck commands (${clean.length} valid chars of ${nonWS.length})` };
  },
  tryExecute(input) {
    const map: Record<string, string> = { a: '>', c: '<', e: '+', i: '-', j: '.', o: ',', p: '[', s: ']' };
    let bf = '';
    for (const ch of input) { if (map[ch]) bf += map[ch]; }
    const result = executeBrainfuck(bf, '', TRIAL_BF_OPTS);
    if (result.output && isMeaningful(result.output)) return result.output;
    return undefined;
  },
};

// ---- Chicken ----
const chickenDetector: EsolangDetector = {
  name: 'Chicken',
  detect(input) {
    const lines = input.split('\n');
    const chickenLines = lines.filter((l) => {
      const words = l.trim().split(/\s+/).filter(Boolean);
      return words.length === 0 || words.every((w) => w.toLowerCase() === 'chicken');
    });
    if (chickenLines.length / lines.length < 0.8) return null;
    if (lines.length < 3) return null;
    // At least some lines must have chicken words
    const withChicken = lines.filter((l) => l.toLowerCase().includes('chicken')).length;
    if (withChicken < 2) return null;
    return { score: 85, description: `${withChicken}/${lines.length} lines contain only "chicken"` };
  },
};

// ---- JSFuck ----
const jsfuckDetector: EsolangDetector = {
  name: 'JSFuck',
  detect(input) {
    const clean = input.replace(/\s+/g, '');
    if (!/^[\[\]()!+]+$/.test(clean)) return null;
    if (clean.length < 20) return null;
    return { score: 90, description: `Only []()!+ chars (${clean.length} chars) — JSFuck encoding` };
  },
};

// ---- AAEncode ----
const aaencodeDetector: EsolangDetector = {
  name: 'aaencode',
  detect(input) {
    // Check for characteristic Japanese emoticon patterns
    const hasEmoticons = input.includes('\uff9f') || input.includes('\u0414') || input.includes('\u03c9');
    if (!hasEmoticons) return null;
    if (input.length < 50) return null;
    // Check for the characteristic variable pattern
    if (input.includes('\uff9f\u03c9\uff9f') || input.includes('\uff9f\u0414\uff9f')) {
      return { score: 90, description: 'Contains characteristic aaencode emoticon patterns (゚ω゚, ﾟДﾟ)' };
    }
    return { score: 60, description: 'Contains Japanese emoticon patterns (possible aaencode)' };
  },
};

// ---- Tier 4: Detection Only ----

const lolcodeDetector: EsolangDetector = {
  name: 'LOLCODE',
  detect(input) {
    const trimmed = input.trim();
    if (trimmed.startsWith('HAI') && trimmed.includes('KTHXBYE')) {
      return { score: 90, description: 'Starts with HAI and contains KTHXBYE' };
    }
    if (trimmed.includes('HAI') && trimmed.includes('VISIBLE')) {
      return { score: 70, description: 'Contains HAI and VISIBLE keywords' };
    }
    return null;
  },
};

const malbolgeDetector: EsolangDetector = {
  name: 'Malbolge',
  detect(input) {
    const clean = input.replace(/\s+/g, '');
    if (clean.length < 10) return null;
    // All printable ASCII (33-126), no spaces
    for (const ch of clean) {
      const c = ch.charCodeAt(0);
      if (c < 33 || c > 126) return null;
    }
    // High entropy
    const freq = new Map<string, number>();
    for (const ch of clean) freq.set(ch, (freq.get(ch) || 0) + 1);
    let entropy = 0;
    for (const count of freq.values()) {
      const p = count / clean.length;
      entropy -= p * Math.log2(p);
    }
    if (entropy < 6.0) return null;
    return { score: 40, description: `High entropy (${entropy.toFixed(2)}), all printable ASCII — possibly Malbolge` };
  },
};

const shakespeareDetector: EsolangDetector = {
  name: 'Shakespeare Programming Language',
  detect(input) {
    if (/\bAct\s+[IVX]+/i.test(input) && /\bScene\s+[IVX]+/i.test(input)) {
      const hasChars = /^[A-Z][a-z]+,\s+a\s+/m.test(input);
      const score = hasChars ? 85 : 75;
      return { score, description: 'Contains Act/Scene numbering in Roman numerals' };
    }
    return null;
  },
};

const chefDetector: EsolangDetector = {
  name: 'Chef',
  detect(input) {
    if (input.includes('Ingredients.') && input.includes('Method.')) {
      const hasServes = input.includes('Serves');
      return { score: hasServes ? 85 : 80, description: 'Contains Ingredients. and Method. sections' };
    }
    return null;
  },
};

const rockstarDetector: EsolangDetector = {
  name: 'Rockstar',
  detect(input) {
    const keywords = ['Listen to', 'Shout', 'Whisper', 'Say', 'Scream'];
    const found = keywords.filter((kw) => input.includes(kw));
    if (found.length < 2) return null;
    return { score: 65, description: `Contains Rockstar keywords: ${found.join(', ')}` };
  },
};

const hodorDetector: EsolangDetector = {
  name: 'Hodor',
  detect(input) {
    // Look for case-sensitive Hodor tokens with punctuation: hodor!, Hodor?, HODOR!, etc.
    const tokens = input.match(/[Hh][Oo][Dd][Oo][Rr][!?.]/g);
    if (tokens && tokens.length >= 4) {
      return { score: 90, description: `${tokens.length} Hodor command tokens found` };
    }
    // Fallback: loose hodor word detection
    const words = input.split(/\s+/).filter(Boolean);
    if (words.length < 5) return null;
    const hodorCount = words.filter((w) => /^hodor[.!?,;:]*$/i.test(w)).length;
    if (hodorCount / words.length < 0.8) return null;
    return { score: 80, description: `${Math.round(hodorCount / words.length * 100)}% Hodor words` };
  },
  tryExecute(input) {
    const tokens = input.match(/[Hh][Oo][Dd][Oo][Rr][!?.]/g);
    if (!tokens) return undefined;
    const map: Record<string, string> = {
      'hodor!': '>', 'Hodor!': '<', 'hodor?': '+', 'Hodor?': '-',
      'hodor.': '.', 'Hodor.': ',', 'HODOR!': '[', 'HODOR?': ']',
    };
    let bf = '';
    for (const t of tokens) { if (map[t]) bf += map[t]; }
    const result = executeBrainfuck(bf, '', TRIAL_BF_OPTS);
    if (result.output && isMeaningful(result.output)) return result.output;
    return undefined;
  },
};

const befungeDetector: EsolangDetector = {
  name: 'Befunge',
  detect(input) {
    const lines = input.split('\n');
    if (lines.length < 2) return null;
    // Check for directional characters and grid layout
    const dirChars = (input.match(/[><v^@#]/g) || []).length;
    if (dirChars < 3) return null;
    // Must have @ (program end)
    if (!input.includes('@')) return null;
    return { score: 65, description: `Grid layout with ${dirChars} directional chars (><v^@#)` };
  },
};

// ---- Javascript Keycodes ----
const jsKeycodesDetector: EsolangDetector = {
  name: 'Javascript Keycodes',
  detect(input) {
    // String.fromCharCode(...)
    if (/String\.fromCharCode\s*\(/i.test(input)) {
      return { score: 95, description: 'Contains String.fromCharCode() call' };
    }
    // Array of numbers in printable ASCII range
    const arrayMatch = input.match(/^\s*\[[\d,\s]+\]\s*$/);
    if (arrayMatch) {
      const nums = input.match(/\d+/g);
      if (nums && nums.length >= 3 && nums.every(n => { const v = parseInt(n); return v >= 20 && v <= 127; })) {
        return { score: 70, description: `Array of ${nums.length} numbers in ASCII range` };
      }
    }
    return null;
  },
};

// ---- Javascript Obfuscation ----
const jsObfuscationDetector: EsolangDetector = {
  name: 'Javascript Obfuscation',
  detect(input) {
    let score = 0;
    const clues: string[] = [];
    if (/\\x[0-9a-fA-F]{2}/.test(input)) { score += 30; clues.push('hex escapes'); }
    if (/\\u[0-9a-fA-F]{4}/.test(input)) { score += 30; clues.push('unicode escapes'); }
    if (/\\[0-3]?[0-7]{2}/.test(input)) { score += 25; clues.push('octal escapes'); }
    if (/unescape\s*\(/i.test(input)) { score += 40; clues.push('unescape()'); }
    if (/atob\s*\(/i.test(input)) { score += 40; clues.push('atob()'); }
    if (/decodeURIComponent\s*\(/i.test(input)) { score += 35; clues.push('decodeURIComponent()'); }
    if (score < 25) return null;
    return { score: Math.min(score, 95), description: `JS obfuscation patterns: ${clues.join(', ')}` };
  },
};

export const esolangDetectors: EsolangDetector[] = [
  // Tier 1: BF family (with trial execution)
  bfDetector,
  ookDetector,
  binaryfuckDetector,
  blubDetector,
  pikalangDetector,
  spoonDetector,
  cowDetector,
  alphuckDetector,

  // Tier 2: Standalone (with trial execution)
  deadfishDetector,
  whitespaceDetector,
  chickenDetector,

  // Tier 3: JS-based
  jsfuckDetector,
  aaencodeDetector,
  jsKeycodesDetector,
  jsObfuscationDetector,

  // Tier 4: Detection + interpreters
  lolcodeDetector,
  malbolgeDetector,
  shakespeareDetector,
  hodorDetector,

  // Tier 5: Detection only
  chefDetector,
  rockstarDetector,
  befungeDetector,
];
