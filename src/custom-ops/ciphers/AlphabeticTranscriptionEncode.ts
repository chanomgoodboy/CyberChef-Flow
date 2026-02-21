import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { PHONETIC_SYSTEMS } from '../_lib/phoneticAlphabets';

const NAME = 'Alphabetic Transcription Encode';

class AlphabeticTranscriptionEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Spells out letters using a phonetic alphabet system. ' +
      'French: A=Anatole, B=Berthe. German: A=Anton, B=Berta. ' +
      'LAPD: A=Adam, B=Boy. Italian: A=Ancona, B=Bologna.';
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
    const words = PHONETIC_SYSTEMS[system];
    if (!words) return input;

    const parts: string[] = [];
    for (const ch of input) {
      const code = ch.toUpperCase().charCodeAt(0);
      if (code >= 65 && code <= 90) {
        parts.push(words[code - 65]);
      } else if (ch === ' ') {
        parts.push('/');
      } else {
        parts.push(ch);
      }
    }
    return parts.join(' ');
  }
}

registerCustomOp(AlphabeticTranscriptionEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Alphabetic Transcription encode — letters to phonetic words.',
  infoURL: 'https://www.dcode.fr/phonetic-alphabet',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'System', type: 'option', value: ['French', 'German', 'LAPD', 'Italian', 'Spanish'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default AlphabeticTranscriptionEncode;
