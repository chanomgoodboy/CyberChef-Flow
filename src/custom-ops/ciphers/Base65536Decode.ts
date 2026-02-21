import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { base65536decode } from '../_lib/base65536';

const NAME = 'Base65536 Decode';

class Base65536Decode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decode Base65536-encoded text back to the original data. ' +
      'Each Unicode character from the Supplementary Multilingual Plane decodes to two bytes.';
    this.infoURL = 'https://github.com/qntm/base65536';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    if (!input) return '';
    const bytes = base65536decode(input);
    return new TextDecoder().decode(bytes);
  }
}

registerCustomOp(Base65536Decode, {
  name: NAME,
  module: 'Custom',
  description: 'Base65536 decode — unpack Unicode characters back to original bytes.',
  infoURL: 'https://github.com/qntm/base65536',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default Base65536Decode;
