import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'PDF Info (Backend)';

class BackendPdfinfo extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'pdfinfo';
    this.name = NAME;
    this.description = 'Display PDF document metadata and properties.';
    this.infoURL = 'https://poppler.freedesktop.org/';
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

registerBackendOp(BackendPdfinfo, {
  name: NAME,
  description: 'Display PDF document metadata and properties.',
  infoURL: 'https://poppler.freedesktop.org/',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'Password', type: 'string', value: '' },
  ],
});
