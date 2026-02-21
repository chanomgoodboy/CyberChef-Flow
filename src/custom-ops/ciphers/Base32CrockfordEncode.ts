import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Base32 Crockford Encode';

// Crockford's Base32 alphabet: 0-9 A-Z excluding I, L, O, U
const CROCKFORD32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

class Base32CrockfordEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encode data using Crockford\'s Base32 encoding. Uses an alphabet of 0-9 and A-Z, ' +
      'excluding I, L, O, U to avoid ambiguity. Case-insensitive decoding.';
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

    if (mode === 'Number') {
      // Encode a decimal number
      let n = parseInt(input.trim(), 10);
      if (isNaN(n) || n < 0) throw new Error('Invalid non-negative integer');
      if (n === 0) return '0';
      let result = '';
      while (n > 0) {
        result = CROCKFORD32[n % 32] + result;
        n = Math.floor(n / 32);
      }
      return result;
    }

    // Text mode: encode bytes
    const bytes = new TextEncoder().encode(input);
    let bits = 0;
    let numBits = 0;
    let result = '';

    for (const byte of bytes) {
      bits = (bits << 8) | byte;
      numBits += 8;
      while (numBits >= 5) {
        numBits -= 5;
        result += CROCKFORD32[(bits >> numBits) & 0x1F];
      }
    }

    if (numBits > 0) {
      result += CROCKFORD32[(bits << (5 - numBits)) & 0x1F];
    }

    return result;
  }
}

registerCustomOp(Base32CrockfordEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Crockford\'s Base32 encode — unambiguous base32 encoding.',
  infoURL: 'https://www.crockford.com/base32.html',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Mode', type: 'option', value: ['Text', 'Number'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default Base32CrockfordEncode;
