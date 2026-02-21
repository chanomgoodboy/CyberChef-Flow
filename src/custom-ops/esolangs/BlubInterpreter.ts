import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { executeBrainfuck, formatMemoryDump } from '../_lib/brainfuck';

const NAME = 'Blub! Interpreter';

/** Translate Blub! to Brainfuck */
function blubToBF(source: string): string {
  const tokens = source.match(/Blub[.!?]/gi);
  if (!tokens || tokens.length % 2 !== 0) return '';

  let bf = '';
  for (let i = 0; i < tokens.length; i += 2) {
    const a = tokens[i].charAt(4);
    const b = tokens[i + 1].charAt(4);
    const pair = a + b;
    switch (pair) {
      case '.?': bf += '>'; break;
      case '?.': bf += '<'; break;
      case '..': bf += '+'; break;
      case '!!': bf += '-'; break;
      case '!.': bf += '.'; break;
      case '.!': bf += ','; break;
      case '!?': bf += '['; break;
      case '?!': bf += ']'; break;
    }
  }
  return bf;
}

class BlubInterpreter extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Interprets Blub! code — a Brainfuck variant using Blub./Blub!/Blub? token pairs.';
    this.infoURL = 'https://esolangs.org/wiki/Blub';
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

    const bf = blubToBF(program);
    if (!bf) return '[Error: No valid Blub! token pairs found]';

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

registerCustomOp(BlubInterpreter, {
  name: NAME,
  module: 'Custom',
  description: 'Interprets Blub! — fish-themed Brainfuck variant.',
  infoURL: 'https://esolangs.org/wiki/Blub',
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

export default BlubInterpreter;
