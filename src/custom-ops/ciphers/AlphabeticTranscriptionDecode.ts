import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { buildPhoneticReverse } from '../_lib/phoneticAlphabets';

const NAME = 'Alphabetic Transcription Decode';

class AlphabeticTranscriptionDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes phonetic alphabet words back to letters.';
    this.infoURL = 'https://www.dcode.fr/phonetic-alphabet';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'System',
        type: 'option',
        value: ['French', 'German', 'LAPD', 'Italian', 'Spanish'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const system = (args[0] as string) || 'French';
    const reverse = buildPhoneticReverse(system);

    const tokens = input.split(/\s+/).filter(Boolean);
    let result = '';
    for (const tok of tokens) {
      if (tok === '/') { result += ' '; continue; }
      const idx = reverse[tok.toUpperCase()];
      if (idx !== undefined) {
        result += String.fromCharCode(65 + idx);
      } else {
        result += tok;
      }
    }
    return result;
  }
}

registerCustomOp(AlphabeticTranscriptionDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Alphabetic Transcription decode — phonetic words to letters.',
  infoURL: 'https://www.dcode.fr/phonetic-alphabet',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'System', type: 'option', value: ['French', 'German', 'LAPD', 'Italian', 'Spanish'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default AlphabeticTranscriptionDecode;
