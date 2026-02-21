import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Music Notes Encode';

const NOTES_SI = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
const NOTES_TI = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti'];

class MusicNotesEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts letter positions to solfege music notes. ' +
      'A=Do(1), B=Re(2), C=Mi(3), D=Fa(4), E=Sol(5), F=La(6), G=Si(7), ' +
      'then repeats: H=Do, I=Re, etc.';
    this.infoURL = 'https://www.dcode.fr/music-notes-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Variant',
        type: 'option',
        value: ['Si', 'Ti'],
      },
      {
        name: 'Separator',
        type: 'option',
        value: ['Space', 'Comma', 'Dash'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const variant = (args[0] as string) || 'Si';
    const sepName = (args[1] as string) || 'Space';
    const sep = sepName === 'Comma' ? ',' : sepName === 'Dash' ? '-' : ' ';
    const notes = variant === 'Ti' ? NOTES_TI : NOTES_SI;

    const parts: string[] = [];
    for (const ch of input) {
      const upper = ch.toUpperCase();
      const code = upper.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        const pos = code - 65; // 0-25
        parts.push(notes[pos % 7]);
      } else if (ch === ' ') {
        parts.push('/');
      }
    }
    return parts.join(sep);
  }
}

registerCustomOp(MusicNotesEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Music Notes encode — letters to solfege (Do Re Mi Fa Sol La Si).',
  infoURL: 'https://www.dcode.fr/music-notes-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Variant', type: 'option', value: ['Si', 'Ti'] },
    { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'Dash'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default MusicNotesEncode;
