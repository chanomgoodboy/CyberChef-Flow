import { BackendOperation, registerBackendOp } from './_base';

const NAME = 'TShark / Pcap (Backend)';

class BackendTshark extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'tshark';
    this.name = NAME;
    this.description = 'Analyze network packet captures (pcap/pcapng) using TShark.';
    this.infoURL = 'https://www.wireshark.org/docs/man-pages/tshark.html';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'Display Filter', type: 'string', value: '' },
      { name: 'Fields (comma-separated)', type: 'string', value: '' },
      { name: 'Max Packets (0=all)', type: 'number', value: 0 },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return {
      filter: (args[0] as string) || undefined,
      fields: (args[1] as string) || undefined,
      count: args[2] as number,
    };
  }
}

registerBackendOp(BackendTshark, {
  name: NAME,
  description: 'Analyze network packet captures (pcap/pcapng) using TShark.',
  infoURL: 'https://www.wireshark.org/docs/man-pages/tshark.html',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: [
    { name: 'Display Filter', type: 'string', value: '' },
    { name: 'Fields (comma-separated)', type: 'string', value: '' },
    { name: 'Max Packets (0=all)', type: 'number', value: 0 },
  ],
});
