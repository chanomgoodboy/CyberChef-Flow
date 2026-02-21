import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { executeBrainfuck, formatMemoryDump } from '../_lib/brainfuck';

const NAME = 'Binaryfuck Interpreter';

/** Translate Binaryfuck (3-bit groups) to Brainfuck */
function binaryfuckToBF(source: string): string {
  const bits = source.replace(/\s+/g, '');
  if (!/^[01]+$/.test(bits) || bits.length % 3 !== 0) return '';

  const map: Record<string, string> = {
    '000': '>', '001': '<', '010': '+', '011': '-',
    '100': '.', '101': ',', '110': '[', '111': ']',
  };

  let bf = '';
  for (let i = 0; i < bits.length; i += 3) {
    bf += map[bits.slice(i, i + 3)] ?? '';
  }
  return bf;
}

class BinaryfuckInterpreter extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Interprets Binaryfuck — Brainfuck encoded as 3-bit binary groups (000=>, 001=<, 010=+, 011=-, 100=., 101=,, 110=[, 111=]).';
    this.infoURL = 'https://esolangs.org/wiki/Binaryfuck';
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

    const bf = binaryfuckToBF(program);
    if (!bf) return '[Error: Input is not valid Binaryfuck (need binary digits in groups of 3)]';

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

registerCustomOp(BinaryfuckInterpreter, {
  name: NAME,
  module: 'Custom',
  description: 'Interprets Binaryfuck — 3-bit binary-encoded Brainfuck.',
  infoURL: 'https://esolangs.org/wiki/Binaryfuck',
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

export default BinaryfuckInterpreter;
