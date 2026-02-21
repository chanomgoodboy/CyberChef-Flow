import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'Aircrack-ng (Backend)';

class BackendAircrack extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'aircrack-ng';
    this.name = NAME;
    this.description = 'Crack WPA/WEP keys from capture files using aircrack-ng.';
    this.infoURL = 'https://www.aircrack-ng.org/';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'Attack', type: 'option', value: ['WPA', 'WEP'] },
      { name: 'ESSID', type: 'string', value: '' },
      { name: 'Wordlist Path', type: 'string', value: '/usr/share/wordlists/rockyou.txt' },
      { name: 'BSSID', type: 'string', value: '' },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return {
      attack: (args[0] as string).toLowerCase(),
      essid: args[1] as string,
      wordlist: args[2] as string,
      bssid: args[3] as string,
    };
  }
}

registerBackendOp(BackendAircrack, {
  name: NAME,
  description: 'Crack WPA/WEP keys from capture files using aircrack-ng.',
  infoURL: 'https://www.aircrack-ng.org/',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'Attack', type: 'option', value: ['WPA', 'WEP'] },
    { name: 'ESSID', type: 'string', value: '' },
    { name: 'Wordlist Path', type: 'string', value: '/usr/share/wordlists/rockyou.txt' },
    { name: 'BSSID', type: 'string', value: '' },
  ],
});
