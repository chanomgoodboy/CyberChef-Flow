import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'APKTool (Backend)';

class BackendApktool extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'apktool';
    this.name = NAME;
    this.description = 'Decompile Android APK files using apktool.';
    this.infoURL = 'https://apktool.org/';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'No Sources', type: 'boolean', value: false },
      { name: 'No Resources', type: 'boolean', value: false },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return {
      noSources: args[0] as boolean,
      noResources: args[1] as boolean,
    };
  }
}

registerBackendOp(BackendApktool, {
  name: NAME,
  description: 'Decompile Android APK files using apktool.',
  infoURL: 'https://apktool.org/',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'No Sources', type: 'boolean', value: false },
    { name: 'No Resources', type: 'boolean', value: false },
  ],
});
