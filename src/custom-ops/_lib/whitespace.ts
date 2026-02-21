/**
 * Whitespace language interpreter.
 * Stack-based VM with heap, call stack, and labels.
 * Instructions encoded as sequences of Space (S), Tab (T), and Line Feed (L).
 */

export interface WSOptions {
  maxSteps?: number;
  maxOutput?: number;
  maxHeap?: number;
  maxCallStack?: number;
}

export interface WSResult {
  output: string;
  error?: string;
}

const DEFAULT_MAX_STEPS = 100_000;
const DEFAULT_MAX_OUTPUT = 10_000;
const DEFAULT_MAX_HEAP = 10_000;
const DEFAULT_MAX_CALL_STACK = 1_000;

type Instruction =
  | { op: 'push'; val: number }
  | { op: 'dup' }
  | { op: 'copy'; val: number }
  | { op: 'swap' }
  | { op: 'drop' }
  | { op: 'slide'; val: number }
  | { op: 'add' }
  | { op: 'sub' }
  | { op: 'mul' }
  | { op: 'div' }
  | { op: 'mod' }
  | { op: 'store' }
  | { op: 'retrieve' }
  | { op: 'label'; val: string }
  | { op: 'call'; val: string }
  | { op: 'jmp'; val: string }
  | { op: 'jz'; val: string }
  | { op: 'jn'; val: string }
  | { op: 'ret' }
  | { op: 'end' }
  | { op: 'outchar' }
  | { op: 'outnum' }
  | { op: 'inchar' }
  | { op: 'innum' };

/** Parse whitespace characters into a token stream of S, T, L */
function tokenize(source: string): string[] {
  const tokens: string[] = [];
  for (const ch of source) {
    if (ch === ' ') tokens.push('S');
    else if (ch === '\t') tokens.push('T');
    else if (ch === '\n') tokens.push('L');
  }
  return tokens;
}

/** Read a number: sign (S=+, T=-) then binary digits (S=0, T=1) terminated by L */
function readNumber(tokens: string[], pos: number): { val: number; next: number } | null {
  if (pos >= tokens.length) return null;
  const sign = tokens[pos] === 'S' ? 1 : -1;
  pos++;

  let bits = '';
  while (pos < tokens.length && tokens[pos] !== 'L') {
    bits += tokens[pos] === 'S' ? '0' : '1';
    pos++;
  }
  if (pos >= tokens.length) return null;
  pos++; // skip L

  const val = bits.length === 0 ? 0 : parseInt(bits, 2) * sign;
  return { val, next: pos };
}

/** Read a label: sequence of S/T terminated by L */
function readLabel(tokens: string[], pos: number): { val: string; next: number } | null {
  let label = '';
  while (pos < tokens.length && tokens[pos] !== 'L') {
    label += tokens[pos];
    pos++;
  }
  if (pos >= tokens.length) return null;
  pos++; // skip L
  return { val: label, next: pos };
}

