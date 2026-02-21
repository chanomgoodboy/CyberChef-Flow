import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { executeBrainfuck, formatMemoryDump } from '../_lib/brainfuck';

const NAME = 'Pikalang Interpreter';

/** Greedy-tokenize Pikalang to Brainfuck */
function pikalangToBF(source: string): string {
  // Sort keywords longest-first for greedy matching
  const keywords: [string, string][] = [
    ['pikachu', '.'],
    ['pikapi', ','],
    ['pichu', '-'],
    ['pipi', '+'],
    ['pika', '['],
    ['chu', ']'],
    ['pi', '>'],
    ['ka', '<'],
  ];

  let bf = '';
  let i = 0;
  const lower = source.toLowerCase();

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
    if (!matched) i++; // skip non-keyword characters
  }
  return bf;
}

class PikalangInterpreter extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Interprets Pikalang — a Pokemon-themed Brainfuck variant using pikachu, pikapi, pipi, pichu, pi, ka, pika, chu keywords.';
    this.infoURL = 'https://esolangs.org/wiki/Pikalang';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Mode', type: 'option', value: ['Code in input', 'Separate code and input'] },
      { name: 'Code', type: 'text', value: '' },
      { name: 'Max Steps', type: 'number', value: 100000 },
      { name: 'Strip null bytes', type: 'boolean', value: true },
      { name: 'Output', type: 'option', value: ['Text', 'Text + Memory dump', 'Memory dump only'] },
    ];
  }

  run(input: string, args: any[]): string {
    const mode = args[0] as string;
    const code = args[1] as string;
    const maxSteps = args[2] as number;
    const stripNulls = args[3] !== false;
    const outputMode = (args[4] as string) || 'Text';

    let program: string, stdin: string;
    if (mode === 'Separate code and input') {
      program = code;
      stdin = input;
    } else {
      program = input;
      stdin = '';
    }

    const bf = pikalangToBF(program);
    if (!bf) return '[Error: No valid Pikalang keywords found]';

    const wantDump = outputMode !== 'Text';
    const result = executeBrainfuck(bf, stdin, { maxSteps, dumpMemory: wantDump });
    let out = stripNulls ? result.output.replace(/\x00/g, '') : result.output;
    if (result.error) out += `\n[Error: ${result.error}]`;

    if (outputMode === 'Memory dump only') {
      return result.memory ? formatMemoryDump(result.memory, result.pointer ?? 0) : out;
    }
    if (outputMode === 'Text + Memory dump' && result.memory) {
      return out + '\n\n' + formatMemoryDump(result.memory, result.pointer ?? 0);
    }
    return out;
  }
}

registerCustomOp(PikalangInterpreter, {
  name: NAME,
  module: 'Custom',
  description: 'Interprets Pikalang — Pokemon-themed Brainfuck variant.',
  infoURL: 'https://esolangs.org/wiki/Pikalang',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Mode', type: 'option', value: ['Code in input', 'Separate code and input'] },
    { name: 'Code', type: 'text', value: '' },
    { name: 'Max Steps', type: 'number', value: 100000 },
    { name: 'Strip null bytes', type: 'boolean', value: true },
    { name: 'Output', type: 'option', value: ['Text', 'Text + Memory dump', 'Memory dump only'] },
  ],
  flowControl: false,
}, 'Esoteric Languages');

export default PikalangInterpreter;
