import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Shankar Speech Defect Encode';

const VOWELS = new Set('AEIOUaeiou');

class ShankarSpeechDefectEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Replaces all vowels with a substitute character (default: "q") ' +
      'or inserts a syllable after each vowel. A fun encoding/speech defect simulation.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Mode', type: 'option', value: ['Replace vowels', 'Insert syllable'] },
      { name: 'Substitute', type: 'string', value: 'q' },
    ];
  }

  run(input: string, args: any[]): string {
    const mode = (args[0] as string) || 'Replace vowels';
    const sub = (args[1] as string) || 'q';

    if (mode === 'Insert syllable') {
      let result = '';
      for (const ch of input) {
        result += ch;
        if (VOWELS.has(ch)) {
          result += sub + ch.toLowerCase();
        }
      }
      return result;
    }

    // Replace vowels mode
    let result = '';
    for (const ch of input) {
      if (VOWELS.has(ch)) {
        result += ch === ch.toUpperCase() ? sub.toUpperCase() : sub.toLowerCase();
      } else {
        result += ch;
      }
    }
    return result;
  }
}

registerCustomOp(ShankarSpeechDefectEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Shankar Speech Defect encode — replace or augment vowels.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Mode', type: 'option', value: ['Replace vowels', 'Insert syllable'] },
    { name: 'Substitute', type: 'string', value: 'q' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default ShankarSpeechDefectEncode;
