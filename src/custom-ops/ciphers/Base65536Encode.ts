import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { base65536encode } from '../_lib/base65536';

const NAME = 'Base65536 Encode';

class Base65536Encode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encode data using Base65536, which packs roughly 16 bits into each Unicode character. ' +
      'Each pair of input bytes maps to a single Unicode code point from the Supplementary ' +
      'Multilingual Plane, producing very compact encoded text.';
    this.infoURL = 'https://github.com/qntm/base65536';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    if (!input) return '';
    const bytes = new TextEncoder().encode(input);
    return base65536encode(bytes);
  }
}

registerCustomOp(Base65536Encode, {
  name: NAME,
  module: 'Custom',
  description: 'Base65536 encode — pack 2 bytes per Unicode character for compact encoding.',
  infoURL: 'https://github.com/qntm/base65536',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default Base65536Encode;
