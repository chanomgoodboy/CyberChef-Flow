import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { executeBrainfuck, formatMemoryDump } from '../_lib/brainfuck';

const NAME = 'Alphuck Interpreter';

/** Translate Alphuck to Brainfuck: only letters a,c,e,i,j,o,p,s are commands */
function alphuckToBF(source: string): string {
  const map: Record<string, string> = {
    a: '>', c: '<', e: '+', i: '-',
    j: '.', o: ',', p: '[', s: ']',
  };
  let bf = '';
  for (const ch of source) {
    if (map[ch]) bf += map[ch];
  }
  return bf;
}

class AlphuckInterpreter extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Interprets Alphuck — a Brainfuck variant using only letters: a(>), c(<), e(+), i(-), j(.), o(,), p([), s(]).';
    this.infoURL = 'https://esolangs.org/wiki/Alphuck';
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

    const bf = alphuckToBF(program);
    if (!bf) return '[Error: No valid Alphuck commands found (use a,c,e,i,j,o,p,s)]';

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

registerCustomOp(AlphuckInterpreter, {
  name: NAME,
  module: 'Custom',
  description: 'Interprets Alphuck — alphabetic Brainfuck variant.',
  infoURL: 'https://esolangs.org/wiki/Alphuck',
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

export default AlphuckInterpreter;
