import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { executeBrainfuck, formatMemoryDump } from '../_lib/brainfuck';

const NAME = 'Spoon Interpreter';

/** Translate Spoon (Huffman binary) to Brainfuck */
function spoonToBF(source: string): string {
  const bits = source.replace(/\s+/g, '');
  if (!/^[01]+$/.test(bits)) return '';

  // Spoon uses variable-length Huffman codes
  const codes: [string, string][] = [
    ['00100', '['],
    ['00101', ']'],
    ['00110', '.'],
    ['00111', ','],
    ['010', '>'],
    ['011', '<'],
    ['000', '-'],
    ['1', '+'],
  ];

  let bf = '';
  let i = 0;
  while (i < bits.length) {
    let matched = false;
    for (const [code, cmd] of codes) {
      if (bits.startsWith(code, i)) {
        bf += cmd;
        i += code.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      return ''; // invalid sequence
    }
  }
  return bf;
}

class SpoonInterpreter extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Interprets Spoon — Brainfuck encoded as Huffman-compressed binary (1=+, 000=-, 010=>, 011=<, 00100=[, 00101=], 00110=., 00111=,).';
    this.infoURL = 'https://esolangs.org/wiki/Spoon';
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

    const bf = spoonToBF(program);
    if (!bf) return '[Error: Input is not valid Spoon binary code]';

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

registerCustomOp(SpoonInterpreter, {
  name: NAME,
  module: 'Custom',
  description: 'Interprets Spoon — Huffman-compressed binary Brainfuck.',
  infoURL: 'https://esolangs.org/wiki/Spoon',
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

export default SpoonInterpreter;
