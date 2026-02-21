import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'Strings (Backend)';

class BackendStrings extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'strings';
    this.name = NAME;
    this.description = 'Extract printable strings from binary data.';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'Minimum Length', type: 'number', value: 4, min: 1, max: 1000 },
      { name: 'Encoding', type: 'option', value: ['ASCII', 'Unicode'] },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return {
      minLength: args[0] as number,
      encoding: (args[1] as string).toLowerCase(),
    };
  }
}

registerBackendOp(BackendStrings, {
  name: NAME,
  description: 'Extract printable strings from binary data.',
  infoURL: null,
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'Minimum Length', type: 'number', value: 4, min: 1, max: 1000 },
    { name: 'Encoding', type: 'option', value: ['ASCII', 'Unicode'] },
  ],
});
