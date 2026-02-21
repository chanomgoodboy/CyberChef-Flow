import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'John the Ripper (Backend)';

const FORMATS = [
  'Auto-detect',
  'raw-md5', 'raw-sha1', 'raw-sha256', 'raw-sha512',
  'bcrypt', 'descrypt', 'md5crypt', 'sha512crypt', 'nt', 'lm',
  'PKZIP', 'ZIP', 'RAR5', '7z', 'PDF', 'Office', 'oldoffice',
  'keepass', 'ssh', 'gpg', 'wpapsk', 'krb5tgs', 'krb5asrep',
  'bitcoin-core', 'truecrypt', 'bitlocker', 'luks',
];

class BackendJohn extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'john';
    this.name = NAME;
    this.description = 'Crack password hashes using John the Ripper.';
    this.infoURL = 'https://www.openwall.com/john/';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Format', type: 'option', value: FORMATS },
      { name: 'Wordlist Path', type: 'string', value: '/usr/share/wordlists/rockyou.txt' },
      { name: 'Rules', type: 'string', value: '' },
    ];
  }

  protected buildToolArgs(args: any[]) {
    const fmt = args[0] as string;
    return {
      format: fmt === 'Auto-detect' ? '' : fmt,
      wordlist: args[1] as string,
      rules: args[2] as string,
    };
  }
}

registerBackendOp(BackendJohn, {
  name: NAME,
  description: 'Crack password hashes using John the Ripper.',
  infoURL: 'https://www.openwall.com/john/',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Format', type: 'option', value: FORMATS },
    { name: 'Wordlist Path', type: 'string', value: '/usr/share/wordlists/rockyou.txt' },
    { name: 'Rules', type: 'string', value: '' },
  ],
});
