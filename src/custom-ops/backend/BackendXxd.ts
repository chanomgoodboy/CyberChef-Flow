import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'Hex Dump / xxd (Backend)';

class BackendXxd extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'xxd';
    this.name = NAME;
    this.description = 'Hex dump with various output formats using xxd.';
    this.infoURL = 'https://linux.die.net/man/1/xxd';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'Mode', type: 'option', value: ['Hex', 'Binary', 'Plain', 'C Include'] },
      { name: 'Length (0=all)', type: 'number', value: 0 },
    ];
  }

  protected buildToolArgs(args: any[]) {
    const modeMap: Record<string, string> = { 'Hex': 'hex', 'Binary': 'binary', 'Plain': 'plain', 'C Include': 'c-include' };
    return {
      mode: modeMap[args[0] as string] ?? 'hex',
      length: args[1] as number,
    };
  }
}

registerBackendOp(BackendXxd, {
  name: NAME,
  description: 'Hex dump with various output formats using xxd.',
  infoURL: 'https://linux.die.net/man/1/xxd',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'Mode', type: 'option', value: ['Hex', 'Binary', 'Plain', 'C Include'] },
    { name: 'Length (0=all)', type: 'number', value: 0 },
  ],
});
