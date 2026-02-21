import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'Pngcheck (Backend)';

class BackendPngcheck extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'pngcheck';
    this.name = NAME;
    this.description = 'Verify and display info about PNG files using pngcheck.';
    this.infoURL = 'http://www.libpng.org/pub/png/apps/pngcheck.html';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'Verbose', type: 'boolean', value: true },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return {
      verbose: args[0] as boolean,
    };
  }
}

registerBackendOp(BackendPngcheck, {
  name: NAME,
  description: 'Verify and display info about PNG files using pngcheck.',
  infoURL: 'http://www.libpng.org/pub/png/apps/pngcheck.html',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'Verbose', type: 'boolean', value: true },
  ],
});
