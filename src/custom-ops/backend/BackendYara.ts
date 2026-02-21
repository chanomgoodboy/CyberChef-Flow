import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'YARA Scan (Backend)';

class BackendYara extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'yara';
    this.name = NAME;
    this.description = 'Scan files with YARA rules for pattern matching and malware detection.';
    this.infoURL = 'https://yara.readthedocs.io/';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'YARA Rules', type: 'text', value: 'rule example {\n  strings:\n    $a = "flag"\n  condition:\n    $a\n}' },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return { rules: args[0] as string };
  }
}

registerBackendOp(BackendYara, {
  name: NAME,
  description: 'Scan files with YARA rules for pattern matching and malware detection.',
  infoURL: 'https://yara.readthedocs.io/',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'YARA Rules', type: 'text', value: 'rule example {\n  strings:\n    $a = "flag"\n  condition:\n    $a\n}' },
  ],
});
