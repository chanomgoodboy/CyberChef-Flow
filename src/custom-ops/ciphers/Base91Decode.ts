import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { base91decode } from '../_lib/base91';

const NAME = 'Base91 Decode';

class Base91Decode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decode basE91-encoded data back to the original bytes. ' +
      'basE91 uses 91 printable ASCII characters for efficient binary encoding.';
    this.infoURL = 'https://base91.sourceforge.net/';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    const bytes = base91decode(input);
    return new TextDecoder().decode(bytes);
  }
}

registerCustomOp(Base91Decode, {
  name: NAME,
  module: 'Custom',
  description: 'Decode basE91 back to original data.',
  infoURL: 'https://base91.sourceforge.net/',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default Base91Decode;
