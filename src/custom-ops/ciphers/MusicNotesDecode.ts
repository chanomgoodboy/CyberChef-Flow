import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Music Notes Decode';

const NOTES_SI = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'];
const NOTES_TI = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'TI'];

class MusicNotesDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts solfege music notes back to letters. ' +
      'Do=A, Re=B, Mi=C, Fa=D, Sol=E, La=F, Si/Ti=G. ' +
      'Ambiguous: each note maps to the first matching letter (octave 1).';
    this.infoURL = 'https://www.dcode.fr/music-notes-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Variant',
        type: 'option',
        value: ['Si', 'Ti'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const variant = (args[0] as string) || 'Si';
    const notes = variant === 'Ti' ? NOTES_TI : NOTES_SI;

    const tokens = input.split(/[\s,\-]+/).filter(Boolean);
    let result = '';
    for (const tok of tokens) {
      if (tok === '/') {
        result += ' ';
        continue;
      }
      const upper = tok.toUpperCase();
      const idx = notes.indexOf(upper);
      if (idx >= 0) {
        result += String.fromCharCode(65 + idx);
      } else {
        result += tok;
      }
    }
    return result;
  }
}

registerCustomOp(MusicNotesDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Music Notes decode — solfege notes back to letters.',
  infoURL: 'https://www.dcode.fr/music-notes-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Variant', type: 'option', value: ['Si', 'Ti'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default MusicNotesDecode;
