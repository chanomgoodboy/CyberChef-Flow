import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { ALPHABET, mod, keywordAlphabet } from '../_lib/alphabet';

const NAME = 'Bazeries Cipher Decode';

function numberToWord(n: number): string {
  const ones = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF'];
  const teens = ['DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIXSEPT', 'DIXHUIT', 'DIXNEUF'];
  const tens = ['', 'DIX', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTEDIX', 'QUATREVINGT', 'QUATREVINGTDIX'];

  if (n <= 0) return 'ZERO';
  if (n < 10) return ones[n];
  if (n < 20) return teens[n - 10];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return tens[t] + (o > 0 ? ones[o] : '');
  }
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const r = n % 100;
    const prefix = h === 1 ? 'CENT' : ones[h] + 'CENT';
    return prefix + (r > 0 ? numberToWord(r) : '');
  }
  return n.toString();
}

class BazeriesCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes the Bazeries cipher by reversing the transposed alphabet lookup and Caesar shift.';
    this.infoURL = 'https://www.dcode.fr/bazeries-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Number', type: 'number', value: 81 },
    ];
  }

  run(input: string, args: any[]): string {
    const num = Math.max(1, (args[0] as number) || 81);
    const word = numberToWord(num);
    const transAlpha = keywordAlphabet(word);

    let result = '';
    for (const ch of input) {
      const upper = ch.toUpperCase();
      const pos = transAlpha.indexOf(upper);
      if (pos < 0) {
        result += ch;
        continue;
      }
      // Reverse: find position in transposed alphabet, then reverse Caesar
      const outIdx = mod(pos - num, 26);
      const outCh = ALPHABET[outIdx];
      result += ch === upper ? outCh : outCh.toLowerCase();
    }
    return result;
  }
}

registerCustomOp(BazeriesCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Bazeries cipher decode — reverse number-keyed transposed alphabet + Caesar.',
  infoURL: 'https://www.dcode.fr/bazeries-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Number', type: 'number', value: 81 }],
  flowControl: false,
}, 'Classical Ciphers');

export default BazeriesCipherDecode;