/** Parse token stream into instructions */
function parse(tokens: string[]): Instruction[] | string {
  const instructions: Instruction[] = [];
  let i = 0;

  while (i < tokens.length) {
    const t = tokens[i];

    if (t === 'S') {
      // Stack manipulation (IMP: S)
      i++;
      if (i >= tokens.length) break;

      if (tokens[i] === 'S') {
        // Push number
        i++;
        const num = readNumber(tokens, i);
        if (!num) return 'Parse error: expected number for push';
        instructions.push({ op: 'push', val: num.val });
        i = num.next;
      } else if (tokens[i] === 'L') {
        i++;
        if (i >= tokens.length) break;
        if (tokens[i] === 'S') { instructions.push({ op: 'dup' }); i++; }
        else if (tokens[i] === 'T') { instructions.push({ op: 'swap' }); i++; }
        else if (tokens[i] === 'L') { instructions.push({ op: 'drop' }); i++; }
      } else if (tokens[i] === 'T') {
        i++;
        if (i >= tokens.length) break;
        if (tokens[i] === 'S') {
          // Copy nth
          i++;
          const num = readNumber(tokens, i);
          if (!num) return 'Parse error: expected number for copy';
          instructions.push({ op: 'copy', val: num.val });
          i = num.next;
        } else if (tokens[i] === 'L') {
          // Slide n
          i++;
          const num = readNumber(tokens, i);
          if (!num) return 'Parse error: expected number for slide';
          instructions.push({ op: 'slide', val: num.val });
          i = num.next;
        }
      }
    } else if (t === 'T') {
      i++;
      if (i >= tokens.length) break;

      if (tokens[i] === 'S') {
        // Arithmetic (IMP: TS)
        i++;
        if (i >= tokens.length) break;
        const a = tokens[i]; i++;
        if (i >= tokens.length) break;
        const b = tokens[i]; i++;

        if (a === 'S' && b === 'S') instructions.push({ op: 'add' });
        else if (a === 'S' && b === 'T') instructions.push({ op: 'sub' });
        else if (a === 'S' && b === 'L') instructions.push({ op: 'mul' });
        else if (a === 'T' && b === 'S') instructions.push({ op: 'div' });
        else if (a === 'T' && b === 'T') instructions.push({ op: 'mod' });
      } else if (tokens[i] === 'T') {
        // Heap (IMP: TT)
        i++;
        if (i >= tokens.length) break;
        if (tokens[i] === 'S') { instructions.push({ op: 'store' }); i++; }
        else if (tokens[i] === 'T') { instructions.push({ op: 'retrieve' }); i++; }
      } else if (tokens[i] === 'L') {
        // I/O (IMP: TL)
        i++;
        if (i >= tokens.length) break;
        const a = tokens[i]; i++;
        if (i >= tokens.length) break;
        const b = tokens[i]; i++;

        if (a === 'S' && b === 'S') instructions.push({ op: 'outchar' });
        else if (a === 'S' && b === 'T') instructions.push({ op: 'outnum' });
        else if (a === 'T' && b === 'S') instructions.push({ op: 'inchar' });
        else if (a === 'T' && b === 'T') instructions.push({ op: 'innum' });
      }
    } else if (t === 'L') {
      // Flow control (IMP: L)
      i++;
      if (i >= tokens.length) break;
      const sub = tokens[i]; i++;

      if (sub === 'S') {
        if (i >= tokens.length) break;
        if (tokens[i] === 'S') {
          // Mark label
          i++;
          const lbl = readLabel(tokens, i);
          if (!lbl) return 'Parse error: expected label';
          instructions.push({ op: 'label', val: lbl.val });
          i = lbl.next;
        } else if (tokens[i] === 'T') {
          // Call
          i++;
          const lbl = readLabel(tokens, i);
          if (!lbl) return 'Parse error: expected label for call';
          instructions.push({ op: 'call', val: lbl.val });
          i = lbl.next;
        } else if (tokens[i] === 'L') {
          // Jump
          i++;
          const lbl = readLabel(tokens, i);
          if (!lbl) return 'Parse error: expected label for jump';
          instructions.push({ op: 'jmp', val: lbl.val });
          i = lbl.next;
        }
      } else if (sub === 'T') {
        if (i >= tokens.length) break;
        if (tokens[i] === 'S') {
          // Jump if zero
          i++;
          const lbl = readLabel(tokens, i);
          if (!lbl) return 'Parse error: expected label for jz';
          instructions.push({ op: 'jz', val: lbl.val });
          i = lbl.next;
        } else if (tokens[i] === 'T') {
          // Jump if negative
          i++;
          const lbl = readLabel(tokens, i);
          if (!lbl) return 'Parse error: expected label for jn';
          instructions.push({ op: 'jn', val: lbl.val });
          i = lbl.next;
        } else if (tokens[i] === 'L') {
          instructions.push({ op: 'ret' });
          i++;
        }
      } else if (sub === 'L') {
        if (i >= tokens.length) break;
        if (tokens[i] === 'L') {
          instructions.push({ op: 'end' });
          i++;
        } else {
          i++;
        }
      }
    } else {
      i++;
    }
  }

  return instructions;
}

