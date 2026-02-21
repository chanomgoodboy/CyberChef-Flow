import { BackendOperation, registerBackendOp } from './_base';

const NAME = '7-Zip Extract (Backend)';

class Backend7z extends BackendOperation {
  constructor() {
    super();
    this.toolName = '7z';
    this.name = NAME;
    this.description = 'Extract 7z, zip, rar, tar, gz, bz2, xz and other archives using 7-Zip.';
    this.infoURL = 'https://www.7-zip.org/';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'Password', type: 'string', value: '' },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return {
      password: args[0] as string,
    };
  }
}

registerBackendOp(Backend7z, {
  name: NAME,
  description: 'Extract 7z, zip, rar, tar, gz, bz2, xz and other archives using 7-Zip.',
  infoURL: 'https://www.7-zip.org/',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'Password', type: 'string', value: '' },
  ],
});
