#!/usr/bin/env npx tsx
/**
 * CLI runner for esoteric language interpreters.
 * Shows output + memory/tape dump without needing a browser.
 *
 * Usage:
 *   npx tsx scripts/run-esolang.ts <language> [--file <path>] [--stdin <text>] [--steps <n>]
 *   echo 'code' | npx tsx scripts/run-esolang.ts <language>
 *   npm run esolang -- <language> [flags]
 *
 * Examples:
 *   npm run esolang -- bf '++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.'
 *   npm run esolang -- ook --file hello.ook
 *   npm run esolang -- deadfish 'iiiiiiiisiiiiiiiiio'
 *   npm run esolang -- list
 *
 * Languages: bf, ook, binaryfuck, blub, pikalang, reversefuck, spoon, cow,
 *            deadfish, whitespace, chicken, detect
 */

import * as fs from 'fs';
import { executeBrainfuck, executeCOW } from '../src/custom-ops/_lib/brainfuck';
import { executeWhitespace } from '../src/custom-ops/_lib/whitespace';
import { esolangDetectors } from '../src/custom-ops/_lib/esolangDetect';

/* ------------------------------------------------------------------ */
/*  BF-family translators (copied from operation files — pure funcs)   */
/* ------------------------------------------------------------------ */

function ookToBF(source: string): string {
  const tokens = source.match(/Ook[.!?]/g);
  if (!tokens || tokens.length % 2 !== 0) return '';
  const map: Record<string, string> = {
    'Ook. Ook?': '>', 'Ook? Ook.': '<', 'Ook. Ook.': '+', 'Ook! Ook!': '-',
    'Ook! Ook.': '.', 'Ook. Ook!': ',', 'Ook! Ook?': '[', 'Ook? Ook!': ']',
  };
  let bf = '';
  for (let i = 0; i < tokens.length; i += 2) bf += map[tokens[i] + ' ' + tokens[i + 1]] ?? '';
  return bf;
}

function binaryfuckToBF(source: string): string {
  const bits = source.replace(/\s+/g, '');
  if (!/^[01]+$/.test(bits) || bits.length % 3 !== 0) return '';
  const map: Record<string, string> = {
    '000': '>', '001': '<', '010': '+', '011': '-',
    '100': '.', '101': ',', '110': '[', '111': ']',
  };
  let bf = '';
  for (let i = 0; i < bits.length; i += 3) bf += map[bits.slice(i, i + 3)] ?? '';
  return bf;
}

function blubToBF(source: string): string {
  const tokens = source.match(/Blub[.!?]/gi);
  if (!tokens || tokens.length % 2 !== 0) return '';
  let bf = '';
  for (let i = 0; i < tokens.length; i += 2) {
    const pair = tokens[i].charAt(4) + tokens[i + 1].charAt(4);
    const map: Record<string, string> = {
      '.?': '>', '?.': '<', '..': '+', '!!': '-',
      '!.': '.', '.!': ',', '!?': '[', '?!': ']',
    };
    bf += map[pair] ?? '';
  }
  return bf;
}

function pikalangToBF(source: string): string {
  const keywords: [string, string][] = [
    ['pikachu', '.'], ['pikapi', ','], ['pichu', '-'], ['pipi', '+'],
    ['pika', '['], ['chu', ']'], ['pi', '>'], ['ka', '<'],
  ];
  let bf = '';
  let i = 0;
  const lower = source.toLowerCase();
  while (i < lower.length) {
    let matched = false;
    for (const [kw, cmd] of keywords) {
      if (lower.startsWith(kw, i)) { bf += cmd; i += kw.length; matched = true; break; }
    }
    if (!matched) i++;
  }
  return bf;
}

function reverseFuckToBF(source: string): string {
  let bf = '';
  for (const ch of source) {
    switch (ch) {
      case '+': bf += '-'; break;
      case '-': bf += '+'; break;
      case '>': bf += '<'; break;
      case '<': bf += '>'; break;
      default: bf += ch;
    }
  }
  return bf;
}

function spoonToBF(source: string): string {
  const bits = source.replace(/\s+/g, '');
  if (!/^[01]+$/.test(bits)) return '';
  const codes: [string, string][] = [
    ['00100', '['], ['00101', ']'], ['00110', '.'], ['00111', ','],
    ['010', '>'], ['011', '<'], ['000', '-'], ['1', '+'],
  ];
  let bf = '';
  let pos = 0;
  while (pos < bits.length) {
    let matched = false;
    for (const [code, cmd] of codes) {
      if (bits.startsWith(code, pos)) { bf += cmd; pos += code.length; matched = true; break; }
    }
    if (!matched) return '';
  }
  return bf;
}

