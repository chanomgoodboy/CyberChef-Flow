import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { mod } from '../_lib/alphabet';

const NAME = 'Porta Cipher';

/**
 * The Porta cipher uses a half-alphabet substitution tableau.
 * It is reciprocal: the same operation encrypts and decrypts.
 *
 * The tableau has 13 rows (one per pair of key letters: AB, CD, ...YZ).
 * The first half of the alphabet (A-M) maps to the second half (N-Z) and vice versa.
 */
class PortaCipher extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The Porta cipher is a polyalphabetic cipher invented by Giovanni Battista della Porta. It uses a half-alphabet substitution and is reciprocal (encrypt = decrypt).';
    this.infoURL = 'https://en.wikipedia.org/wiki/Porta_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Key', type: 'string', value: 'FORTIFICATION' },
    ];
  }

  run(input: string, args: any[]): string {
    const key = ((args[0] as string) || 'FORTIFICATION').toUpperCase().replace(/[^A-Z]/g, '');
    if (key.length === 0) return input;

    let keyPos = 0;
    let result = '';

    for (const ch of input) {
      const upper = ch.toUpperCase();
      const p = upper.charCodeAt(0) - 65;
      if (p < 0 || p > 25) {
        result += ch;
        continue;
      }

      const k = key.charCodeAt(keyPos % key.length) - 65;
      const tableRow = Math.floor(k / 2); // 0-12

      let outIdx: number;
      if (p < 13) {
        // First half (A-M): shift into second half
        outIdx = mod(p + tableRow + 1, 13) + 13;
      } else {
        // Second half (N-Z): shift back into first half
        outIdx = mod(p - tableRow - 1, 13);
      }

      const outCh = String.fromCharCode(outIdx + 65);
      result += ch === upper ? outCh : outCh.toLowerCase();
      keyPos++;
    }

    return result;
  }
}

registerCustomOp(PortaCipher, {
  name: NAME,
  module: 'Custom',
  description: 'Porta cipher — reciprocal half-alphabet polyalphabetic.',
  infoURL: 'https://en.wikipedia.org/wiki/Porta_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Key', type: 'string', value: 'FORTIFICATION' }],
  flowControl: false,
}, 'Classical Ciphers');

export default PortaCipher;
