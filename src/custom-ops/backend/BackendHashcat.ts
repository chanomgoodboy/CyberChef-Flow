import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'Hashcat (Backend)';

const HASH_TYPES = [
  '0 - MD5',
  '100 - SHA1',
  '1400 - SHA256',
  '1700 - SHA512',
  '3200 - bcrypt',
  '1000 - NTLM',
  '5600 - NetNTLMv2',
  '500 - md5crypt',
  '1800 - sha512crypt',
  '17200 - PKZIP',
  '11600 - 7-Zip',
  '13600 - WinZip',
  '10500 - PDF 1.4-1.6',
  '9600 - Office 2013+',
  '13100 - Kerberos TGS',
  '18200 - Kerberos AS-REP',
  '22000 - WPA-PBKDF2',
  '13400 - KeePass',
  '3000 - LM',
  '1500 - DES(Unix)',
];

class BackendHashcat extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'hashcat';
    this.name = NAME;
    this.description = 'Crack password hashes using hashcat.';
    this.infoURL = 'https://hashcat.net/hashcat/';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Attack Mode', type: 'option', value: ['0 - Straight', '1 - Combination', '3 - Brute-force', '6 - Hybrid WL+Mask', '7 - Hybrid Mask+WL'] },
      { name: 'Hash Type', type: 'option', value: HASH_TYPES },
      { name: 'Wordlist Path', type: 'string', value: '/usr/share/wordlists/rockyou.txt' },
      { name: 'Rules', type: 'string', value: '' },
      { name: 'Timeout (seconds)', type: 'number', value: 300, min: 0, max: 3600 },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return {
      attackMode: parseInt(args[0] as string, 10) || 0,
      hashType: parseInt(args[1] as string, 10) || 0,
      wordlist: args[2] as string,
      rules: args[3] as string,
      timeout: args[4] as number,
    };
  }
}

registerBackendOp(BackendHashcat, {
  name: NAME,
  description: 'Crack password hashes using hashcat.',
  infoURL: 'https://hashcat.net/hashcat/',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Attack Mode', type: 'option', value: ['0 - Straight', '1 - Combination', '3 - Brute-force', '6 - Hybrid WL+Mask', '7 - Hybrid Mask+WL'] },
    { name: 'Hash Type', type: 'option', value: HASH_TYPES },
    { name: 'Wordlist Path', type: 'string', value: '/usr/share/wordlists/rockyou.txt' },
    { name: 'Rules', type: 'string', value: '' },
    { name: 'Timeout (seconds)', type: 'number', value: 300, min: 0, max: 3600 },
  ],
});
