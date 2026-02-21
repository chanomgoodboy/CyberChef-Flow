import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Chaocipher Decode';

function permuteAlphabets(left: string[], right: string[], ctIdx: number, ptIdx: number): void {
  rotateToFront(left, ctIdx);
  const extracted = left.splice(1, 1)[0];
  left.splice(13, 0, extracted);

  rotateToFront(right, ptIdx);
  right.push(right.shift()!);
  const extracted2 = right.splice(2, 1)[0];
  right.splice(13, 0, extracted2);
}

function rotateToFront(arr: string[], idx: number): void {
  const tail = arr.splice(0, idx);
  arr.push(...tail);
}

class ChaocipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes the Chaocipher by reversing the two evolving alphabet lookup.';
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
      const ctIdx = left.indexOf(upper);
      if (ctIdx < 0) {
        result += ch;
        continue;
      }
      const outCh = right[ctIdx];
      result += ch === upper ? outCh : outCh.toLowerCase();
      permuteAlphabets(left, right, ctIdx, ctIdx);
    }
    return result;
  }
}

registerCustomOp(ChaocipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Chaocipher decode — reverse two evolving alphabets.',
  infoURL: 'https://en.wikipedia.org/wiki/Chaocipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Left alphabet (CT)', type: 'string', value: 'HXUCZVAMDSLKPEFJRIGTWOBNYQ' },
    { name: 'Right alphabet (PT)', type: 'string', value: 'PTLNBQDEOYSFAVZKGJRIHWXUMC' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default ChaocipherDecode;
