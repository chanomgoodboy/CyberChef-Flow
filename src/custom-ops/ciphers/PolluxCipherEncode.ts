import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { MORSE_TABLE } from '../_lib/morse';

const NAME = 'Pollux Cipher Encode';

/**
 * Parse the Pollux assignment string.
 * Format: "0=. 1=- 2=x 3=. 4=- 5=x 6=. 7=- 8=x 9=."
 * Returns a mapping of morse symbol → list of possible digits.
 */
function parseAssignment(assignment: string): { dot: string[]; dash: string[]; sep: string[] } {
  const dot: string[] = [];
  const dash: string[] = [];
  const sep: string[] = [];

  const parts = assignment.split(/[\s,;]+/);
  for (const part of parts) {
    const match = part.match(/^(\d)=([\.\-x])$/);
    if (match) {
      const [, digit, symbol] = match;
      if (symbol === '.') dot.push(digit);
      else if (symbol === '-') dash.push(digit);
      else sep.push(digit);
    }
  }
  return { dot, dash, sep };
}

class PolluxCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Pollux cipher encodes text to Morse, then randomly replaces dots, dashes, and separators with digits according to an assignment table.';
    this.infoURL = 'https://www.dcode.fr/pollux-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Assignment', type: 'string', value: '0=. 1=- 2=x 3=. 4=- 5=x 6=. 7=- 8=x 9=.' },
    ];
  }

  run(input: string, args: any[]): string {
    const assignment = (args[0] as string) || '0=. 1=- 2=x 3=. 4=- 5=x 6=. 7=- 8=x 9=.';
    const { dot, dash, sep } = parseAssignment(assignment);

    if (!dot.length || !dash.length || !sep.length) return 'Error: assignment must cover ., -, and x';

    // Encode to Morse with 'x' separators
    const upper = input.toUpperCase();
    const morseChars: string[] = [];
    let firstLetter = true;
    for (const ch of upper) {
      if (ch === ' ') {
        morseChars.push('x', 'x'); // word separator
        firstLetter = true;
      } else if (MORSE_TABLE[ch]) {
        if (!firstLetter) morseChars.push('x'); // letter separator
        morseChars.push(...MORSE_TABLE[ch]);
        firstLetter = false;
      }
    }

    // Replace each Morse symbol with a random digit from its pool
    // Use deterministic first-choice for reproducibility
    let result = '';
    for (const sym of morseChars) {
      if (sym === '.') result += dot[0];
      else if (sym === '-') result += dash[0];
      else result += sep[0];
    }
    return result;
  }
}

registerCustomOp(PolluxCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Pollux cipher encode — Morse symbols to digits via assignment table.',
  infoURL: 'https://www.dcode.fr/pollux-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Assignment', type: 'string', value: '0=. 1=- 2=x 3=. 4=- 5=x 6=. 7=- 8=x 9=.' }],
  flowControl: false,
}, 'Classical Ciphers');

export default PolluxCipherEncode;
