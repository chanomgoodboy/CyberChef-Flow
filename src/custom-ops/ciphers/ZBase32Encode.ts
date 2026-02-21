import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Z-Base-32 Encode';

// z-base-32 alphabet: human-oriented, avoids confusing chars
const ZBASE32 = 'ybndrfg8ejkmcpqxot1uwisza345h769';

class ZBase32Encode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encode data using z-base-32, a human-oriented base32 encoding that uses an alphabet ' +
      'designed to be easy to read and type. Avoids confusing characters like 0/O and 1/l.';
    this.infoURL = 'https://philzimmermann.com/docs/human-oriented-base-32-encoding.txt';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    if (!input) return '';
    const bytes = new TextEncoder().encode(input);

    let bits = 0;
    let numBits = 0;
    let result = '';

    for (const byte of bytes) {
      bits = (bits << 8) | byte;
      numBits += 8;
      while (numBits >= 5) {
        numBits -= 5;
        result += ZBASE32[(bits >> numBits) & 0x1F];
      }
    }

    // Handle remaining bits (pad with zeros on the right)
    if (numBits > 0) {
      result += ZBASE32[(bits << (5 - numBits)) & 0x1F];
    }

    return result;
  }
}

registerCustomOp(ZBase32Encode, {
  name: NAME,
  module: 'Custom',
  description: 'Z-Base-32 encode — human-oriented base32 encoding.',
  infoURL: 'https://philzimmermann.com/docs/human-oriented-base-32-encoding.txt',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default ZBase32Encode;
