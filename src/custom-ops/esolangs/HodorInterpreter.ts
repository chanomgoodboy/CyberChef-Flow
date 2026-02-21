import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { executeBrainfuck, formatMemoryDump } from '../_lib/brainfuck';

const NAME = 'Hodor Interpreter';

/** Translate Hodor to Brainfuck using case-sensitive variants */
function hodorToBF(source: string): string {
  // Tokenize: extract Hodor-like words with their punctuation
  const tokens = source.match(/[Hh][Oo][Dd][Oo][Rr][!?.]*|HODOR[!?.]/g);
  if (!tokens) return '';

  const map: Record<string, string> = {
    'hodor!': '>',
    'Hodor!': '<',
    'hodor?': '+',
    'Hodor?': '-',
    'hodor.': '.',
    'Hodor.': ',',
    'HODOR!': '[',
    'HODOR?': ']',
  };

  let bf = '';
  for (const token of tokens) {
    if (map[token]) bf += map[token];
  }
  return bf;
}

class HodorInterpreter extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Interprets Hodor — a Game of Thrones-themed Brainfuck variant. Commands: hodor!(>), Hodor!(<), hodor?(+), Hodor?(-), hodor.(.), Hodor.(,), HODOR!([), HODOR?(]).';
    this.infoURL = 'https://esolangs.org/wiki/Hodor';
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

    const bf = hodorToBF(program);
    if (!bf) return '[Error: No valid Hodor commands found (use hodor!/Hodor!/hodor?/Hodor?/hodor./Hodor./HODOR!/HODOR?)]';

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

registerCustomOp(HodorInterpreter, {
  name: NAME,
  module: 'Custom',
  description: 'Interprets Hodor — Game of Thrones Brainfuck variant.',
  infoURL: 'https://esolangs.org/wiki/Hodor',
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

export default HodorInterpreter;
