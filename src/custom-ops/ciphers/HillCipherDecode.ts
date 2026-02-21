import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { matVecMulMod, matInverseMod } from '../_lib/matrix';
import { ALPHABET } from '../_lib/alphabet';

const NAME = 'Hill Cipher Decode';

function parseKeyMatrix(keyStr: string): number[][] {
  const nums = keyStr.split(/[\s,]+/).map(Number).filter((n) => !isNaN(n));
  const size = Math.round(Math.sqrt(nums.length));
  if (size * size === nums.length && size >= 2) {
    const matrix: number[][] = [];
    for (let i = 0; i < size; i++) {
      matrix.push(nums.slice(i * size, (i + 1) * size));
    }
    return matrix;
  }

  const letters = keyStr.toUpperCase().replace(/[^A-Z]/g, '');
  const sz = Math.round(Math.sqrt(letters.length));
  if (sz * sz !== letters.length || sz < 2) {
    throw new Error(`Key must be a perfect square of numbers or letters. Got ${letters.length} characters.`);
  }
  const mat: number[][] = [];
  for (let i = 0; i < sz; i++) {
    mat.push([...letters.slice(i * sz, (i + 1) * sz)].map((ch) => ch.charCodeAt(0) - 65));
  }
  return mat;
}

class HillCipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes text encrypted with the Hill cipher using the inverse of the key matrix modulo 26.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Hill_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Key matrix', type: 'string', value: '6,24,1,13,16,10,20,17,15' },
    ];
  }

  run(input: string, args: any[]): string {
    const keyStr = (args[0] as string) || '6,24,1,13,16,10,20,17,15';
    const matrix = parseKeyMatrix(keyStr);
    const invMatrix = matInverseMod(matrix, 26);
    const n = matrix.length;

    const text = input.toUpperCase().replace(/[^A-Z]/g, '');

    let result = '';
    for (let i = 0; i < text.length; i += n) {
      const block = text.slice(i, i + n);
      if (block.length < n) break;
      const vec = [...block].map((ch) => ch.charCodeAt(0) - 65);
      const decrypted = matVecMulMod(invMatrix, vec, 26);
      result += decrypted.map((v) => ALPHABET[v]).join('');
    }
    return result;
  }
}

registerCustomOp(HillCipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Hill cipher decode — inverse matrix multiplication mod 26.',
  infoURL: 'https://en.wikipedia.org/wiki/Hill_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Key matrix', type: 'string', value: '6,24,1,13,16,10,20,17,15' }],
  flowControl: false,
}, 'Classical Ciphers');

export default HillCipherDecode;
