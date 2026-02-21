import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { uuencode } from '../_lib/uuencode';

const NAME = 'UUencode';

class UUencodeEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encode data using Unix-to-Unix encoding (uuencode). ' +
      'Each group of 3 bytes becomes 4 printable ASCII characters. ' +
      'Output includes "begin" and "end" markers.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Uuencoding';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Filename',
        type: 'string',
        value: 'data',
      },
    ];
  }

  run(input: string, args: any[]): string {
    if (!input) return '';
    const filename = (args[0] as string) || 'data';
    const bytes = new TextEncoder().encode(input);
    return uuencode(bytes, filename);
  }
}

registerCustomOp(UUencodeEncode, {
  name: NAME,
  module: 'Custom',
  description: 'UUencode — Unix-to-Unix encoding for binary data.',
  infoURL: 'https://en.wikipedia.org/wiki/Uuencoding',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Filename', type: 'string', value: 'data' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default UUencodeEncode;
