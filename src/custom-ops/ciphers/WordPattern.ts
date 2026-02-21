import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { letterPattern, findByPattern } from '../_lib/wordlist';

const NAME = 'Word Pattern';

/**
 * Compute the letter pattern of each word (HELLO → ABCCD) and optionally
 * find matching dictionary words. Useful for attacking monoalphabetic
 * substitution ciphers.
 */
class WordPattern extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Compute letter patterns (HELLO → ABCCD) for each word and optionally ' +
      'find matching dictionary words. Useful for cracking substitution ciphers. ' +
      'Similar to dcode.fr/word-desubstitution.';
    this.infoURL = 'https://www.dcode.fr/word-desubstitution';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Mode',
        type: 'option',
        value: ['Pattern only', 'Pattern + Matches', 'Matches only'],
      },
      {
        name: 'Max Matches',
        type: 'number',
        value: 20,
      },
    ];
  }

  run(input: string, args: any[]): string {
    const mode = (args[0] as string) ?? 'Pattern + Matches';
    const maxMatches = (args[1] as number) ?? 20;

    const words = input.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';

    const lines: string[] = [];

    for (const word of words) {
      const pattern = letterPattern(word);
      const matches = findByPattern(pattern);
      const limited = matches.slice(0, maxMatches);

      if (mode === 'Pattern only') {
        lines.push(`${word} → ${pattern}`);
      } else if (mode === 'Matches only') {
        lines.push(`${word}: ${limited.join(', ') || '(no matches)'}`);
      } else {
        // Pattern + Matches
        lines.push(`${word} → ${pattern}: ${limited.join(', ') || '(no matches)'}${matches.length > maxMatches ? ` ... (+${matches.length - maxMatches} more)` : ''}`);
      }
    }

    return lines.join('\n');
  }
}

registerCustomOp(WordPattern, {
  name: NAME,
  module: 'Custom',
  description: 'Compute letter patterns and find matching words (word desubstitution).',
  infoURL: 'https://www.dcode.fr/word-desubstitution',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Mode', type: 'option', value: ['Pattern only', 'Pattern + Matches', 'Matches only'] },
    { name: 'Max Matches', type: 'number', value: 20 },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default WordPattern;
