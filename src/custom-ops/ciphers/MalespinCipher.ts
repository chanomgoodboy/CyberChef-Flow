import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Malespin Cipher';

// Central American swap pairs — self-reciprocal
const SWAP_PAIRS: [string, string][] = [
  ['A', 'E'], ['B', 'N'], ['D', 'Q'], ['F', 'G'],
  ['H', 'I'], ['J', 'X'], ['K', 'W'], ['L', 'S'],
  ['M', 'T'], ['O', 'U'], ['P', 'Z'], ['R', 'Y'],
];

const MAP: Record<string, string> = {};
for (const [a, b] of SWAP_PAIRS) {
  MAP[a] = b;
  MAP[b] = a;
}

class MalespinCipher extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'The Malespin cipher is a Central American substitution cipher that swaps ' +
      'letter pairs: A↔E, B↔N, D↔Q, F↔G, H↔I, J↔X, K↔W, L↔S, M↔T, O↔U, P↔Z, R↔Y. ' +
      'Self-reciprocal: applying twice returns the original. ' +
      'C and V are unchanged (unless Ñ mode is used).';
    this.infoURL = 'https://www.dcode.fr/malespin-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    let result = '';
    for (const ch of input) {
      const upper = ch.toUpperCase();
      const mapped = MAP[upper];
      if (mapped) {
        result += ch === upper ? mapped : mapped.toLowerCase();
      } else {
        result += ch;
      }
    }
    return result;
  }
}

registerCustomOp(MalespinCipher, {
  name: NAME,
  module: 'Custom',
  description: 'Malespin cipher — Central American letter-swap substitution. Self-reciprocal.',
  infoURL: 'https://www.dcode.fr/malespin-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default MalespinCipher;
