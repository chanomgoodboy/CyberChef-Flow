import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'File Type (Backend)';

class BackendFile extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'file';
    this.name = NAME;
    this.description = 'Identify file type via magic bytes using the file command.';
    this.infoURL = 'https://man7.org/linux/man-pages/man1/file.1.html';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'MIME Output', type: 'boolean', value: false },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return { mime: args[0] as boolean };
  }
}

registerBackendOp(BackendFile, {
  name: NAME,
  description: 'Identify file type via magic bytes using the file command.',
  infoURL: 'https://man7.org/linux/man-pages/man1/file.1.html',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'MIME Output', type: 'boolean', value: false },
  ],
});
