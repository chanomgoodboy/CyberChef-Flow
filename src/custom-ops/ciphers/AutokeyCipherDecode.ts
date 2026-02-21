import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { ALPHABET, mod } from '../_lib/alphabet';

const NAME = 'Autokey Cipher Decode';

class AutokeyCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes the Autokey (Autoclave) cipher. The key is extended with the recovered plaintext.';
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
      if (plainIdx >= keyStream.length) {
        // This shouldn't happen because we extend below, but safety check
        break;
      }
      const k = keyStream[plainIdx];
      const outIdx = mod(idx - k, 26);
      const outCh = ALPHABET[outIdx];
      result += ch === upper ? outCh : outCh.toLowerCase();
      // Extend key with recovered plaintext letter
      keyStream.push(outIdx);
      plainIdx++;
    }
    return result;
  }
}

registerCustomOp(AutokeyCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Autokey cipher decode — reverse Vigenere with plaintext-extended key.',
  infoURL: 'https://en.wikipedia.org/wiki/Autokey_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Key', type: 'string', value: 'QUEENLY' }],
  flowControl: false,
}, 'Classical Ciphers');

export default AutokeyCipherDecode;
