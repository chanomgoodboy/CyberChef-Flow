import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'StegCracker (Backend)';

class BackendStegcracker extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'stegcracker';
    this.name = NAME;
    this.description = 'Brute-force steganography passphrases using StegCracker.';
    this.infoURL = 'https://github.com/Paradoxis/StegCracker';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'Wordlist Path', type: 'string', value: '/usr/share/wordlists/rockyou.txt' },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return {
      wordlist: args[0] as string,
    };
  }
}

registerBackendOp(BackendStegcracker, {
  name: NAME,
  description: 'Brute-force steganography passphrases using StegCracker.',
  infoURL: 'https://github.com/Paradoxis/StegCracker',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'Wordlist Path', type: 'string', value: '/usr/share/wordlists/rockyou.txt' },
  ],
});
