import { describe, it, expect } from 'vitest';
import KennyLanguageEncode from '../ciphers/KennyLanguageEncode';
import KennyLanguageDecode from '../ciphers/KennyLanguageDecode';
import DiceNumbersEncode from '../ciphers/DiceNumbersEncode';
import DiceNumbersDecode from '../ciphers/DiceNumbersDecode';
import MusicNotesEncode from '../ciphers/MusicNotesEncode';
import MusicNotesDecode from '../ciphers/MusicNotesDecode';
import GreekLetterNumberEncode from '../ciphers/GreekLetterNumberEncode';
import GreekLetterNumberDecode from '../ciphers/GreekLetterNumberDecode';
import NavajoCodeEncode from '../ciphers/NavajoCodeEncode';
import NavajoCodeDecode from '../ciphers/NavajoCodeDecode';
import MalespinCipher from '../ciphers/MalespinCipher';
import AlphabeticalRanksEncode from '../ciphers/AlphabeticalRanksEncode';
import AlphabeticalRanksDecode from '../ciphers/AlphabeticalRanksDecode';

describe('Kenny Language', () => {
  it('encodes A as mmm', () => {
    const enc = new KennyLanguageEncode();
    expect(enc.run('A', [])).toBe('MMM');
  });

  it('roundtrip', () => {
    const enc = new KennyLanguageEncode();
    const dec = new KennyLanguageDecode();
    const encoded = enc.run('HELLO', []);
    expect(dec.run(encoded, [])).toBe('HELLO');
  });

  it('preserves case', () => {
    const enc = new KennyLanguageEncode();
    const dec = new KennyLanguageDecode();
    const encoded = enc.run('hello', []);
    expect(encoded).toMatch(/^[mpf]+$/);
    expect(dec.run(encoded, [])).toBe('hello');
  });
});

describe('Dice Numbers', () => {
  it('encodes 1-6 to dice faces', () => {
    const enc = new DiceNumbersEncode();
    expect(enc.run('123456', ['Direct (1-6 only)'])).toBe('⚀⚁⚂⚃⚄⚅');
  });

  it('roundtrip', () => {
    const enc = new DiceNumbersEncode();
    const dec = new DiceNumbersDecode();
    expect(dec.run(enc.run('123456', ['Direct (1-6 only)']), [])).toBe('123456');
  });

  it('decodes dice faces', () => {
    const dec = new DiceNumbersDecode();
    expect(dec.run('⚀⚁⚂⚃⚄⚅', [])).toBe('123456');
  });
});

describe('Music Notes', () => {
  it('encodes A-G to solfege', () => {
    const enc = new MusicNotesEncode();
    expect(enc.run('ABCDEFG', ['Si', 'Space'])).toBe('Do Re Mi Fa Sol La Si');
  });

  it('roundtrip for first 7 letters', () => {
    const enc = new MusicNotesEncode();
    const dec = new MusicNotesDecode();
    const encoded = enc.run('ABCDEFG', ['Si', 'Space']);
    expect(dec.run(encoded, ['Si'])).toBe('ABCDEFG');
  });
});

describe('Greek Letter Number', () => {
  it('encodes A as α', () => {
    const enc = new GreekLetterNumberEncode();
    const result = enc.run('A', ['Symbol', 'None']);
    expect(result).toBe('Α'); // Greek capital Alpha
  });

  it('encodes as names', () => {
    const enc = new GreekLetterNumberEncode();
    const result = enc.run('ABC', ['Name', 'Space']);
    expect(result).toBe('Alpha Beta Gamma');
  });

  it('decodes Greek names', () => {
    const dec = new GreekLetterNumberDecode();
    expect(dec.run('Alpha Beta Gamma', [])).toBe('A B C');
  });
});

describe('Navajo Code', () => {
  it('encodes and decodes', () => {
    const enc = new NavajoCodeEncode();
    const dec = new NavajoCodeDecode();
    const encoded = enc.run('ABC', ['First word']);
    const decoded = dec.run(encoded, []);
    expect(decoded).toBe('ABC');
  });

  it('encodes A as WOL-LA-CHEE', () => {
    const enc = new NavajoCodeEncode();
    const result = enc.run('A', ['First word']);
    expect(result).toBe('WOL-LA-CHEE');
  });
});

describe('Malespin Cipher', () => {
  it('is self-reciprocal', () => {
    const op = new MalespinCipher();
    const input = 'Hello World';
    expect(op.run(op.run(input, []), [])).toBe(input);
  });

  it('swaps A↔E', () => {
    const op = new MalespinCipher();
    expect(op.run('A', [])).toBe('E');
    expect(op.run('E', [])).toBe('A');
  });

  it('preserves case', () => {
    const op = new MalespinCipher();
    expect(op.run('a', [])).toBe('e');
    expect(op.run('E', [])).toBe('A');
  });

  it('passes through C and V unchanged', () => {
    const op = new MalespinCipher();
    expect(op.run('C', [])).toBe('C');
    expect(op.run('V', [])).toBe('V');
  });
});

describe('Alphabetical Ranks Added', () => {
  it('encodes A=1, B=3, C=6', () => {
    const enc = new AlphabeticalRanksEncode();
    expect(enc.run('ABC', ['Space'])).toBe('1 3 6');
  });

  it('encodes Z=351', () => {
    const enc = new AlphabeticalRanksEncode();
    expect(enc.run('Z', ['Space'])).toBe('351');
  });

  it('roundtrip', () => {
    const enc = new AlphabeticalRanksEncode();
    const dec = new AlphabeticalRanksDecode();
    const encoded = enc.run('HELLO', ['Space']);
    expect(dec.run(encoded, ['Space'])).toBe('HELLO');
  });
});
