import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { morseEncodeRaw } from '../_lib/morse';
import { keywordAlphabet } from '../_lib/alphabet';

const NAME = 'Fractionated Morse Encode';

/**
 * Generate the 26 trigram table for fractionated Morse.
 * Each trigram is a combination of '.', '-', 'x' (3^3 = 27, but we use only 26).
 */
function generateTrigrams(): string[] {
  const symbols = ['.', '-', 'x'];
  const trigrams: string[] = [];
  for (const a of symbols) {
    for (const b of symbols) {
      for (const c of symbols) {
        trigrams.push(a + b + c);
      }
    }
  }
  // Use first 26 of 27 trigrams (skip 'xxx' which is the last one)
  return trigrams.slice(0, 26);
}

class FractionatedMorseEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Fractionated Morse encodes text to Morse (dots, dashes, x-separators), groups by 3, and substitutes each trigram via a keyed alphabet.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Fractionated_Morse_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Keyword', type: 'string', value: 'MORSE' },
    ];
  }

  run(input: string, args: any[]): string {
    const keyword = (args[0] as string) || 'MORSE';
    const alpha = keywordAlphabet(keyword);
    const trigrams = generateTrigrams();

    // Build trigram → letter mapping
    const trigramToLetter: Record<string, string> = {};
    for (let i = 0; i < 26; i++) {
      trigramToLetter[trigrams[i]] = alpha[i];
    }

    // Encode to raw Morse
    let morse = morseEncodeRaw(input);

    // Pad with x's to make length multiple of 3
    while (morse.length % 3 !== 0) {
      morse += 'x';
    }

    // Group by 3 and substitute
    let result = '';
    for (let i = 0; i < morse.length; i += 3) {
      const trigram = morse.slice(i, i + 3);
      result += trigramToLetter[trigram] ?? '?';
    }
    return result;
  }
}

registerCustomOp(FractionatedMorseEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Fractionated Morse encode — Morse to trigrams to keyed alphabet.',
  infoURL: 'https://en.wikipedia.org/wiki/Fractionated_Morse_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Keyword', type: 'string', value: 'MORSE' }],
  flowControl: false,
}, 'Classical Ciphers');

export default FractionatedMorseEncode;
