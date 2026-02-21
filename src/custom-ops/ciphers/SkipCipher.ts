import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Skip Cipher';

class SkipCipher extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The Skip cipher (also called "every Nth letter") extracts every Nth character from the input, optionally starting at a given offset. Used as a simple steganographic/transposition technique.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Transposition_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Skip (N)', type: 'number', value: 2, min: 1 },
      { name: 'Start offset', type: 'number', value: 0, min: 0 },
    ];
  }

  run(input: string, args: any[]): string {
    const skip = Math.max(1, (args[0] as number) || 2);
    const offset = Math.max(0, (args[1] as number) || 0);

    let result = '';
    for (let i = offset; i < input.length; i += skip) {
      result += input[i];
    }
    return result;
  }
}

registerCustomOp(SkipCipher, {
  name: NAME,
  module: 'Custom',
  description: 'Skip cipher — extract every Nth character.',
  infoURL: 'https://en.wikipedia.org/wiki/Transposition_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Skip (N)', type: 'number', value: 2, min: 1 },
    { name: 'Start offset', type: 'number', value: 0, min: 0 },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default SkipCipher;
