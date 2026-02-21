import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { zwspDecodeText, zwspDetect } from '../_lib/zwsp';

const NAME = 'Zero-Width Space Decode';

class ZWSpaceDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Extracts hidden text from zero-width Unicode steganography. ' +
      'Detects and decodes messages hidden using ZWNJ (U+200C), ZWJ (U+200D), ' +
      'PDF (U+202C), and BOM (U+FEFF) characters.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Zero-width_space';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Output',
        type: 'option',
        value: ['Hidden text', 'Original text', 'Both'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const mode = (args[0] as string) ?? 'Hidden text';

    if (!zwspDetect(input)) {
      return mode === 'Original text' ? input : '(no zero-width steganography detected)';
    }

    const { originalText, hiddenText } = zwspDecodeText(input);

    switch (mode) {
      case 'Hidden text':
        return hiddenText;
      case 'Original text':
        return originalText;
      case 'Both':
        return `--- Original Text ---\n${originalText}\n\n--- Hidden Text ---\n${hiddenText}`;
      default:
        return hiddenText;
    }
  }
}

registerCustomOp(ZWSpaceDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Extract hidden text from zero-width Unicode steganography.',
  infoURL: 'https://en.wikipedia.org/wiki/Zero-width_space',
  inputType: 'string',
  outputType: 'string',
  args: [{
    name: 'Output',
    type: 'option',
    value: ['Hidden text', 'Original text', 'Both'],
  }],
  flowControl: false,
}, 'Steganography');

export default ZWSpaceDecode;
