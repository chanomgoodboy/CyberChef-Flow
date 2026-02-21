import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Base100 Encode';

class Base100Encode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Base100 (Emoji encoding) converts each byte of the input to an emoji ' +
      'character starting at U+1F4A0. Each input byte maps to a unique emoji.';
    this.infoURL = 'https://www.dcode.fr/base-100';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    let result = '';
    const bytes = new TextEncoder().encode(input);
    for (const b of bytes) {
      // Base100 (AdamNiederer): byte → 4-byte UTF-8 emoji
      // UTF-8 bytes: [0xF0, 0x9F, ((b+55)>>6)+143, ((b+55)&0x3F)+128]
      // Equivalent codepoint:
      const byte2 = ((b + 55) >> 6) + 143;
      const byte3 = ((b + 55) & 0x3F) + 128;
      const cp = 0x1F000 + ((byte2 - 0x80) << 6) + (byte3 - 0x80);
      result += String.fromCodePoint(cp);
    }
    return result;
  }
}

registerCustomOp(Base100Encode, {
  name: NAME,
  module: 'Custom',
  description: 'Base100 encode — convert each byte to an emoji (U+1F4A0 range).',
  infoURL: 'https://www.dcode.fr/base-100',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default Base100Encode;