function executeDeadfish(code: string): string {
  let acc = 0;
  let out = '';
  for (const ch of code) {
    switch (ch) {
      case 'i': acc++; break;
      case 'd': acc--; break;
      case 's': acc = acc * acc; break;
      case 'o': out += String.fromCharCode(acc & 0xffff); break;
    }
    if (acc === -1 || acc === 256) acc = 0;
  }
  return out;
}

function executeChicken(program: string, input: string, maxSteps = 100_000): { output: string; error?: string } {
  const lines = program.split('\n');
  const opcodes: number[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') { opcodes.push(0); }
    else { opcodes.push(trimmed.split(/\s+/).filter((w) => w.toLowerCase() === 'chicken').length); }
  }
  while (opcodes.length > 0 && opcodes[opcodes.length - 1] === 0) opcodes.pop();
  if (opcodes.length === 0) return { output: '' };

  const stack: any[] = [input, opcodes];
  let ip = 0, steps = 0, output = '';

  while (ip < opcodes.length) {
    if (steps++ >= maxSteps) return { output, error: `Execution limit reached (${maxSteps} steps)` };
    const op = opcodes[ip];
    switch (op) {
      case 0: return { output };
      case 1: stack.push('chicken'); break;
      case 2: { const a = stack.pop(), b = stack.pop(); stack.push(typeof a === 'number' && typeof b === 'number' ? a + b : String(b) + String(a)); break; }
      case 3: { const a = stack.pop(), b = stack.pop(); stack.push((Number(b) || 0) - (Number(a) || 0)); break; }
      case 4: { const a = stack.pop(), b = stack.pop(); stack.push((Number(b) || 0) * (Number(a) || 0)); break; }
      case 5: { const a = stack.pop(), b = stack.pop(); stack.push(a === b ? 1 : 0); break; }
      case 6: {
        ip++;
        if (ip >= opcodes.length) return { output, error: 'Unexpected end' };
        const source = opcodes[ip];
        const idx = stack.pop();
        const src = stack[source];
        if (typeof src === 'string') stack.push(typeof idx === 'number' && idx < src.length ? src.charCodeAt(idx) : 0);
        else if (Array.isArray(src)) stack.push(typeof idx === 'number' && idx < src.length ? src[idx] : 0);
        else stack.push(0);
        break;
      }
      case 7: { const top = stack.pop(); output += typeof top === 'number' ? String.fromCharCode(top & 0xffff) : String(top); break; }
      case 8: { const top = stack.pop(); stack.push(typeof top === 'string' && top.length > 0 ? top.charCodeAt(0) : Number(top) || 0); break; }
      case 9: stack.push(stack.pop() ? 0 : 1); break;
      case 10: { const addr = stack.pop(), cond = stack.pop(); if (cond) ip = (Number(addr) || 0) - 1; break; }
      default: stack.push(op - 10); break;
    }
    ip++;
  }
  return { output };
}

/* ------------------------------------------------------------------ */
/*  Hex dump formatting                                                */
/* ------------------------------------------------------------------ */

function hexDump(data: number[], pointer: number): string {
  const lines: string[] = [];
  const ROW = 16;
  for (let off = 0; off < data.length; off += ROW) {
    const row = data.slice(off, off + ROW);
    const addr = off.toString(16).padStart(4, '0');
    const hex = row.map((b, i) => {
      const s = b.toString(16).padStart(2, '0');
      return (off + i === pointer) ? `[${s}]` : ` ${s} `;
    }).join('');
    const ascii = row.map((b) => (b >= 0x20 && b <= 0x7e) ? String.fromCharCode(b) : '.').join('');
    lines.push(`${addr}: ${hex}  |${ascii}|`);
  }
  return lines.join('\n');
}

