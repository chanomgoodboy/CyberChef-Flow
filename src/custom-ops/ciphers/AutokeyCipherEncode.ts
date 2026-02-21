import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { ALPHABET, mod } from '../_lib/alphabet';

const NAME = 'Autokey Cipher Encode';

class AutokeyCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The Autokey (Autoclave) cipher is a polyalphabetic cipher where the key is extended with the plaintext itself. C = (P + K) mod 26.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Autokey_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Key', type: 'string', value: 'QUEENLY' },
    ];
  }

  run(input: string, args: any[]): string {
    const key = ((args[0] as string) || 'QUEENLY').toUpperCase().replace(/[^A-Z]/g, '');
    if (!key) return input;

    // Key stream = key + plaintext letters
    const keyStream: number[] = [...key].map((c) => ALPHABET.indexOf(c));
    let result = '';
    let plainIdx = 0;

    for (const ch of input) {
      const upper = ch.toUpperCase();
      const idx = ALPHABET.indexOf(upper);
      if (idx < 0) {
        result += ch;
        continue;
      }
      const k = keyStream[plainIdx];
      const outIdx = mod(idx + k, 26);
      const outCh = ALPHABET[outIdx];
      result += ch === upper ? outCh : outCh.toLowerCase();
      // Extend key stream with plaintext letter
      keyStream.push(idx);
      plainIdx++;
    }
    return result;
  }
}

registerCustomOp(AutokeyCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Autokey cipher encode — Vigenere with plaintext extending the key.',
  infoURL: 'https://en.wikipedia.org/wiki/Autokey_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Key', type: 'string', value: 'QUEENLY' }],
  flowControl: false,
}, 'Classical Ciphers');

export default AutokeyCipherEncode;
