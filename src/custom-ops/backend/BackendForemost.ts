import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'Foremost (Backend)';

class BackendForemost extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'foremost';
    this.name = NAME;
    this.description = 'Carve files from binary data using foremost.';
    this.infoURL = 'https://foremost.sourceforge.net/';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'File Types', type: 'string', value: '', hint: 'e.g. jpg,png,pdf (empty = all)' },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return {
      types: args[0] as string,
    };
  }
}

registerBackendOp(BackendForemost, {
  name: NAME,
  description: 'Carve files from binary data using foremost.',
  infoURL: 'https://foremost.sourceforge.net/',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'File Types', type: 'string', value: '', hint: 'e.g. jpg,png,pdf (empty = all)' },
  ],
});
