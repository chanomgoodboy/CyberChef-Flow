import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Malbolge Interpreter';

// ---------------------------------------------------------------------------
// Malbolge virtual machine
// Based on the reference implementation by Ben Olmstead ('98, public domain).
// Memory: 59049 (3^10) cells, values 0-59048.
// Registers: A (accumulator), C (code pointer), D (data pointer).
// ---------------------------------------------------------------------------

const MEM_SIZE = 59049; // 3^10

// xlat1: instruction decoding table (94 chars, maps position to instruction char)
const XLAT1 =
  '+b(29e*j1VMEKLyC})8&m#~W>qxdRp0wkrUo[D7,XTcA"lI' +
  '.v%{gJh4G\\-=O@5`_3i<?Z\';FNQuY]szf$!BS/|t:Pn6^Ha';

// xlat2: post-instruction encryption table (94 chars)
const XLAT2 =
  '5z]&gqtyfr$(we4{WP)H-Zn,[%\\3dL+Q;>U!pJS72FhOA1C' +
  'B6v^=I_0/8|jsb9m<.TVac`uY*MK\'X~xDl}REokN:#?G"i@';

// Valid instruction characters for program loading validation
const VALID_INSTRUCTIONS = 'ji*p</vo';

// The "crazy" operation (called "op" in the reference).
// Works on base-9 digits using a 9x9 lookup table applied across 5 nonary
// digit positions (9^0 through 9^4, since 9^5 = 59049).
const CRAZY_TABLE: readonly (readonly number[])[] = [
  [4, 3, 3, 1, 0, 0, 1, 0, 0],
  [4, 3, 5, 1, 0, 2, 1, 0, 2],
  [5, 5, 4, 2, 2, 1, 2, 2, 1],
  [4, 3, 3, 1, 0, 0, 7, 6, 6],
  [4, 3, 5, 1, 0, 2, 7, 6, 8],
  [5, 5, 4, 2, 2, 1, 8, 8, 7],
  [7, 6, 6, 7, 6, 6, 4, 3, 3],
  [7, 6, 8, 7, 6, 8, 4, 3, 5],
  [8, 8, 7, 8, 8, 7, 5, 5, 4],
];

const P9 = [1, 9, 81, 729, 6561] as const;

function crazy(a: number, d: number): number {
  let result = 0;
  for (let j = 0; j < 5; j++) {
    const da = Math.floor(a / P9[j]) % 9;
    const dd = Math.floor(d / P9[j]) % 9;
    result += CRAZY_TABLE[dd][da] * P9[j];
  }
  return result;
}

// Rotate right in ternary: move the least-significant trit to the most-
// significant position. Equivalent to: val / 3 + (val % 3) * 19683
// where 19683 = 3^9.
function rotateRight(val: number): number {
  return Math.floor(val / 3) + (val % 3) * 19683;
}

const MAX_OUTPUT = 10_000;

function executeMalbolge(
  program: string,
  stdin: string,
  maxSteps: number,
): { output: string; error?: string } {
  // Allocate memory
  const mem = new Uint16Array(MEM_SIZE);

  // Load program: skip whitespace, validate each character
  let loadPos = 0;
  for (let i = 0; i < program.length; i++) {
    const ch = program.charCodeAt(i);
    // Skip whitespace (space, tab, CR, LF, etc.)
    if (ch === 32 || ch === 9 || ch === 10 || ch === 13) continue;

    if (loadPos >= MEM_SIZE) {
      return { output: '', error: 'Program too long (exceeds 59049 cells)' };
    }

    // Validate: printable ASCII (33-126) must decode to a valid instruction
    if (ch > 32 && ch < 127) {
      const decoded = XLAT1[(ch - 33 + loadPos) % 94];
      if (VALID_INSTRUCTIONS.indexOf(decoded) === -1) {
        return {
          output: '',
          error: `Invalid character '${String.fromCharCode(ch)}' at position ${loadPos} (decodes to '${decoded}')`,
        };
      }
    }

    mem[loadPos] = ch;
    loadPos++;
  }

  if (loadPos === 0) {
    return { output: '', error: 'Empty program' };
  }

  // Fill remaining memory using the crazy operation
  for (let i = loadPos; i < MEM_SIZE; i++) {
    mem[i] = crazy(mem[i - 1], mem[i - 2]);
  }

  // Execute
  let a = 0;
  let c = 0;
  let d = 0;
  let stdinPos = 0;
  let output = '';
  let steps = 0;

  for (;;) {
    if (steps++ >= maxSteps) {
      return { output, error: `Execution limit reached (${maxSteps} steps)` };
    }

    const val = mem[c];

    // Values outside printable ASCII range are treated as NOPs
    if (val >= 33 && val <= 126) {
      const instr = XLAT1[(val - 33 + c) % 94];

      switch (instr) {
        case 'j': // set data pointer
          d = mem[d];
          break;

        case 'i': // set code pointer (jump)
          c = mem[d];
          break;

        case '*': // rotate right
          a = mem[d] = rotateRight(mem[d]);
          break;

        case 'p': // crazy operation
          a = mem[d] = crazy(a, mem[d]);
          break;

        case '<': // output
          if (output.length < MAX_OUTPUT) {
            output += String.fromCharCode(a % 256);
          } else if (output.length === MAX_OUTPUT) {
            output += '\n[Output truncated at ' + MAX_OUTPUT + ' characters]';
          }
          break;

        case '/': // input
          if (stdinPos < stdin.length) {
            a = stdin.charCodeAt(stdinPos++);
          } else {
            a = MEM_SIZE - 1; // 59048 = EOF
          }
          break;

        case 'v': // halt
          return { output };

        default:
          // 'o' and any other: NOP
          break;
      }

      // Encrypt the instruction at mem[c] using xlat2
      if (mem[c] >= 33 && mem[c] <= 126) {
        mem[c] = XLAT2.charCodeAt((mem[c] - 33) % 94);
      }
    }

    // Increment C and D with wraparound
    c = c === MEM_SIZE - 1 ? 0 : c + 1;
    d = d === MEM_SIZE - 1 ? 0 : d + 1;
  }
}

// ---------------------------------------------------------------------------
// CyberChefX operation wrapper
// ---------------------------------------------------------------------------

class MalbolgeInterpreter extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Interprets Malbolge — the notoriously difficult esoteric language designed by Ben Olmstead. ' +
      'A ternary virtual machine with 59049 memory cells, self-modifying code, and the "crazy" tritwise operation.';
    this.infoURL = 'https://esolangs.org/wiki/Malbolge';
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

    const result = executeMalbolge(program, stdin, maxSteps);
    let out = stripNulls ? result.output.replace(/\x00/g, '') : result.output;
    if (result.error) return `${out}\n[Error: ${result.error}]`;
    return out;
  }
}

registerCustomOp(MalbolgeInterpreter, {
  name: NAME,
  module: 'Custom',
  description: 'Interprets Malbolge — the notoriously difficult ternary VM language.',
  infoURL: 'https://esolangs.org/wiki/Malbolge',
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

export default MalbolgeInterpreter;
