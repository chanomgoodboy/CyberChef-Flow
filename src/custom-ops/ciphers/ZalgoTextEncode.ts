import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { zalgoEncode, type ZalgoIntensity } from '../_lib/zalgo';

const NAME = 'Zalgo Text Encode';

class ZalgoTextEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Add Zalgo combining diacritical marks to text, creating the "corrupted text" effect. ' +
      'Adds combining marks above, below, and through each character.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Zalgo_text';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Intensity',
        type: 'option',
        value: ['Normal', 'Mini', 'Max'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    if (!input) return '';
    const intensityStr = ((args[0] as string) || 'Normal').toLowerCase() as ZalgoIntensity;
    const intensity: ZalgoIntensity = intensityStr === 'mini' ? 'mini'
      : intensityStr === 'max' ? 'max' : 'normal';
    return zalgoEncode(input, intensity);
  }
}

registerCustomOp(ZalgoTextEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Zalgo text — add combining marks for corrupted text effect.',
  infoURL: 'https://en.wikipedia.org/wiki/Zalgo_text',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Intensity', type: 'option', value: ['Normal', 'Mini', 'Max'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default ZalgoTextEncode;
