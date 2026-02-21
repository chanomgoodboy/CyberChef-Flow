import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Nak Nak Encode';

class NakNakEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Each letter becomes N repetitions of a word (A=1×word, B=2×word...Z=26×word). ' +
      'Also known as Duckspeak cipher.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Word', type: 'string', value: 'nak' },
      { name: 'Separator', type: 'option', value: ['Space', 'Dash', 'None'] },
    ];
  }

  run(input: string, args: any[]): string {
    const word = (args[0] as string) || 'nak';
    const sepName = (args[1] as string) || 'Space';
    const innerSep = sepName === 'Dash' ? '-' : sepName === 'None' ? '' : ' ';

    const parts: string[] = [];
    for (const ch of input) {
      const code = ch.toUpperCase().charCodeAt(0);
      if (code >= 65 && code <= 90) {
        const n = code - 64;
        parts.push(Array(n).fill(word).join(innerSep));
      } else if (ch === ' ') {
        parts.push('/');
      }
    }
    return parts.join(' | ');
  }
}

registerCustomOp(NakNakEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Nak Nak (Duckspeak) encode — letters to word repetitions.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Word', type: 'string', value: 'nak' },
    { name: 'Separator', type: 'option', value: ['Space', 'Dash', 'None'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default NakNakEncode;
