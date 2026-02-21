import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'Steghide (Backend)';

class BackendSteghide extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'steghide';
    this.name = NAME;
    this.description = 'Extract hidden data or show info from images/audio using steghide.';
    this.infoURL = 'https://steghide.sourceforge.net/';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'Mode', type: 'option', value: ['Extract', 'Info'] },
      { name: 'Passphrase', type: 'string', value: '' },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return {
      mode: (args[0] as string).toLowerCase(),
      passphrase: args[1] as string,
    };
  }
}

registerBackendOp(BackendSteghide, {
  name: NAME,
  description: 'Extract hidden data or show info from images/audio using steghide.',
  infoURL: 'https://steghide.sourceforge.net/',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'Mode', type: 'option', value: ['Extract', 'Info'] },
    { name: 'Passphrase', type: 'string', value: '' },
  ],
});
