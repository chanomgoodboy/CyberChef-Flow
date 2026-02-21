import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Cipher Disk Encode';

class CipherDiskEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encodes using a cipher disk (two concentric alphabets). The outer alphabet ' +
      'represents plaintext, the inner represents ciphertext, aligned at a given position.';
    this.infoURL = 'https://www.dcode.fr/cipher-disk';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Outer alphabet', type: 'string', value: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
      { name: 'Inner alphabet', type: 'string', value: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
      { name: 'Alignment (inner A aligns to)', type: 'string', value: 'D' },
    ];
  }

  run(input: string, args: any[]): string {
    const outer = ((args[0] as string) || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ').toUpperCase();
    const inner = ((args[1] as string) || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ').toUpperCase();
    const alignChar = ((args[2] as string) || 'D').toUpperCase()[0];

    // Find the shift: inner[0] aligns to outer[alignIdx]
    const alignIdx = outer.indexOf(alignChar);
    if (alignIdx < 0 || outer.length !== inner.length) return input;

    // Build map: outer letter → inner letter at same visual position
    const map: Record<string, string> = {};
    for (let i = 0; i < outer.length; i++) {
      map[outer[i]] = inner[(i - alignIdx + inner.length) % inner.length];
    }

    let result = '';
    for (const ch of input) {
      const upper = ch.toUpperCase();
      const mapped = map[upper];
      if (mapped) {
        result += ch === upper ? mapped : mapped.toLowerCase();
      } else {
        result += ch;
      }
    }
    return result;
  }
}

registerCustomOp(CipherDiskEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Cipher Disk encode — substitution using two concentric alphabets.',
  infoURL: 'https://www.dcode.fr/cipher-disk',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Outer alphabet', type: 'string', value: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
    { name: 'Inner alphabet', type: 'string', value: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
    { name: 'Alignment (inner A aligns to)', type: 'string', value: 'D' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default CipherDiskEncode;
