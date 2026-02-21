import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Homophonic Cipher Encode';

/**
 * Parse a mapping string like "A=01,02 B=03,04 C=05,06,07 ..."
 * Returns a map of letter → array of symbols.
 */
function parseMapping(mappingStr: string): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  const entries = mappingStr.split(/\s+/);
  for (const entry of entries) {
    const match = entry.match(/^([A-Za-z])=(.+)$/);
    if (match) {
      const letter = match[1].toUpperCase();
      const symbols = match[2].split(',');
      map[letter] = symbols;
    }
  }
  return map;
}

/** Default homophonic mapping (each letter gets ~proportional number of symbols 00-99). */
function defaultMapping(): Record<string, string[]> {
  // Simple: assign sequential 2-digit codes proportional to English frequency
  const freqOrder = 'ETAOINSHRDLCUMWFGYPBVKJXQZ';
  const counts = [13,9,8,8,7,7,6,6,6,4,4,3,3,3,2,2,2,2,2,2,1,1,1,1,1,1];
  const map: Record<string, string[]> = {};
  let code = 0;
  for (let i = 0; i < 26; i++) {
    const syms: string[] = [];
    for (let j = 0; j < counts[i] && code < 100; j++) {
      syms.push(code.toString().padStart(2, '0'));
      code++;
    }
    map[freqOrder[i]] = syms;
  }
  return map;
}

class HomophonicCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Homophonic substitution cipher maps each letter to one of several possible symbols, making frequency analysis harder. Uses the first available symbol for deterministic output.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Substitution_cipher#Homophonic_substitution';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Mapping (A=01,02 B=03 ...)', type: 'string', value: '' },
      { name: 'Separator', type: 'string', value: ' ' },
    ];
  }

  run(input: string, args: any[]): string {
    const mappingStr = (args[0] as string) || '';
    const sep = (args[1] as string) ?? ' ';
    const map = mappingStr ? parseMapping(mappingStr) : defaultMapping();

    const upper = input.toUpperCase();
    const parts: string[] = [];
    // Use round-robin within each letter's symbol pool for variety
    const counters: Record<string, number> = {};

    for (const ch of upper) {
      if (map[ch]) {
        const idx = (counters[ch] ?? 0) % map[ch].length;
        parts.push(map[ch][idx]);
        counters[ch] = idx + 1;
      } else if (ch === ' ') {
        parts.push(' ');
      }
    }
    return parts.join(sep);
  }
}

registerCustomOp(HomophonicCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Homophonic cipher encode — each letter maps to multiple symbols.',
  infoURL: 'https://en.wikipedia.org/wiki/Substitution_cipher#Homophonic_substitution',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Mapping (A=01,02 B=03 ...)', type: 'string', value: '' },
    { name: 'Separator', type: 'string', value: ' ' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default HomophonicCipherEncode;
