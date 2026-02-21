import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Deranged Alphabet Generator';

/**
 * Generate a deranged alphabet — a permutation of A-Z where no letter
 * stays in its original position (a "derangement").
 *
 * Uses the input as a seed (via simple hash) for reproducibility,
 * or generates a random derangement if input is empty.
 */
class DerangedAlphabetGenerator extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Generate a deranged alphabet (permutation where no letter maps to itself). ' +
      'Input text is used as a seed for reproducible output. Leave empty for random.';
    this.infoURL = 'https://www.dcode.fr/deranged-alphabet-generator';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Count',
        type: 'number',
        value: 1,
      },
    ];
  }

  run(input: string, args: any[]): string {
    const count = Math.max(1, Math.min((args[0] as number) ?? 1, 100));

    // Simple seeded PRNG (xorshift32)
    let seed = 0;
    if (input.trim()) {
      for (let i = 0; i < input.length; i++) {
        seed = ((seed << 5) - seed + input.charCodeAt(i)) | 0;
      }
    } else {
      seed = Date.now() ^ (Math.random() * 0xFFFFFFFF);
    }
    if (seed === 0) seed = 1;

    function xorshift(): number {
      seed ^= seed << 13;
      seed ^= seed >> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 0xFFFFFFFF;
    }

    const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const results: string[] = [];

    for (let n = 0; n < count; n++) {
      // Fisher-Yates shuffle with rejection: keep shuffling until derangement
      let attempts = 0;
      let perm: string[];
      do {
        perm = ALPHA.split('');
        for (let i = perm.length - 1; i > 0; i--) {
          const j = Math.floor(xorshift() * (i + 1));
          [perm[i], perm[j]] = [perm[j], perm[i]];
        }
        attempts++;
      } while (hasFixedPoint(perm) && attempts < 1000);

      results.push(perm.join(''));
    }

    return results.join('\n');
  }
}

function hasFixedPoint(perm: string[]): boolean {
  for (let i = 0; i < perm.length; i++) {
    if (perm[i].charCodeAt(0) - 65 === i) return true;
  }
  return false;
}

registerCustomOp(DerangedAlphabetGenerator, {
  name: NAME,
  module: 'Custom',
  description: 'Generate deranged alphabets (no letter maps to itself).',
  infoURL: 'https://www.dcode.fr/deranged-alphabet-generator',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Count', type: 'number', value: 1 },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default DerangedAlphabetGenerator;
