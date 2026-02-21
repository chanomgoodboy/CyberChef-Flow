import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { matVecMulMod } from '../_lib/matrix';
import { ALPHABET } from '../_lib/alphabet';

const NAME = 'Hill Cipher Encode';

function parseKeyMatrix(keyStr: string): number[][] {
  // Try parsing as comma/space separated numbers first
  const nums = keyStr.split(/[\s,]+/).map(Number).filter((n) => !isNaN(n));
  const size = Math.round(Math.sqrt(nums.length));
  if (size * size === nums.length && size >= 2) {
    const matrix: number[][] = [];
    for (let i = 0; i < size; i++) {
      matrix.push(nums.slice(i * size, (i + 1) * size));
    }
    return matrix;
  }

  // Fall back to letters (A=0, B=1, ...)
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

class HillCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The Hill cipher encrypts blocks of letters using matrix multiplication modulo 26. Key can be entered as comma-separated numbers or as letters (A=0, B=1, ...).';
    this.infoURL = 'https://en.wikipedia.org/wiki/Hill_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Key matrix', type: 'string', value: '6,24,1,13,16,10,20,17,15' },
      { name: 'Padding letter', type: 'string', value: 'X' },
    ];
  }

  run(input: string, args: any[]): string {
    const keyStr = (args[0] as string) || '6,24,1,13,16,10,20,17,15';
    const padChar = ((args[1] as string) || 'X').toUpperCase()[0] || 'X';
    const matrix = parseKeyMatrix(keyStr);
    const n = matrix.length;

    let text = input.toUpperCase().replace(/[^A-Z]/g, '');
    while (text.length % n !== 0) text += padChar;

    let result = '';
    for (let i = 0; i < text.length; i += n) {
      const vec = [...text.slice(i, i + n)].map((ch) => ch.charCodeAt(0) - 65);
      const encrypted = matVecMulMod(matrix, vec, 26);
      result += encrypted.map((v) => ALPHABET[v]).join('');
    }
    return result;
  }
}

registerCustomOp(HillCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Hill cipher encode — matrix multiplication mod 26.',
  infoURL: 'https://en.wikipedia.org/wiki/Hill_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Key matrix', type: 'string', value: '6,24,1,13,16,10,20,17,15' },
    { name: 'Padding letter', type: 'string', value: 'X' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default HillCipherEncode;
