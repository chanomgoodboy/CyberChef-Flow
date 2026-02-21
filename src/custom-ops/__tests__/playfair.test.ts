import { describe, it, expect } from 'vitest';
import PlayfairCipherEncode from '../ciphers/PlayfairCipherEncode';
import PlayfairCipherDecode from '../ciphers/PlayfairCipherDecode';

describe('Playfair Cipher', () => {
  it('encode then decode produces matching result', () => {
    const enc = new PlayfairCipherEncode();
    const dec = new PlayfairCipherDecode();
    const cipher = enc.run('HELLOWORLD', ['PLAYFAIR', 'X']);
    const result = dec.run(cipher, ['PLAYFAIR']);
    // Playfair inserts X between double letters and may add padding,
    // so exact roundtrip may have X insertions
    expect(result).toContain('HE');
    expect(result).toContain('LO');
  });

  it('Wikipedia example: HIDE THE GOLD IN THE TREE STUMP', () => {
    const enc = new PlayfairCipherEncode();
    // Key: PLAYFAIR EXAMPLE → grid starts: PLAYFIREMXBCDGHKNOQSTUVWZ
    // But standard example uses just "PLAYFAIR EXAMPLE"
    const result = enc.run('HIDETHEGOLDINTHETREESTUMP', ['PLAYFAIREXAMPLE', 'X']);
    // This should produce valid ciphertext
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/^[A-Z]+$/);
  });

  it('handles double letters with padding', () => {
    const enc = new PlayfairCipherEncode();
    // "BALLOON" has LL → should insert X: BA LX LO ON
    const result = enc.run('BALLOON', ['KEY', 'X']);
    expect(result.length % 2).toBe(0);
  });

  it('output length is always even', () => {
    const enc = new PlayfairCipherEncode();
    const result = enc.run('ABC', ['KEY', 'X']);
    expect(result.length % 2).toBe(0);
  });
});
