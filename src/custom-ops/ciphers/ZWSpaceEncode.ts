import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { zwspEncodeText } from '../_lib/zwsp';

const NAME = 'Zero-Width Space Encode';

class ZWSpaceEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Hides a secret message within cover text using zero-width Unicode characters ' +
      '(ZWNJ U+200C, ZWJ U+200D, PDF U+202C, BOM U+FEFF). The output looks like ' +
      'normal text but contains invisible characters encoding the hidden message.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Zero-width_space';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Hidden Text', type: 'string', value: '' },
    ];
  }

  run(input: string, args: any[]): string {
    const hiddenText = (args[0] as string) ?? '';
    if (!hiddenText) return input;
    return zwspEncodeText(input, hiddenText);
  }
}

registerCustomOp(ZWSpaceEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Hide text inside cover text using zero-width Unicode characters.',
  infoURL: 'https://en.wikipedia.org/wiki/Zero-width_space',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Hidden Text', type: 'string', value: '' }],
  flowControl: false,
}, 'Steganography');

export default ZWSpaceEncode;
