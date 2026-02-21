import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { morseDecodeRaw } from '../_lib/morse';
import { keywordAlphabet } from '../_lib/alphabet';

const NAME = 'Fractionated Morse Decode';

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
  return trigrams.slice(0, 26);
}

class FractionatedMorseDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes Fractionated Morse cipher by reversing the keyed trigram substitution and converting back from Morse.';
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

    // Build letter → trigram mapping
    const letterToTrigram: Record<string, string> = {};
    for (let i = 0; i < 26; i++) {
      letterToTrigram[alpha[i]] = trigrams[i];
    }

    // Convert ciphertext letters to trigrams
    const upper = input.toUpperCase().replace(/[^A-Z]/g, '');
    let morse = '';
    for (const ch of upper) {
      morse += letterToTrigram[ch] ?? '';
    }

    // Remove trailing x's (padding)
    morse = morse.replace(/x+$/, '');

    // Decode Morse
    return morseDecodeRaw(morse);
  }
}

registerCustomOp(FractionatedMorseDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Fractionated Morse decode — reverse keyed trigram substitution.',
  infoURL: 'https://en.wikipedia.org/wiki/Fractionated_Morse_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Keyword', type: 'string', value: 'MORSE' }],
  flowControl: false,
}, 'Classical Ciphers');

export default FractionatedMorseDecode;
