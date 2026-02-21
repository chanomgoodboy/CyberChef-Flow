import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Base100 Decode';

class Base100Decode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Base100 (Emoji encoding) decodes each emoji back to the original byte. ' +
      'Reverses the U+1F4A0-based emoji encoding.';
    this.infoURL = 'https://www.dcode.fr/base-100';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    const bytes: number[] = [];
    for (const ch of input) {
      const cp = ch.codePointAt(0)!;
      // Base100 (AdamNiederer): emoji codepoint → byte
      // Reverse of: cp = 0x1F000 + ((((b+55)>>6)+143-0x80)<<6) + (((b+55)&0x3F)+128-0x80)
      // = 0x1F000 + ((b+55)>>6)<<6 + 63<<6 + (b+55)&0x3F
      // Simplified: offset = cp - 0x1F000; byte2 = (offset>>6)+0x80; byte3 = (offset&0x3F)+0x80
      // b = (byte2 - 143) * 64 + (byte3 - 128) - 55
      if (cp >= 0x1F000 && cp <= 0x1F6FF) {
        const offset = cp - 0x1F000;
        const byte2 = (offset >> 6) + 0x80;
        const byte3 = (offset & 0x3F) + 0x80;
        const b = (byte2 - 143) * 64 + (byte3 - 128) - 55;
        if (b >= 0 && b <= 255) {
          bytes.push(b);
        }
      }
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
  }
}

registerCustomOp(Base100Decode, {
  name: NAME,
  module: 'Custom',
  description: 'Base100 decode — convert emojis back to original text.',
  infoURL: 'https://www.dcode.fr/base-100',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default Base100Decode;
