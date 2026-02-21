import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { executeBrainfuck, formatMemoryDump } from '../_lib/brainfuck';

const NAME = 'Ook! Interpreter';

/** Translate Ook! to Brainfuck */
function ookToBF(source: string): string {
  // Extract Ook tokens: "Ook." "Ook!" "Ook?"
  const tokens = source.match(/Ook[.!?]/g);
  if (!tokens || tokens.length % 2 !== 0) return '';

  let bf = '';
  for (let i = 0; i < tokens.length; i += 2) {
    const pair = tokens[i] + ' ' + tokens[i + 1];
    switch (pair) {
      case 'Ook. Ook?': bf += '>'; break;
      case 'Ook? Ook.': bf += '<'; break;
      case 'Ook. Ook.': bf += '+'; break;
      case 'Ook! Ook!': bf += '-'; break;
      case 'Ook! Ook.': bf += '.'; break;
      case 'Ook. Ook!': bf += ','; break;
      case 'Ook! Ook?': bf += '['; break;
      case 'Ook? Ook!': bf += ']'; break;
    }
  }
  return bf;
}

class OokInterpreter extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Interprets Ook! code — an esoteric language designed for orangutans. Translates to Brainfuck for execution.';
    this.infoURL = 'https://esolangs.org/wiki/Ook!';
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

    const bf = ookToBF(program);
    if (!bf) return '[Error: No valid Ook! token pairs found]';

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

registerCustomOp(OokInterpreter, {
  name: NAME,
  module: 'Custom',
  description: 'Interprets Ook! — orangutan-friendly Brainfuck variant.',
  infoURL: 'https://esolangs.org/wiki/Ook!',
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

export default OokInterpreter;
