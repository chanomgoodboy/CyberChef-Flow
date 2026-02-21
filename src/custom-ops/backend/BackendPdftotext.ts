import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'PDF to Text (Backend)';

class BackendPdftotext extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'pdftotext';
    this.name = NAME;
    this.description = 'Extract text content from PDF files.';
    this.infoURL = 'https://www.xpdfreader.com/pdftotext-man.html';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'Preserve Layout', type: 'boolean', value: false },
      { name: 'Pages (e.g. 1-5)', type: 'string', value: '' },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return {
      layout: args[0] as boolean,
      pages: (args[1] as string) || undefined,
    };
  }
}

registerBackendOp(BackendPdftotext, {
  name: NAME,
  description: 'Extract text content from PDF files.',
  infoURL: 'https://www.xpdfreader.com/pdftotext-man.html',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'Preserve Layout', type: 'boolean', value: false },
    { name: 'Pages (e.g. 1-5)', type: 'string', value: '' },
  ],
});
