import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Cipher Disk Decode';

class CipherDiskDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes cipher disk substitution by reversing the inner/outer alphabet mapping.';
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

    const alignIdx = outer.indexOf(alignChar);
    if (alignIdx < 0 || outer.length !== inner.length) return input;

    // Build reverse map: inner letter → outer letter
    const map: Record<string, string> = {};
    for (let i = 0; i < outer.length; i++) {
      const innerLetter = inner[(i - alignIdx + inner.length) % inner.length];
      map[innerLetter] = outer[i];
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

registerCustomOp(CipherDiskDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Cipher Disk decode — reverse concentric alphabet substitution.',
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

export default CipherDiskDecode;
