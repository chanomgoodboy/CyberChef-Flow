import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'Binwalk (Backend)';

class BackendBinwalk extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'binwalk';
    this.name = NAME;
    this.description = 'Carve embedded files or analyze entropy using binwalk. Extracts raw artifacts without decompressing archives.';
    this.infoURL = 'https://github.com/ReFirmLabs/binwalk';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'Mode', type: 'option', value: ['Extract', 'Entropy'] },
      { name: 'Additional Flags', type: 'string', value: '' },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return {
      mode: (args[0] as string).toLowerCase(),
      flags: args[1] as string,
    };
  }
}

registerBackendOp(BackendBinwalk, {
  name: NAME,
  description: 'Carve embedded files or analyze entropy using binwalk. Extracts raw artifacts without decompressing archives.',
  infoURL: 'https://github.com/ReFirmLabs/binwalk',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'Mode', type: 'option', value: ['Extract', 'Entropy'] },
    { name: 'Additional Flags', type: 'string', value: '' },
  ],
});
