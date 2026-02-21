import { describe, it, expect } from 'vitest';
import WolseleyCipher from '../ciphers/WolseleyCipher';
import HomophonicCipherEncode from '../ciphers/HomophonicCipherEncode';
import HomophonicCipherDecode from '../ciphers/HomophonicCipherDecode';
import MonomeDinomeEncode from '../ciphers/MonomeDinomeEncode';
import MonomeDinomeDecode from '../ciphers/MonomeDinomeDecode';
import BazeriesCipherEncode from '../ciphers/BazeriesCipherEncode';
import BazeriesCipherDecode from '../ciphers/BazeriesCipherDecode';

describe('Wolseley Cipher', () => {
  it('is reciprocal', () => {
    const op = new WolseleyCipher();
    const plain = 'HELLOWORLD';
    const cipher = op.run(plain, ['KEYWORD']);
    const result = op.run(cipher, ['KEYWORD']);
    expect(result).toBe(plain);
  });

  it('swaps between halves', () => {
    const op = new WolseleyCipher();
    // With keyword 'KEYWORD': keyed alphabet = KEYWORDABCFGHIJLMNPQSTUVXZ
    // First half: KEYWORDABCFGH (13 chars)
    // Second half: IJLMNPQSTUVXZ (13 chars)
    // K↔I, E↔J, Y↔L, W↔M, O↔N, R↔P, D↔Q, A↔S, B↔T, C↔U, F↔V, G↔X, H↔Z
    const result = op.run('K', ['KEYWORD']);
    expect(result).toBe('I');
  });

  it('preserves non-alpha characters', () => {
    const op = new WolseleyCipher();
    const result = op.run('Hello, World!', ['KEY']);
    expect(result).toMatch(/, /);
    expect(result.endsWith('!')).toBe(true);
  });

  it('preserves case', () => {
    const op = new WolseleyCipher();
    const result = op.run('Ab', ['KEY']);
    expect(result[0]).toMatch(/[A-Z]/);
    expect(result[1]).toMatch(/[a-z]/);
  });
});

describe('Homophonic Cipher', () => {
  it('encode then decode roundtrip with default mapping', () => {
    const enc = new HomophonicCipherEncode();
    const dec = new HomophonicCipherDecode();
    const plain = 'HELLO';
    const cipher = enc.run(plain, ['', ' ']);
    const result = dec.run(cipher, ['', ' ']);
    expect(result).toBe(plain);
  });

  it('encode then decode with custom mapping', () => {
    const enc = new HomophonicCipherEncode();
    const dec = new HomophonicCipherDecode();
    const mapping = 'A=01,02 B=03,04 C=05';
    const plain = 'ABC';
    const cipher = enc.run(plain, [mapping, ' ']);
    const result = dec.run(cipher, [mapping, ' ']);
    expect(result).toBe(plain);
  });

  it('produces numeric codes', () => {
    const enc = new HomophonicCipherEncode();
    const result = enc.run('A', ['A=42', ' ']);
    expect(result).toBe('42');
  });
});

describe('Monome-Dinome Cipher', () => {
  it('encodes correctly with default settings', () => {
    const enc = new MonomeDinomeEncode();
    // With keyword SECRET, row digits 12345, col digits 67890, monome row 0
    // Grid starts: S E C R T ... (row 0 = monome row)
    // S → row 0, col 0 → monome → '6'
    // E → row 0, col 1 → monome → '7'
    const result = enc.run('SE', ['SECRET', '12345', '67890', 0]);
    expect(result).toBe('67');
  });

  it('roundtrip with known input', () => {
    const enc = new MonomeDinomeEncode();
    const dec = new MonomeDinomeDecode();
    const plain = 'HELLO';
    const cipher = enc.run(plain, ['SECRET', '12345', '67890', 0]);
    const result = dec.run(cipher, ['SECRET', '12345', '67890', 0]);
    expect(result).toBe(plain);
  });

  it('produces only digits', () => {
    const enc = new MonomeDinomeEncode();
    const result = enc.run('TEST', ['KEY', '12345', '67890', 0]);
    expect(result).toMatch(/^[0-9]+$/);
  });
});

describe('Bazeries Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new BazeriesCipherEncode();
    const dec = new BazeriesCipherDecode();
    const plain = 'HELLOWORLD';
    const cipher = enc.run(plain, [81]);
    const result = dec.run(cipher, [81]);
    expect(result).toBe(plain);
  });

  it('roundtrip with different number', () => {
    const enc = new BazeriesCipherEncode();
    const dec = new BazeriesCipherDecode();
    const plain = 'THEQUICKBROWNFOX';
    const cipher = enc.run(plain, [42]);
    const result = dec.run(cipher, [42]);
    expect(result).toBe(plain);
  });

  it('preserves non-alpha', () => {
    const enc = new BazeriesCipherEncode();
    const dec = new BazeriesCipherDecode();
    const plain = 'Hello, World!';
    const cipher = enc.run(plain, [10]);
    const result = dec.run(cipher, [10]);
    expect(result).toBe(plain);
  });

  it('produces alphabetic output', () => {
    const enc = new BazeriesCipherEncode();
    const result = enc.run('ABC', [5]);
    expect(result).toMatch(/^[A-Z]+$/);
  });
});
