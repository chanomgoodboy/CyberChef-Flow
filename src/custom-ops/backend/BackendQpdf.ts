import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'QPDF (Backend)';

class BackendQpdf extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'qpdf';
    this.name = NAME;
    this.description = 'Decrypt, linearize, or check PDF files using QPDF.';
    this.infoURL = 'https://qpdf.readthedocs.io/';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'Mode', type: 'option', value: ['Decrypt', 'Linearize', 'Check'] },
      { name: 'Password', type: 'string', value: '' },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return {
      mode: (args[0] as string).toLowerCase(),
      password: args[1] as string,
    };
  }
}

registerBackendOp(BackendQpdf, {
  name: NAME,
  description: 'Decrypt, linearize, or check PDF files using QPDF.',
  infoURL: 'https://qpdf.readthedocs.io/',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'Mode', type: 'option', value: ['Decrypt', 'Linearize', 'Check'] },
    { name: 'Password', type: 'string', value: '' },
  ],
});
