import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Chicken Interpreter';

/**
 * Chicken language interpreter.
 * Each line's count of "chicken" words is an opcode. Stack machine with ~11 opcodes.
 */
function executeChicken(program: string, input: string, maxSteps = 100_000): { output: string; error?: string } {
  // Parse: count "chicken" on each line
  const lines = program.split('\n');
  const opcodes: number[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      opcodes.push(0);
    } else {
      const count = trimmed.split(/\s+/).filter((w) => w.toLowerCase() === 'chicken').length;
      opcodes.push(count);
    }
  }

  // Remove trailing empty lines (0s)
  while (opcodes.length > 0 && opcodes[opcodes.length - 1] === 0) opcodes.pop();

  if (opcodes.length === 0) return { output: '' };

  const stack: any[] = [];
  // The stack starts with: the program opcodes and the input
  stack.push(input);       // index 0: user input
  stack.push(opcodes);     // index 1: the program itself

  let ip = 0;
  let steps = 0;
  let output = '';

  while (ip < opcodes.length) {
    if (steps++ >= maxSteps) {
      return { output, error: `Execution limit reached (${maxSteps} steps)` };
    }

    const op = opcodes[ip];
    switch (op) {
      case 0: // exit
        return { output };
      case 1: // push literal "chicken"
        stack.push('chicken');
        break;
      case 2: { // add top two
        const a = stack.pop();
        const b = stack.pop();
        if (typeof a === 'number' && typeof b === 'number') {
          stack.push(a + b);
        } else {
          stack.push(String(b) + String(a));
        }
        break;
      }
      case 3: { // subtract
        const a = stack.pop();
        const b = stack.pop();
        stack.push((Number(b) || 0) - (Number(a) || 0));
        break;
      }
      case 4: { // multiply
        const a = stack.pop();
        const b = stack.pop();
        stack.push((Number(b) || 0) * (Number(a) || 0));
        break;
      }
      case 5: { // compare equals
        const a = stack.pop();
        const b = stack.pop();
        stack.push(a === b ? 1 : 0);
        break;
      }
      case 6: { // double-wide load: next opcode is source (0=user input, 1=program)
        ip++;
        if (ip >= opcodes.length) return { output, error: 'Unexpected end of program' };
        const source = opcodes[ip];
        const idx = stack.pop();
        const src = stack[source];
        if (typeof src === 'string') {
          stack.push(typeof idx === 'number' && idx < src.length ? src.charCodeAt(idx) : 0);
        } else if (Array.isArray(src)) {
          stack.push(typeof idx === 'number' && idx < src.length ? src[idx] : 0);
        } else {
          stack.push(0);
        }
        break;
      }
      case 7: { // store: push top as string
        const top = stack.pop();
        if (typeof top === 'number') {
          output += String.fromCharCode(top & 0xffff);
        } else {
          output += String(top);
        }
        break;
      }
      case 8: { // push top as char
        const top = stack.pop();
        if (typeof top === 'string' && top.length > 0) {
          stack.push(top.charCodeAt(0));
        } else {
          stack.push(Number(top) || 0);
        }
        break;
      }
      case 9: // not
        stack.push(stack.pop() ? 0 : 1);
        break;
      case 10: { // jump if truthy: pop condition, pop address
        const addr = stack.pop();
        const cond = stack.pop();
        if (cond) {
          ip = (Number(addr) || 0) - 1; // -1 because ip++ at end
        }
        break;
      }
      default: // push the opcode number - 10
        stack.push(op - 10);
        break;
    }
    ip++;
  }

  return { output };
}

class ChickenInterpreter extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Interprets Chicken — each line\'s count of the word "chicken" is an opcode for a stack machine.';
    this.infoURL = 'https://esolangs.org/wiki/Chicken';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Mode', type: 'option', value: ['Code in input', 'Separate code and input'] },
      { name: 'Code', type: 'text', value: '' },
      { name: 'Max Steps', type: 'number', value: 100000 },
      { name: 'Strip null bytes', type: 'boolean', value: true },
    ];
  }

  run(input: string, args: any[]): string {
    const mode = args[0] as string;
    const code = args[1] as string;
    const maxSteps = args[2] as number;
    const stripNulls = args[3] !== false;

    let program: string, stdin: string;
    if (mode === 'Separate code and input') {
      program = code;
      stdin = input;
    } else {
      program = input;
      stdin = '';
    }

    const result = executeChicken(program, stdin, maxSteps);
    let out = stripNulls ? result.output.replace(/\x00/g, '') : result.output;
    if (result.error) return `${out}\n[Error: ${result.error}]`;
    return out;
  }
}

registerCustomOp(ChickenInterpreter, {
  name: NAME,
  module: 'Custom',
  description: 'Interprets Chicken — word-counting stack machine.',
  infoURL: 'https://esolangs.org/wiki/Chicken',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Mode', type: 'option', value: ['Code in input', 'Separate code and input'] },
    { name: 'Code', type: 'text', value: '' },
    { name: 'Max Steps', type: 'number', value: 100000 },
    { name: 'Strip null bytes', type: 'boolean', value: true },
  ],
  flowControl: false,
}, 'Esoteric Languages');

export default ChickenInterpreter;
