import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Word Substitution Encode';

/**
 * Replace each letter with a word from a keyed dictionary.
 * Default: positional words (A=Alpha, B=Bravo... or A=1st word, B=2nd word...).
 * Custom: user provides 26 comma-separated words.
 */
class WordSubstitutionEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Replace each letter with a word from a configurable dictionary. ' +
      'Default uses positional numbering (A=1, B=2...). ' +
      'Custom mode accepts 26 comma-separated words.';
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
      {
        name: 'Separator',
        type: 'option',
        value: ['Space', 'Comma', 'Newline', 'Slash'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const dictMode = (args[0] as string) ?? 'Numbers (A=1)';
    const customStr = (args[1] as string) ?? '';
    const sepName = (args[2] as string) ?? 'Space';

    const sep = sepName === 'Comma' ? ',' : sepName === 'Newline' ? '\n' : sepName === 'Slash' ? '/' : ' ';

    let dict: string[];
    if (dictMode === 'Custom' && customStr.trim()) {
      dict = customStr.split(',').map((w) => w.trim());
      while (dict.length < 26) dict.push(`?${dict.length + 1}`);
    } else {
      // Numbers
      dict = Array.from({ length: 26 }, (_, i) => String(i + 1));
    }

    const result: string[] = [];
    const words = input.split(/(\s+)/);

    for (const segment of words) {
      if (/^\s+$/.test(segment)) {
        result.push('/');
        continue;
      }
      const letterCodes: string[] = [];
      for (const ch of segment) {
        const idx = ch.toUpperCase().charCodeAt(0) - 65;
        if (idx >= 0 && idx < 26) {
          letterCodes.push(dict[idx]);
        }
      }
      result.push(letterCodes.join(sep));
    }

    return result.join(sep);
  }
}

registerCustomOp(WordSubstitutionEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Replace letters with words from a dictionary.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Dictionary', type: 'option', value: ['Numbers (A=1)', 'Custom'] },
    { name: 'Custom Words (A,B,...Z)', type: 'string', value: '' },
    { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'Newline', 'Slash'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default WordSubstitutionEncode;
