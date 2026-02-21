import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Gravity Falls Cipher Encode';

// Bill Cipher = Caesar-3 reversed (A→Z-3=W, etc.)
// Actually Bill Cipher: A↔Z, B↔Y, C↔X (Atbash) then shift 3
// Simpler: The show uses three ciphers:
// Season 1: Caesar-3 (A→D, B→E, ...)
// Season 2: Atbash (A→Z, B→Y, ...)
// Bill Cipher / Author's cipher: A1Z26 + Atbash + Caesar
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

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

class GravityFallsEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encodes using ciphers from the TV show Gravity Falls. ' +
      'Caesar-3: used in Season 1 end credits. ' +
      'Atbash: used in Season 2 end credits. ' +
      'Combined: Caesar-3 then Atbash (Author\'s cipher).';
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
        result += caesar(ch, 3);
      } else if (mode === 'Atbash (Season 2)') {
        result += atbash(ch);
      } else {
        // Combined: Caesar-3 then Atbash
        result += atbash(caesar(ch, 3));
      }
    }
    return result;
  }
}

registerCustomOp(GravityFallsEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Gravity Falls Cipher encode — Caesar-3 / Atbash / Combined.',
  infoURL: 'https://www.dcode.fr/gravity-falls-bill-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Alphabet', type: 'option', value: ['Caesar-3 (Season 1)', 'Atbash (Season 2)', 'Combined (Author)'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default GravityFallsEncode;