export function executeWhitespace(
  program: string,
  input: string,
  options?: WSOptions,
): WSResult {
  const maxSteps = options?.maxSteps ?? DEFAULT_MAX_STEPS;
  const maxOutput = options?.maxOutput ?? DEFAULT_MAX_OUTPUT;
  const maxHeap = options?.maxHeap ?? DEFAULT_MAX_HEAP;
  const maxCallStack = options?.maxCallStack ?? DEFAULT_MAX_CALL_STACK;

  const tokens = tokenize(program);
  const parsed = parse(tokens);
  if (typeof parsed === 'string') return { output: '', error: parsed };

  const instructions = parsed;

  // Build label table
  const labels = new Map<string, number>();
  for (let i = 0; i < instructions.length; i++) {
    if (instructions[i].op === 'label') {
      labels.set((instructions[i] as { op: 'label'; val: string }).val, i);
    }
  }

  const stack: number[] = [];
  const heap = new Map<number, number>();
  const callStack: number[] = [];
  let ip = 0;
  let inPtr = 0;
  let steps = 0;
  let output = '';

  const pop = (): number => {
    if (stack.length === 0) throw new Error('Stack underflow');
    return stack.pop()!;
  };

  try {
    while (ip < instructions.length) {
      if (steps >= maxSteps) {
        return { output, error: `Execution limit reached (${maxSteps} steps)` };
      }
      steps++;

      const instr = instructions[ip];
      switch (instr.op) {
        case 'push':
          stack.push(instr.val);
          break;
        case 'dup':
          if (stack.length === 0) throw new Error('Stack underflow');
          stack.push(stack[stack.length - 1]);
          break;
        case 'copy': {
          const idx = stack.length - 1 - instr.val;
          if (idx < 0) throw new Error('Stack underflow (copy)');
          stack.push(stack[idx]);
          break;
        }
        case 'swap': {
          const a = pop(), b = pop();
          stack.push(a, b);
          break;
        }
        case 'drop':
          pop();
          break;
        case 'slide': {
          const top = pop();
          for (let n = 0; n < instr.val && stack.length > 0; n++) stack.pop();
          stack.push(top);
          break;
        }
        case 'add': { const b = pop(), a = pop(); stack.push(a + b); break; }
        case 'sub': { const b = pop(), a = pop(); stack.push(a - b); break; }
        case 'mul': { const b = pop(), a = pop(); stack.push(a * b); break; }
        case 'div': {
          const b = pop(), a = pop();
          if (b === 0) throw new Error('Division by zero');
          stack.push(Math.trunc(a / b));
          break;
        }
        case 'mod': {
          const b = pop(), a = pop();
          if (b === 0) throw new Error('Division by zero');
          stack.push(((a % b) + b) % b);
          break;
        }
        case 'store': {
          const val = pop(), addr = pop();
          if (heap.size >= maxHeap && !heap.has(addr)) {
            throw new Error('Heap limit reached');
          }
          heap.set(addr, val);
          break;
        }
        case 'retrieve': {
          const addr = pop();
          stack.push(heap.get(addr) ?? 0);
          break;
        }
        case 'label':
          // nop — already indexed
          break;
        case 'call': {
          if (callStack.length >= maxCallStack) throw new Error('Call stack overflow');
          const target = labels.get(instr.val);
          if (target === undefined) throw new Error(`Undefined label: ${instr.val}`);
          callStack.push(ip);
          ip = target;
          break;
        }
        case 'jmp': {
          const target = labels.get(instr.val);
          if (target === undefined) throw new Error(`Undefined label: ${instr.val}`);
          ip = target;
          break;
        }
        case 'jz': {
          const val = pop();
          if (val === 0) {
            const target = labels.get(instr.val);
            if (target === undefined) throw new Error(`Undefined label: ${instr.val}`);
            ip = target;
          }
          break;
        }
        case 'jn': {
          const val = pop();
          if (val < 0) {
            const target = labels.get(instr.val);
            if (target === undefined) throw new Error(`Undefined label: ${instr.val}`);
            ip = target;
          }
          break;
        }
        case 'ret': {
          if (callStack.length === 0) throw new Error('Call stack underflow');
          ip = callStack.pop()!;
          break;
        }
        case 'end':
          return { output };
        case 'outchar': {
          if (output.length >= maxOutput) return { output, error: 'Output limit reached' };
          output += String.fromCharCode(pop() & 0xffff);
          break;
        }
        case 'outnum': {
          if (output.length >= maxOutput) return { output, error: 'Output limit reached' };
          output += pop().toString();
          break;
        }
        case 'inchar': {
          const addr = pop();
          const ch = inPtr < input.length ? input.charCodeAt(inPtr++) : -1;
          heap.set(addr, ch);
          break;
        }
        case 'innum': {
          const addr = pop();
          let numStr = '';
          while (inPtr < input.length && /[\d\-]/.test(input[inPtr])) {
            numStr += input[inPtr++];
          }
          heap.set(addr, numStr ? parseInt(numStr, 10) : 0);
          break;
        }
      }
      ip++;
    }
  } catch (e: any) {
    return { output, error: e.message ?? String(e) };
  }

  return { output };
}
