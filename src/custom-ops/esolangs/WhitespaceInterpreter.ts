import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { executeWhitespace } from '../_lib/whitespace';

const NAME = 'Whitespace Interpreter';

class WhitespaceInterpreter extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Interprets Whitespace — an esoteric language where only spaces, tabs, and linefeeds are significant. Stack-based VM with heap and subroutines.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Whitespace_(programming_language)';
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

    const result = executeWhitespace(program, stdin, { maxSteps });
    let out = stripNulls ? result.output.replace(/\x00/g, '') : result.output;
    if (result.error) return `${out}\n[Error: ${result.error}]`;
    return out;
  }
}

registerCustomOp(WhitespaceInterpreter, {
  name: NAME,
  module: 'Custom',
  description: 'Interprets Whitespace — only spaces, tabs, and linefeeds matter.',
  infoURL: 'https://en.wikipedia.org/wiki/Whitespace_(programming_language)',
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

export default WhitespaceInterpreter;
