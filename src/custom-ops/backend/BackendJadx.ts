import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'JADX (Backend)';

class BackendJadx extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'jadx';
    this.name = NAME;
    this.description = 'Decompile Android APK/DEX to Java source using JADX.';
    this.infoURL = 'https://github.com/skylot/jadx';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'Threads', type: 'number', value: 4, min: 1, max: 32 },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return {
      threads: args[0] as number,
    };
  }
}

registerBackendOp(BackendJadx, {
  name: NAME,
  description: 'Decompile Android APK/DEX to Java source using JADX.',
  infoURL: 'https://github.com/skylot/jadx',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'Threads', type: 'number', value: 4, min: 1, max: 32 },
  ],
});
