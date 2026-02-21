import { describe, it, expect } from 'vitest';
import HillCipherEncode from '../ciphers/HillCipherEncode';
import HillCipherDecode from '../ciphers/HillCipherDecode';

describe('Hill Cipher', () => {
  it('encode then decode roundtrip with 3x3 matrix', () => {
    const enc = new HillCipherEncode();
    const dec = new HillCipherDecode();
    // Key matrix: [[6,24,1],[13,16,10],[20,17,15]]
    const key = '6,24,1,13,16,10,20,17,15';
    const plain = 'ACT';
    const cipher = enc.run(plain, [key, 'X']);
    const result = dec.run(cipher, [key]);
    expect(result).toBe(plain);
  });

  it('Wikipedia example: ACT → POH', () => {
    const enc = new HillCipherEncode();
    const key = '6,24,1,13,16,10,20,17,15';
    const result = enc.run('ACT', [key, 'X']);
    expect(result).toBe('POH');
  });

  it('handles 2x2 matrix', () => {
    const enc = new HillCipherEncode();
    const dec = new HillCipherDecode();
    // 2x2 key: [[3,3],[2,5]]
    const key = '3,3,2,5';
    const plain = 'HELP';
    const cipher = enc.run(plain, [key, 'X']);
    const result = dec.run(cipher, [key]);
    expect(result).toBe(plain);
  });

  it('pads plaintext to multiple of matrix size', () => {
    const enc = new HillCipherEncode();
    const key = '6,24,1,13,16,10,20,17,15';
    // "HE" is only 2 chars, needs padding to 3
    const result = enc.run('HE', [key, 'X']);
    expect(result.length).toBe(3);
  });

  it('throws on non-invertible matrix', () => {
    const dec = new HillCipherDecode();
    // det([[2,4],[6,12]]) = 2*12 - 4*6 = 0, not invertible
    expect(() => dec.run('TEST', ['2,4,6,12'])).toThrow(/not invertible/);
  });
});
