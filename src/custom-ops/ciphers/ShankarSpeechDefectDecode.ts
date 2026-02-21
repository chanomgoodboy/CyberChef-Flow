import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Shankar Speech Defect Decode';

const VOWELS = new Set('AEIOUaeiou');

class ShankarSpeechDefectDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Reverses Shankar Speech Defect encoding. Restores original vowels from substitute characters ' +
      'or removes inserted syllables.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Mode', type: 'option', value: ['Replace vowels', 'Insert syllable'] },
      { name: 'Substitute', type: 'string', value: 'q' },
      { name: 'Original Vowels', type: 'option', value: ['A', 'E', 'I', 'O', 'U', 'Auto'] },
    ];
  }

  run(input: string, args: any[]): string {
    const mode = (args[0] as string) || 'Replace vowels';
    const sub = (args[1] as string) || 'q';
    const vowelChoice = (args[2] as string) || 'Auto';

    if (mode === 'Insert syllable') {
      // Remove pattern: vowel + sub + lowercase_vowel
      let result = '';
      let i = 0;
      while (i < input.length) {
        if (VOWELS.has(input[i]) && i + sub.length + 1 < input.length) {
          const afterVowel = input.slice(i + 1, i + 1 + sub.length);
          if (afterVowel.toLowerCase() === sub.toLowerCase() &&
              input[i + 1 + sub.length]?.toLowerCase() === input[i].toLowerCase()) {
            result += input[i];
            i += 1 + sub.length + 1; // skip vowel + sub + repeated vowel
            continue;
          }
        }
        result += input[i];
        i++;
      }
      return result;
    }

    // Replace vowels mode — substitute character back to vowels
    const vowel = vowelChoice === 'Auto' ? 'a' : vowelChoice.toLowerCase();
    let result = '';
    for (const ch of input) {
      if (ch.toLowerCase() === sub.toLowerCase()) {
        result += ch === ch.toUpperCase() ? vowel.toUpperCase() : vowel;
      } else {
        result += ch;
      }
    }
    return result;
  }
}

registerCustomOp(ShankarSpeechDefectDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Shankar Speech Defect decode — restore vowels from substitutes.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Mode', type: 'option', value: ['Replace vowels', 'Insert syllable'] },
    { name: 'Substitute', type: 'string', value: 'q' },
    { name: 'Original Vowels', type: 'option', value: ['A', 'E', 'I', 'O', 'U', 'Auto'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default ShankarSpeechDefectDecode;
