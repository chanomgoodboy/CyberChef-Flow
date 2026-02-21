import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Deadfish Interpreter';

class DeadfishInterpreter extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Interprets Deadfish — 4 commands: i(increment), d(decrement), s(square), o(output as ASCII char). Accumulator resets to 0 if it reaches -1 or 256.';
    this.infoURL = 'https://esolangs.org/wiki/Deadfish';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Output Mode', type: 'option', value: ['Characters (o = char)', 'Numbers (o = decimal)'] },
    ];
  }

  run(input: string, args: any[]): string {
    const numericMode = (args[0] as string).startsWith('Numbers');
    let acc = 0;
    let out = '';

    for (const ch of input) {
      switch (ch) {
        case 'i': acc++; break;
        case 'd': acc--; break;
        case 's': acc = acc * acc; break;
        case 'o':
          if (numericMode) {
            out += acc + ' ';
          } else {
            out += String.fromCharCode(acc & 0xffff);
          }
          break;
      }
      if (acc === -1 || acc === 256) acc = 0;
    }

    return numericMode ? out.trimEnd() : out;
  }
}

registerCustomOp(DeadfishInterpreter, {
  name: NAME,
  module: 'Custom',
  description: 'Interprets Deadfish (i/d/s/o with accumulator reset at -1 and 256).',
  infoURL: 'https://esolangs.org/wiki/Deadfish',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Output Mode', type: 'option', value: ['Characters (o = char)', 'Numbers (o = decimal)'] },
  ],
  flowControl: false,
}, 'Esoteric Languages');

export default DeadfishInterpreter;
