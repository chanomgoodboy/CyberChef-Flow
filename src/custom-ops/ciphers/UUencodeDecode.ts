import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { uudecode } from '../_lib/uuencode';

const NAME = 'UUdecode';

class UUencodeDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decode UUencoded data back to the original. ' +
      'Expects input with "begin" and "end" markers.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Uuencoding';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    if (!input.trim()) return '';
    const bytes = uudecode(input);
    return new TextDecoder().decode(bytes);
  }
}

registerCustomOp(UUencodeDecode, {
  name: NAME,
  module: 'Custom',
  description: 'UUdecode — decode Unix-to-Unix encoded data.',
  infoURL: 'https://en.wikipedia.org/wiki/Uuencoding',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default UUencodeDecode;
