import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Gravity Falls Cipher Decode';

function caesar(ch: string, shift: number): string {
  const code = ch.charCodeAt(0);
  if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + shift + 26) % 26) + 65);
  if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + shift + 26) % 26) + 97);
  return ch;
}

function atbash(ch: string): string {
  const code = ch.charCodeAt(0);
  if (code >= 65 && code <= 90) return String.fromCharCode(90 - (code - 65));
  if (code >= 97 && code <= 122) return String.fromCharCode(122 - (code - 97));
  return ch;
}

class GravityFallsDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes Gravity Falls ciphers. ' +
      'Caesar-3: shift back by 3. Atbash: self-reciprocal. ' +
      'Combined: Atbash then Caesar-(-3).';
    this.infoURL = 'https://www.dcode.fr/gravity-falls-bill-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Alphabet',
        type: 'option',
        value: ['Caesar-3 (Season 1)', 'Atbash (Season 2)', 'Combined (Author)'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const mode = (args[0] as string) || 'Caesar-3 (Season 1)';

    let result = '';
    for (const ch of input) {
      if (mode === 'Caesar-3 (Season 1)') {
        result += caesar(ch, -3);
      } else if (mode === 'Atbash (Season 2)') {
        result += atbash(ch); // self-reciprocal
      } else {
        // Combined decode: Atbash then Caesar-(-3)
        result += caesar(atbash(ch), -3);
      }
    }
    return result;
  }
}

registerCustomOp(GravityFallsDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Gravity Falls Cipher decode — reverse Caesar-3 / Atbash / Combined.',
  infoURL: 'https://www.dcode.fr/gravity-falls-bill-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Alphabet', type: 'option', value: ['Caesar-3 (Season 1)', 'Atbash (Season 2)', 'Combined (Author)'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default GravityFallsDecode;
