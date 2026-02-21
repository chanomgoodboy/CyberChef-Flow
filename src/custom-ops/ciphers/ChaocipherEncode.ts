import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Chaocipher Encode';

/**
 * Permute an alphabet after encryption per Chaocipher algorithm.
 * left = ciphertext alphabet, right = plaintext alphabet
 */
function permuteAlphabets(left: string[], right: string[], ctIdx: number, ptIdx: number): void {
  // Left alphabet: rotate so ctIdx is at position 0, then extract position 1 to end and insert at position after zenith+1
  // Step 1: Rotate left so ciphertext letter is at front
  rotateToFront(left, ctIdx);
  // Step 2: Extract char at index 1, shift positions 2..13 left, insert extracted at index 13
  const extracted = left.splice(1, 1)[0];
  left.splice(13, 0, extracted);

  // Right alphabet: rotate so ptIdx is at position 0, then shift left by one more (ptIdx letter goes to end)
  rotateToFront(right, ptIdx);
  // Step 3: Move position 0 to end (one additional shift)
  right.push(right.shift()!);
  // Step 4: Extract char at index 2, shift left, insert at index 13
  const extracted2 = right.splice(2, 1)[0];
  right.splice(13, 0, extracted2);
}

function rotateToFront(arr: string[], idx: number): void {
  const tail = arr.splice(0, idx);
  arr.push(...tail);
}

class ChaocipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The Chaocipher uses two evolving alphabets. After each letter is encrypted, both alphabets are permuted, making it highly resistant to frequency analysis.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Chaocipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Left alphabet (CT)', type: 'string', value: 'HXUCZVAMDSLKPEFJRIGTWOBNYQ' },
      { name: 'Right alphabet (PT)', type: 'string', value: 'PTLNBQDEOYSFAVZKGJRIHWXUMC' },
    ];
  }

  run(input: string, args: any[]): string {
    const left = [...((args[0] as string) || 'HXUCZVAMDSLKPEFJRIGTWOBNYQ').toUpperCase()];
    const right = [...((args[1] as string) || 'PTLNBQDEOYSFAVZKGJRIHWXUMC').toUpperCase()];

    if (left.length !== 26 || right.length !== 26) return 'Error: alphabets must be 26 chars';

    let result = '';
    for (const ch of input) {
      const upper = ch.toUpperCase();
      const ptIdx = right.indexOf(upper);
      if (ptIdx < 0) {
        result += ch;
        continue;
      }
      const outCh = left[ptIdx];
      result += ch === upper ? outCh : outCh.toLowerCase();
      permuteAlphabets(left, right, ptIdx, ptIdx);
    }
    return result;
  }
}

registerCustomOp(ChaocipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Chaocipher encode — two evolving alphabets permuted after each letter.',
  infoURL: 'https://en.wikipedia.org/wiki/Chaocipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Left alphabet (CT)', type: 'string', value: 'HXUCZVAMDSLKPEFJRIGTWOBNYQ' },
    { name: 'Right alphabet (PT)', type: 'string', value: 'PTLNBQDEOYSFAVZKGJRIHWXUMC' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default ChaocipherEncode;
