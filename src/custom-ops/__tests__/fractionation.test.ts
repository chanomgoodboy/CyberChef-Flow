import { describe, it, expect } from 'vitest';
import TrifidCipherEncode from '../ciphers/TrifidCipherEncode';
import TrifidCipherDecode from '../ciphers/TrifidCipherDecode';
import FractionatedMorseEncode from '../ciphers/FractionatedMorseEncode';
import FractionatedMorseDecode from '../ciphers/FractionatedMorseDecode';
import MorbitCipherEncode from '../ciphers/MorbitCipherEncode';
import MorbitCipherDecode from '../ciphers/MorbitCipherDecode';
import PolluxCipherEncode from '../ciphers/PolluxCipherEncode';
import PolluxCipherDecode from '../ciphers/PolluxCipherDecode';

describe('Trifid Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new TrifidCipherEncode();
    const dec = new TrifidCipherDecode();
    const plain = 'HELLO';
    const cipher = enc.run(plain, ['', 5]);
    const result = dec.run(cipher, ['', 5]);
    expect(result).toBe(plain);
  });

  it('roundtrip with keyword', () => {
    const enc = new TrifidCipherEncode();
    const dec = new TrifidCipherDecode();
    const plain = 'ATTACKATDAWN';
    const cipher = enc.run(plain, ['CIPHER', 5]);
    const result = dec.run(cipher, ['CIPHER', 5]);
    // Trifid only produces chars in the 27-char alphabet
    expect(result.replace(/\+/g, '')).toBe(plain);
  });

  it('handles group size 3', () => {
    const enc = new TrifidCipherEncode();
    const dec = new TrifidCipherDecode();
    const plain = 'ABCDEF';
    const cipher = enc.run(plain, ['', 3]);
    const result = dec.run(cipher, ['', 3]);
    expect(result).toBe(plain);
  });

  it('output length matches input', () => {
    const enc = new TrifidCipherEncode();
    const result = enc.run('HELLO', ['', 5]);
    expect(result.length).toBe(5);
  });
});

describe('Fractionated Morse', () => {
  it('encode then decode roundtrip', () => {
    const enc = new FractionatedMorseEncode();
    const dec = new FractionatedMorseDecode();
    const plain = 'HELLO';
    const cipher = enc.run(plain, ['MORSE']);
    const result = dec.run(cipher, ['MORSE']);
    expect(result).toBe(plain);
  });

  it('roundtrip with different keyword', () => {
    const enc = new FractionatedMorseEncode();
    const dec = new FractionatedMorseDecode();
    const plain = 'ATTACK';
    const cipher = enc.run(plain, ['SECRET']);
    const result = dec.run(cipher, ['SECRET']);
    expect(result).toBe(plain);
  });

  it('produces alphabetic output', () => {
    const enc = new FractionatedMorseEncode();
    const result = enc.run('TEST', ['KEY']);
    expect(result).toMatch(/^[A-Z]+$/);
  });
});

describe('Morbit Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new MorbitCipherEncode();
    const dec = new MorbitCipherDecode();
    const plain = 'HELLO';
    const cipher = enc.run(plain, ['319825764']);
    const result = dec.run(cipher, ['319825764']);
    expect(result).toBe(plain);
  });

  it('produces numeric output', () => {
    const enc = new MorbitCipherEncode();
    const result = enc.run('HELLO', ['319825764']);
    expect(result).toMatch(/^[1-9]+$/);
  });

  it('handles spaces (word separator)', () => {
    const enc = new MorbitCipherEncode();
    const dec = new MorbitCipherDecode();
    const plain = 'HI THERE';
    const cipher = enc.run(plain, ['319825764']);
    const result = dec.run(cipher, ['319825764']);
    expect(result).toBe(plain);
  });
});

describe('Pollux Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new PolluxCipherEncode();
    const dec = new PolluxCipherDecode();
    const assignment = '0=. 1=- 2=x 3=. 4=- 5=x 6=. 7=- 8=x 9=.';
    const plain = 'HELLO';
    const cipher = enc.run(plain, [assignment]);
    const result = dec.run(cipher, [assignment]);
    expect(result).toBe(plain);
  });

  it('produces numeric output', () => {
    const enc = new PolluxCipherEncode();
    const result = enc.run('HI', ['0=. 1=- 2=x 3=. 4=- 5=x 6=. 7=- 8=x 9=.']);
    expect(result).toMatch(/^[0-9]+$/);
  });

  it('handles words with spaces', () => {
    const enc = new PolluxCipherEncode();
    const dec = new PolluxCipherDecode();
    const assignment = '0=. 1=- 2=x 3=. 4=- 5=x 6=. 7=- 8=x 9=.';
    const plain = 'AB CD';
    const cipher = enc.run(plain, [assignment]);
    const result = dec.run(cipher, [assignment]);
    expect(result).toBe(plain);
  });
});