function printableOutput(s: string): string {
  // Show non-printable chars as escape sequences
  return [...s].map((ch) => {
    const c = ch.charCodeAt(0);
    if (c === 0x0a) return '\\n';
    if (c === 0x0d) return '\\r';
    if (c === 0x09) return '\\t';
    if (c < 0x20 || c === 0x7f) return `\\x${c.toString(16).padStart(2, '0')}`;
    return ch;
  }).join('');
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

const LANGS: Record<string, string> = {
  bf: 'Brainfuck',
  brainfuck: 'Brainfuck',
  ook: 'Ook!',
  binaryfuck: 'Binaryfuck',
  blub: 'Blub!',
  pikalang: 'Pikalang',
  reversefuck: 'ReverseFuck',
  spoon: 'Spoon',
  cow: 'COW',
  deadfish: 'Deadfish',
  whitespace: 'Whitespace',
  chicken: 'Chicken',
  detect: 'Cipher Identifier (detect)',
};

function usage() {
  console.log(`
Usage: npx tsx scripts/run-esolang.ts <language> [code] [options]
       npm run esolang -- <language> [code] [options]

Languages:
${Object.entries(LANGS).map(([k, v]) => `  ${k.padEnd(14)} ${v}`).join('\n')}

Options:
  --file <path>     Read code from file instead of argument
  --stdin <text>    Provide stdin input for the program
  --steps <n>       Max execution steps (default: 100000)

If no code or --file given, reads from process stdin (pipe).

Examples:
  npm run esolang -- bf '++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.'
  npm run esolang -- detect '++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.'
  echo 'iiiiiiiisiiiiiiiiio' | npm run esolang -- deadfish
  npm run esolang -- list
`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    usage();
    process.exit(0);
  }

  if (args[0] === 'list') {
    console.log('\nAvailable languages:');
    for (const [k, v] of Object.entries(LANGS)) {
      console.log(`  ${k.padEnd(14)} ${v}`);
    }
    process.exit(0);
  }

  const lang = args[0].toLowerCase();
  if (!LANGS[lang]) {
    console.error(`Unknown language: ${args[0]}\nUse 'list' to see available languages.`);
    process.exit(1);
  }

  // Parse options
  let code: string | null = null;
  let stdin = '';
  let maxSteps = 100_000;
  let filePath: string | null = null;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--file' && i + 1 < args.length) {
      filePath = args[++i];
    } else if (args[i] === '--stdin' && i + 1 < args.length) {
      stdin = args[++i];
    } else if (args[i] === '--steps' && i + 1 < args.length) {
      maxSteps = parseInt(args[++i], 10);
    } else if (!code) {
      code = args[i];
    }
  }

  // Read code from file
  if (filePath) {
    code = fs.readFileSync(filePath, 'utf-8');
  }

  // Read from process stdin if no code given
  if (!code) {
    try {
      code = fs.readFileSync(0, 'utf-8'); // fd 0 = stdin
    } catch {
      console.error('No code provided. Pass as argument, --file, or pipe to stdin.');
      process.exit(1);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Language: ${LANGS[lang]}`);
  console.log(`  Code length: ${code.length} chars`);
  if (stdin) console.log(`  Stdin: ${printableOutput(stdin.slice(0, 50))}${stdin.length > 50 ? '...' : ''}`);
  console.log(`  Max steps: ${maxSteps.toLocaleString()}`);
  console.log(`${'='.repeat(60)}\n`);

  // ---- Detect mode ----
  if (lang === 'detect') {
    console.log('--- Detection Results ---\n');
    for (const detector of esolangDetectors) {
      const match = detector.detect(code);
      if (match) {
        let reversed: string | undefined;
        if (detector.tryExecute) {
          try { reversed = detector.tryExecute(code); } catch { /* ignore */ }
        }
        const rev = reversed ? ` → "${printableOutput(reversed.slice(0, 80))}"` : '';
        console.log(`  [${match.score.toString().padStart(2)}] ${detector.name.padEnd(16)} ${match.description}${rev}`);
      }
    }
    console.log('');
    process.exit(0);
  }

  // ---- Execute ----
  const t0 = performance.now();
  let output = '';
  let error: string | undefined;
  let steps = 0;
  let memory: number[] | undefined;
  let pointer: number | undefined;

  switch (lang) {
    case 'bf':
    case 'brainfuck': {
      const r = executeBrainfuck(code, stdin, { maxSteps, dumpMemory: true });
      output = r.output; error = r.error; steps = r.steps;
      memory = r.memory; pointer = r.pointer;
      break;
    }
    case 'ook': {
      const bf = ookToBF(code);
      if (!bf) { error = 'No valid Ook! token pairs found'; break; }
      const r = executeBrainfuck(bf, stdin, { maxSteps, dumpMemory: true });
      output = r.output; error = r.error; steps = r.steps;
      memory = r.memory; pointer = r.pointer;
      break;
    }
    case 'binaryfuck': {
      const bf = binaryfuckToBF(code);
      if (!bf) { error = 'Invalid Binaryfuck'; break; }
      const r = executeBrainfuck(bf, stdin, { maxSteps, dumpMemory: true });
      output = r.output; error = r.error; steps = r.steps;
      memory = r.memory; pointer = r.pointer;
      break;
    }
    case 'blub': {
      const bf = blubToBF(code);
      if (!bf) { error = 'No valid Blub! token pairs found'; break; }
      const r = executeBrainfuck(bf, stdin, { maxSteps, dumpMemory: true });
      output = r.output; error = r.error; steps = r.steps;
      memory = r.memory; pointer = r.pointer;
      break;
    }
    case 'pikalang': {
      const bf = pikalangToBF(code);
      if (!bf) { error = 'No Pikalang keywords found'; break; }
      const r = executeBrainfuck(bf, stdin, { maxSteps, dumpMemory: true });
      output = r.output; error = r.error; steps = r.steps;
      memory = r.memory; pointer = r.pointer;
      break;
    }
    case 'reversefuck': {
      const bf = reverseFuckToBF(code);
      const r = executeBrainfuck(bf, stdin, { maxSteps, dumpMemory: true });
      output = r.output; error = r.error; steps = r.steps;
      memory = r.memory; pointer = r.pointer;
      break;
    }
    case 'spoon': {
      const bf = spoonToBF(code);
      if (!bf) { error = 'Invalid Spoon binary code'; break; }
      const r = executeBrainfuck(bf, stdin, { maxSteps, dumpMemory: true });
      output = r.output; error = r.error; steps = r.steps;
      memory = r.memory; pointer = r.pointer;
      break;
    }
    case 'cow': {
      const r = executeCOW(code, stdin, { maxSteps, dumpMemory: true });
      output = r.output; error = r.error; steps = r.steps;
      break;
    }
    case 'deadfish': {
      output = executeDeadfish(code);
      steps = code.length;
      break;
    }
    case 'whitespace': {
      const r = executeWhitespace(code, stdin, { maxSteps });
      output = r.output; error = r.error;
      break;
    }
    case 'chicken': {
      const r = executeChicken(code, stdin, maxSteps);
      output = r.output; error = r.error;
      break;
    }
  }

  const elapsed = (performance.now() - t0).toFixed(2);

  // ---- Output ----
  // Strip null bytes for clean display
  const clean = output.replace(/\x00/g, '');
  console.log('--- Output ---\n');
  if (clean.length > 0) {
    console.log(clean);
  } else if (output.length > 0) {
    console.log('  (only null bytes)');
  } else {
    console.log('  (empty)');
  }
  if (output.length > 0) {
    const nulls = output.length - clean.length;
    const nullNote = nulls > 0 ? `, ${nulls} null bytes stripped` : '';
    console.log(`\n  (${output.length} raw chars${nullNote})`);
    console.log(`  escaped: "${printableOutput(output.slice(0, 200))}"${output.length > 200 ? '...' : ''}`);
  }

  if (error) {
    console.log(`\n--- Error ---\n  ${error}`);
  }

  console.log(`\n--- Stats ---`);
  console.log(`  Steps: ${steps.toLocaleString()}`);
  console.log(`  Time:  ${elapsed}ms`);

  // ---- Memory Dump ----
  if (memory && memory.length > 0) {
    console.log(`\n--- Memory Dump (${memory.length} cells, pointer at [${pointer}]) ---\n`);
    console.log(hexDump(memory, pointer ?? 0));

    // Also show non-zero cells compactly
    const nonZero = memory
      .map((v, i) => [i, v] as [number, number])
      .filter(([_, v]) => v !== 0);
    if (nonZero.length > 0 && nonZero.length <= 32) {
      console.log(`\n  Non-zero cells:`);
      for (const [i, v] of nonZero) {
        const ch = (v >= 0x20 && v <= 0x7e) ? ` '${String.fromCharCode(v)}'` : '';
        console.log(`    [${i}] = ${v} (0x${v.toString(16).padStart(2, '0')})${ch}`);
      }
    }
  }

  console.log('');
}

main();
