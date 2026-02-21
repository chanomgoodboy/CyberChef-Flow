import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Base32 Crockford Decode';

const CROCKFORD32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

// Build decode map with canonical + aliases
const CROCKFORD_DECODE = new Map<string, number>();
for (let i = 0; i < CROCKFORD32.length; i++) {
  CROCKFORD_DECODE.set(CROCKFORD32[i], i);
  CROCKFORD_DECODE.set(CROCKFORD32[i].toLowerCase(), i);
}
// Alias: O/o → 0, I/i/L/l → 1
CROCKFORD_DECODE.set('O', 0);
CROCKFORD_DECODE.set('o', 0);
CROCKFORD_DECODE.set('I', 1);
CROCKFORD_DECODE.set('i', 1);
CROCKFORD_DECODE.set('L', 1);
CROCKFORD_DECODE.set('l', 1);

class Base32CrockfordDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decode Crockford\'s Base32 encoded text. Case-insensitive, with aliases: ' +
      'O→0, I/L→1 for error correction.';
    this.infoURL = 'https://www.crockford.com/base32.html';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Mode',
        type: 'option',
        value: ['Text', 'Number'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    if (!input) return '';
    const mode = (args[0] as string) || 'Text';
    const clean = input.replace(/[-\s]/g, ''); // strip hyphens and whitespace

    if (mode === 'Number') {
      let result = 0;
      for (const ch of clean) {
        const val = CROCKFORD_DECODE.get(ch);
        if (val === undefined) throw new Error(`Invalid Crockford Base32 character: "${ch}"`);
        result = result * 32 + val;
      }
      return result.toString();
    }

    // Text mode: decode to bytes
    let bits = 0;
    let numBits = 0;
    const bytes: number[] = [];

    for (const ch of clean) {
      const val = CROCKFORD_DECODE.get(ch);
      if (val === undefined) continue;
      bits = (bits << 5) | val;
      numBits += 5;
      if (numBits >= 8) {
        numBits -= 8;
        bytes.push((bits >> numBits) & 0xFF);
      }
    }

    return new TextDecoder().decode(new Uint8Array(bytes));
  }
}

registerCustomOp(Base32CrockfordDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Crockford\'s Base32 decode — case-insensitive with O→0, I/L→1 aliases.',
  infoURL: 'https://www.crockford.com/base32.html',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Mode', type: 'option', value: ['Text', 'Number'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default Base32CrockfordDecode;
