/**
 * Core Brainfuck interpreter engine.
 * Shared by BF, Ook!, Binaryfuck, Blub, Pikalang, ReverseFuck, Spoon, and COW.
 */

export interface BFOptions {
  maxSteps?: number;
  maxOutput?: number;
  memorySize?: number;
  wrapCells?: boolean;
  /** If true, include memory/pointer in result for debugging */
  dumpMemory?: boolean;
}

export interface BFResult {
  output: string;
  steps: number;
  halted: boolean;
  error?: string;
  /** Tape cells (only non-zero region) for memory dump */
  memory?: number[];
  /** Final data pointer position */
  pointer?: number;
}

const DEFAULT_MAX_STEPS = 100_000;
const DEFAULT_MAX_OUTPUT = 10_000;
const DEFAULT_MEMORY_SIZE = 30_000;

/**
 * Execute a Brainfuck program.
 * @param program - BF source (only +-><.,[] are significant)
 * @param input - stdin for `,` instruction
 * @param options - execution limits
 */
export function executeBrainfuck(
  program: string,
  input: string,
  options?: BFOptions,
): BFResult {
  const maxSteps = options?.maxSteps ?? DEFAULT_MAX_STEPS;
  const maxOutput = options?.maxOutput ?? DEFAULT_MAX_OUTPUT;
  const memSize = options?.memorySize ?? DEFAULT_MEMORY_SIZE;
  const wrap = options?.wrapCells ?? true;
  const dumpMem = options?.dumpMemory ?? false;

  /** Slice the tape down to the used region */
  function sliceMemory(m: Uint8Array, p: number): Pick<BFResult, 'memory' | 'pointer'> {
    if (!dumpMem) return {};
    let maxUsed = 0;
    for (let i = m.length - 1; i >= 0; i--) {
      if (m[i] !== 0) { maxUsed = i; break; }
    }
    const end = Math.max(maxUsed + 1, p + 1);
    return { memory: Array.from(m.slice(0, end)), pointer: p };
  }

  // Filter to valid commands
  const cmds = [...program].filter((c) => '+-><.,[]'.includes(c));

  // Precompute bracket jump table
  const jumpTable = new Map<number, number>();
  const stack: number[] = [];
  for (let i = 0; i < cmds.length; i++) {
    if (cmds[i] === '[') {
      stack.push(i);
    } else if (cmds[i] === ']') {
      if (stack.length === 0) {
        return { output: '', steps: 0, halted: true, error: 'Unmatched ]' };
      }
      const open = stack.pop()!;
      jumpTable.set(open, i);
      jumpTable.set(i, open);
    }
  }
  if (stack.length > 0) {
    return { output: '', steps: 0, halted: true, error: 'Unmatched [' };
  }

  const mem = new Uint8Array(memSize);
  let ptr = 0;
  let ip = 0;
  let inPtr = 0;
  let steps = 0;
  let out = '';

  while (ip < cmds.length) {
    if (steps >= maxSteps) {
      return { output: out, steps, halted: false, error: `Execution limit reached (${maxSteps} steps)`, ...sliceMemory(mem, ptr) };
    }
    steps++;

    switch (cmds[ip]) {
      case '>':
        ptr = (ptr + 1) % memSize;
        break;
      case '<':
        ptr = (ptr - 1 + memSize) % memSize;
        break;
      case '+':
        if (wrap) {
          mem[ptr] = (mem[ptr] + 1) & 0xff;
        } else {
          mem[ptr]++;
        }
        break;
      case '-':
        if (wrap) {
          mem[ptr] = (mem[ptr] - 1 + 256) & 0xff;
        } else {
          mem[ptr]--;
        }
        break;
      case '.':
        if (out.length >= maxOutput) {
          return { output: out, steps, halted: false, error: `Output limit reached (${maxOutput} chars)`, ...sliceMemory(mem, ptr) };
        }
        out += String.fromCharCode(mem[ptr]);
        break;
      case ',':
        mem[ptr] = inPtr < input.length ? input.charCodeAt(inPtr++) & 0xff : 0;
        break;
      case '[':
        if (mem[ptr] === 0) {
          ip = jumpTable.get(ip)!;
        }
        break;
      case ']':
        if (mem[ptr] !== 0) {
          ip = jumpTable.get(ip)!;
        }
        break;
    }
    ip++;
  }

  return { output: out, steps, halted: true, ...sliceMemory(mem, ptr) };
}

/**
 * Execute a COW program.
 * COW has 12 moo-variant commands with a register and I/O.
 */
