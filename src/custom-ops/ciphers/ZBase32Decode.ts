import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Z-Base-32 Decode';

const ZBASE32 = 'ybndrfg8ejkmcpqxot1uwisza345h769';

// Build reverse lookup
const ZBASE32_DECODE = new Map<string, number>();
for (let i = 0; i < ZBASE32.length; i++) {
  ZBASE32_DECODE.set(ZBASE32[i], i);
}

class ZBase32Decode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decode z-base-32 encoded text back to original data. ' +
      'z-base-32 uses a human-oriented alphabet avoiding confusing characters.';
    this.infoURL = 'https://philzimmermann.com/docs/human-oriented-base-32-encoding.txt';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    if (!input) return '';
    const clean = input.toLowerCase().replace(/\s+/g, '');

    let bits = 0;
    let numBits = 0;
    const bytes: number[] = [];

    for (const ch of clean) {
      const val = ZBASE32_DECODE.get(ch);
      if (val === undefined) continue; // skip invalid
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

registerCustomOp(ZBase32Decode, {
  name: NAME,
  module: 'Custom',
  description: 'Z-Base-32 decode — decode human-oriented base32 encoding.',
  infoURL: 'https://philzimmermann.com/docs/human-oriented-base-32-encoding.txt',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default ZBase32Decode;
