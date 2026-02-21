import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'Stegseek (Backend)';

class BackendStegseek extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'stegseek';
    this.name = NAME;
    this.description = 'Crack steghide passphrases using stegseek with a wordlist.';
    this.infoURL = 'https://github.com/RickdeJager/stegseek';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'Wordlist Path', type: 'string', value: '/usr/share/wordlists/rockyou.txt' },
      { name: 'Passphrase', type: 'string', value: '' },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return {
      wordlist: args[0] as string,
      passphrase: args[1] as string,
    };
  }
}

registerBackendOp(BackendStegseek, {
  name: NAME,
  description: 'Crack steghide passphrases using stegseek with a wordlist.',
  infoURL: 'https://github.com/RickdeJager/stegseek',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'Wordlist Path', type: 'string', value: '/usr/share/wordlists/rockyou.txt' },
    { name: 'Passphrase', type: 'string', value: '' },
  ],
});
