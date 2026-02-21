import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { BASE91_TABLE, base91encode } from '../_lib/base91';

const NAME = 'Base91 Encode';

class Base91Encode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encode data using basE91, which represents binary data using 91 printable ASCII characters. ' +
      'More efficient than Base64 (avg ~23% smaller output for random data).';
    this.infoURL = 'https://base91.sourceforge.net/';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    const bytes = new TextEncoder().encode(input);
    return base91encode(bytes);
  }
}

registerCustomOp(Base91Encode, {
  name: NAME,
  module: 'Custom',
  description: 'Encode data to basE91 (91-char alphabet, more efficient than Base64).',
  infoURL: 'https://base91.sourceforge.net/',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default Base91Encode;
