import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'Zsteg (Backend)';

class BackendZsteg extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'zsteg';
    this.name = NAME;
    this.description = 'Detect steganography in PNG/BMP files using zsteg.';
    this.infoURL = 'https://github.com/zed-0xff/zsteg';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'Bits', type: 'string', value: '', hint: 'e.g. 1,2,3 (empty = all)' },
      { name: 'Channels', type: 'string', value: '', hint: 'e.g. r,g,b,a (empty = all)' },
      { name: 'Order', type: 'option', value: ['auto', 'lsb', 'msb'] },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return {
      bits: args[0] as string,
      channels: args[1] as string,
      order: args[2] as string,
    };
  }
}

registerBackendOp(BackendZsteg, {
  name: NAME,
  description: 'Detect steganography in PNG/BMP files using zsteg.',
  infoURL: 'https://github.com/zed-0xff/zsteg',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'Bits', type: 'string', value: '', hint: 'e.g. 1,2,3 (empty = all)' },
    { name: 'Channels', type: 'string', value: '', hint: 'e.g. r,g,b,a (empty = all)' },
    { name: 'Order', type: 'option', value: ['auto', 'lsb', 'msb'] },
  ],
});
