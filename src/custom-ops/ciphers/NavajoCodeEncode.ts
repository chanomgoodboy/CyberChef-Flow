import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { NAVAJO_TABLE } from '../_lib/navajo';

const NAME = 'Navajo Code Encode';

class NavajoCodeEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encodes text using the WWII Navajo Code Talker dictionary. ' +
      'Each letter is replaced by a Navajo word.';
    this.infoURL = 'https://www.dcode.fr/navajo-code';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Variant',
        type: 'option',
        value: ['First word', 'Random word'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const variant = (args[0] as string) || 'First word';
    const useRandom = variant === 'Random word';

    const parts: string[] = [];
    for (const ch of input) {
      const upper = ch.toUpperCase();
      const words = NAVAJO_TABLE[upper];
      if (words) {
        if (useRandom) {
          parts.push(words[Math.floor(Math.random() * words.length)]);
        } else {
          parts.push(words[0]);
        }
      } else if (ch === ' ') {
        parts.push('/');
      } else {
        parts.push(ch);
      }
    }
    return parts.join(' ');
  }
}

registerCustomOp(NavajoCodeEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Navajo Code encode — letters to Navajo Code Talker words.',
  infoURL: 'https://www.dcode.fr/navajo-code',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Variant', type: 'option', value: ['First word', 'Random word'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default NavajoCodeEncode;
