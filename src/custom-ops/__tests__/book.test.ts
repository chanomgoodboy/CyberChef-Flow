import { describe, it, expect } from 'vitest';
import BookCipher from '../ciphers/BookCipher';

describe('Book Cipher', () => {
  it('decodes with word index mode', () => {
    const op = new BookCipher();
    const book = 'Hello World Attack The Castle Now Please Wait';
    // Indices: 1 2 3 → first letters of words 1,2,3 = H, W, A
    const result = op.run('1 2 3', [book, 'Word index (first letter)', '1 (one-based)', ' ']);
    expect(result).toBe('HWA');
  });

  it('decodes with character index mode', () => {
    const op = new BookCipher();
    const book = 'ABCDEFGHIJ';
    const result = op.run('1 3 5', [book, 'Character index', '1 (one-based)', ' ']);
    expect(result).toBe('ACE');
  });

  it('handles zero-based indexing', () => {
    const op = new BookCipher();
    const book = 'ABCDEFGHIJ';
    const result = op.run('0 2 4', [book, 'Character index', '0 (zero-based)', ' ']);
    expect(result).toBe('ACE');
  });

  it('returns ? for out-of-range indices', () => {
    const op = new BookCipher();
    const book = 'AB';
    const result = op.run('1 2 99', [book, 'Character index', '1 (one-based)', ' ']);
    expect(result).toBe('AB?');
  });

  it('throws when no book text provided', () => {
    const op = new BookCipher();
    expect(() => op.run('1 2 3', ['', 'Word index (first letter)', '1 (one-based)', ' '])).toThrow();
  });
});
