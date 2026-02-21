import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { MORSE_REVERSE } from '../_lib/morse';

const NAME = 'Pollux Cipher Decode';

function parseReverseAssignment(assignment: string): Record<string, string> {
  const map: Record<string, string> = {};
  const parts = assignment.split(/[\s,;]+/);
  for (const part of parts) {
    const match = part.match(/^(\d)=([\.\-x])$/);
    if (match) {
      map[match[1]] = match[2];
    }
  }
  return map;
}

class PolluxCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes Pollux cipher by converting digits back to Morse symbols and then decoding Morse.';
    this.infoURL = 'https://www.dcode.fr/pollux-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Assignment', type: 'string', value: '0=. 1=- 2=x 3=. 4=- 5=x 6=. 7=- 8=x 9=.' },
    ];
  }

  run(input: string, args: any[]): string {
    const assignment = (args[0] as string) || '0=. 1=- 2=x 3=. 4=- 5=x 6=. 7=- 8=x 9=.';
    const map = parseReverseAssignment(assignment);

    // Convert digits to Morse symbols
    const digitsOnly = input.replace(/[^0-9]/g, '');
    let morseStream = '';
    for (const d of digitsOnly) {
      morseStream += map[d] ?? '';
    }

    // Remove trailing separators
    morseStream = morseStream.replace(/x+$/, '');

    // Parse: xx = word separator, x = letter separator
    const words = morseStream.split('xx');
    const decoded = words.map((word) => {
      return word.split('x').map((code) => MORSE_REVERSE[code] ?? '').join('');
    });
    return decoded.join(' ');
  }
}

registerCustomOp(PolluxCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Pollux cipher decode — digits to Morse symbols to text.',
  infoURL: 'https://www.dcode.fr/pollux-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Assignment', type: 'string', value: '0=. 1=- 2=x 3=. 4=- 5=x 6=. 7=- 8=x 9=.' }],
  flowControl: false,
}, 'Classical Ciphers');

export default PolluxCipherDecode;
