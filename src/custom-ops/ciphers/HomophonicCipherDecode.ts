import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Homophonic Cipher Decode';

function parseReverseMapping(mappingStr: string): Record<string, string> {
  const map: Record<string, string> = {};
  const entries = mappingStr.split(/\s+/);
  for (const entry of entries) {
    const match = entry.match(/^([A-Za-z])=(.+)$/);
    if (match) {
      const letter = match[1].toUpperCase();
      const symbols = match[2].split(',');
      for (const sym of symbols) {
        map[sym] = letter;
      }
    }
  }
  return map;
}

function defaultReverseMapping(): Record<string, string> {
  const freqOrder = 'ETAOINSHRDLCUMWFGYPBVKJXQZ';
  const counts = [13,9,8,8,7,7,6,6,6,4,4,3,3,3,2,2,2,2,2,2,1,1,1,1,1,1];
  const map: Record<string, string> = {};
  let code = 0;
  for (let i = 0; i < 26; i++) {
    for (let j = 0; j < counts[i] && code < 100; j++) {
      map[code.toString().padStart(2, '0')] = freqOrder[i];
      code++;
    }
  }
  return map;
}

class HomophonicCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes homophonic substitution cipher by reversing the symbol-to-letter mapping.';
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
    const map = mappingStr ? parseReverseMapping(mappingStr) : defaultReverseMapping();

    const tokens = sep ? input.split(sep) : [input];
    let result = '';
    for (const token of tokens) {
      if (token === ' ' || token === '') {
        result += ' ';
      } else if (map[token]) {
        result += map[token];
      }
    }
    return result;
  }
}

registerCustomOp(HomophonicCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Homophonic cipher decode — reverse symbol-to-letter mapping.',
  infoURL: 'https://en.wikipedia.org/wiki/Substitution_cipher#Homophonic_substitution',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Mapping (A=01,02 B=03 ...)', type: 'string', value: '' },
    { name: 'Separator', type: 'string', value: ' ' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default HomophonicCipherDecode;
