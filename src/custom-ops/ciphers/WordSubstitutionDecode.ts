import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Word Substitution Decode';

/**
 * Reverse of Word Substitution Encode: replace words from a dictionary
 * back to single letters.
 */
class WordSubstitutionDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decode word substitution — replace dictionary words back to letters.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Dictionary',
        type: 'option',
        value: ['Numbers (A=1)', 'Custom'],
      },
      {
        name: 'Custom Words (A,B,...Z)',
        type: 'string',
        value: '',
      },
    ];
  }

  run(input: string, args: any[]): string {
    const dictMode = (args[0] as string) ?? 'Numbers (A=1)';
    const customStr = (args[1] as string) ?? '';

    let dict: string[];
    if (dictMode === 'Custom' && customStr.trim()) {
      dict = customStr.split(',').map((w) => w.trim());
      while (dict.length < 26) dict.push(`?${dict.length + 1}`);
    } else {
      dict = Array.from({ length: 26 }, (_, i) => String(i + 1));
    }

    // Build reverse map (word → letter)
    const reverseMap = new Map<string, string>();
    for (let i = 0; i < Math.min(dict.length, 26); i++) {
      reverseMap.set(dict[i].toLowerCase(), String.fromCharCode(65 + i));
    }

    // Split on / for word boundaries, then on common separators for tokens
    const wordGroups = input.split(/\s*\/\s*/);
    const result: string[] = [];

    for (const group of wordGroups) {
      const tokens = group.split(/[\s,]+/).filter(Boolean);
      let word = '';
      for (const token of tokens) {
        const letter = reverseMap.get(token.toLowerCase());
        if (letter) {
          word += letter;
        } else {
          word += token; // pass through
        }
      }
      result.push(word);
    }

    return result.join(' ');
  }
}

registerCustomOp(WordSubstitutionDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Decode word substitution — dictionary words to letters.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Dictionary', type: 'option', value: ['Numbers (A=1)', 'Custom'] },
    { name: 'Custom Words (A,B,...Z)', type: 'string', value: '' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default WordSubstitutionDecode;