export function executeCOW(
  program: string,
  input: string,
  options?: BFOptions,
): BFResult {
  const maxSteps = options?.maxSteps ?? DEFAULT_MAX_STEPS;
  const maxOutput = options?.maxOutput ?? DEFAULT_MAX_OUTPUT;
  const memSize = options?.memorySize ?? DEFAULT_MEMORY_SIZE;
  const dumpMem = options?.dumpMemory ?? false;

  // Tokenize: split by whitespace, filter valid moo tokens
  const MOO_CMDS = ['moo', 'mOo', 'moO', 'mOO', 'Moo', 'MOo', 'MoO', 'MOO', 'OOO', 'MMM', 'OOM', 'oom'];
  const tokens = program.split(/\s+/).filter((t) => MOO_CMDS.includes(t));

  const mem = new Int32Array(memSize);
  let ptr = 0;
  let ip = 0;
  let inPtr = 0;
  let steps = 0;
  let out = '';
  let register: number | null = null;

  while (ip < tokens.length) {
    if (steps >= maxSteps) {
      return { output: out, steps, halted: false, error: `Execution limit reached (${maxSteps} steps)` };
    }
    steps++;

    const cmd = tokens[ip];
    switch (cmd) {
      case 'moo': {
        // ] equivalent — jump back to matching MOO if cell != 0
        if (mem[ptr] !== 0) {
          let depth = 1;
          ip--;
          while (ip >= 0 && depth > 0) {
            if (tokens[ip] === 'MOO') depth--;
            else if (tokens[ip] === 'moo') depth++;
            if (depth > 0) ip--;
          }
          if (ip < 0) return { output: out, steps, halted: true, error: 'Unmatched moo' };
        }
        break;
      }
      case 'mOo': // ptr--
        ptr = (ptr - 1 + memSize) % memSize;
        break;
      case 'moO': // ptr++
        ptr = (ptr + 1) % memSize;
        break;
      case 'mOO': // execute cell value as command index (0-11)
        // Skip: too meta for safety
        break;
      case 'Moo': // input or output based on cell
        if (mem[ptr] === 0) {
          mem[ptr] = inPtr < input.length ? input.charCodeAt(inPtr++) : 0;
        } else {
          if (out.length >= maxOutput) {
            return { output: out, steps, halted: false, error: `Output limit reached` };
          }
          out += String.fromCharCode(mem[ptr] & 0xff);
        }
        break;
      case 'MOo': // cell--
        mem[ptr]--;
        break;
      case 'MoO': // cell++
        mem[ptr]++;
        break;
      case 'MOO': {
        // [ equivalent — jump to matching moo if cell == 0
        if (mem[ptr] === 0) {
          let depth = 1;
          ip++;
          while (ip < tokens.length && depth > 0) {
            if (tokens[ip] === 'MOO') depth++;
            else if (tokens[ip] === 'moo') depth--;
            if (depth > 0) ip++;
          }
          if (ip >= tokens.length) return { output: out, steps, halted: true, error: 'Unmatched MOO' };
        }
        break;
      }
      case 'OOO': // set cell to 0
        mem[ptr] = 0;
        break;
      case 'MMM': // register: if null, copy cell to reg; else copy reg to cell and clear reg
        if (register === null) {
          register = mem[ptr];
        } else {
          mem[ptr] = register;
          register = null;
        }
        break;
      case 'OOM': // print cell as int
        if (out.length >= maxOutput) {
          return { output: out, steps, halted: false, error: `Output limit reached` };
        }
        out += mem[ptr].toString();
        break;
      case 'oom': // read int from input
        // simple: read digits from input
        let numStr = '';
        while (inPtr < input.length && /\d/.test(input[inPtr])) {
          numStr += input[inPtr++];
        }
        mem[ptr] = numStr ? parseInt(numStr, 10) : 0;
        break;
    }
    ip++;
  }

  let memDump: Pick<BFResult, 'memory' | 'pointer'> = {};
  if (dumpMem) {
    let maxUsed = 0;
    for (let i = mem.length - 1; i >= 0; i--) {
      if (mem[i] !== 0) { maxUsed = i; break; }
    }
    const end = Math.max(maxUsed + 1, ptr + 1);
    memDump = { memory: Array.from(mem.slice(0, end)), pointer: ptr };
  }

  return { output: out, steps, halted: true, ...memDump };
}

/**
 * Format a memory dump as a hex + ASCII table.
 * Shows 16 bytes per row with pointer marker.
 */
export function formatMemoryDump(memory: number[], pointer: number): string {
  if (!memory || memory.length === 0) return '[Empty memory]';

  // Find last non-zero cell
  let lastNonZero = 0;
  for (let i = memory.length - 1; i >= 0; i--) {
    if (memory[i] !== 0) { lastNonZero = i; break; }
  }
  const end = Math.max(lastNonZero + 1, pointer + 1);
  // Round up to next 16
  const rows = Math.ceil(end / 16);

  const lines: string[] = ['=== Memory Dump ===', `Pointer: cell ${pointer} (0x${pointer.toString(16).toUpperCase()})`, ''];

  for (let r = 0; r < rows; r++) {
    const addr = r * 16;
    const hex: string[] = [];
    const ascii: string[] = [];

    for (let c = 0; c < 16; c++) {
      const idx = addr + c;
      if (idx < memory.length) {
        const val = memory[idx] & 0xff;
        const marker = idx === pointer ? '>' : ' ';
        hex.push(`${marker}${val.toString(16).padStart(2, '0').toUpperCase()}`);
        ascii.push(val >= 0x20 && val < 0x7f ? String.fromCharCode(val) : '.');
      } else {
        hex.push('   ');
        ascii.push(' ');
      }
    }

    lines.push(
      `${addr.toString(16).padStart(4, '0').toUpperCase()}: ${hex.join(' ')}  |${ascii.join('')}|`
    );
  }

  // Non-zero cell listing
  const nonZero = memory
    .map((v, i) => (v !== 0 ? `  [${i}] = ${v} (0x${(v & 0xff).toString(16).toUpperCase()})${v >= 0x20 && v < 0x7f ? ` '${String.fromCharCode(v)}'` : ''}` : null))
    .filter(Boolean);

  if (nonZero.length > 0) {
    lines.push('', `Non-zero cells (${nonZero.length}):`);
    lines.push(...(nonZero as string[]));
  }

  return lines.join('\n');
}
