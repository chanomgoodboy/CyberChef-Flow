import { describe, it, expect } from 'vitest';
import {
  modPow,
  extGcd,
  modInverseBig,
  derivePrivateKey,
  bytesToBigInt,
  bigIntToBytes,
  textToBigInt,
  bigIntToText,
  parseBigIntInput,
  formatBigIntOutput,
  gcd,
  isqrt,
  iroot,
  crt,
  smallEAttack,
  wienerAttack,
  fermatFactor,
  pollardPm1,
  pollardRho,
  commonModulusAttack,
  hastadAttack,
} from '../_lib/rsa';
import RSACipherEncode from '../ciphers/RSACipherEncode';
import RSACipherDecode from '../ciphers/RSACipherDecode';
import RSACipherAttack from '../ciphers/RSACipherAttack';

/* ================================================================== */
/*  Core math primitives                                               */
/* ================================================================== */

describe('modPow', () => {
  it('2^10 mod 1000 = 24', () => {
    expect(modPow(2n, 10n, 1000n)).toBe(24n);
  });

  it('Fermat little theorem: a^(p-1) ≡ 1 mod p for prime p', () => {
    expect(modPow(3n, 12n, 13n)).toBe(1n);
  });

  it('handles large exponents', () => {
    const result = modPow(7n, 256n, 13n);
    expect(result >= 0n && result < 13n).toBe(true);
  });

  it('base larger than mod', () => {
    expect(modPow(100n, 2n, 7n)).toBe(modPow(100n % 7n, 2n, 7n));
  });

  it('exp = 0 returns 1', () => {
    expect(modPow(5n, 0n, 3n)).toBe(1n);
  });
});

describe('extGcd', () => {
  it('gcd(240, 46) = 2 with Bezout identity', () => {
    const [g, x, y] = extGcd(240n, 46n);
    expect(g).toBe(2n);
    expect(240n * x + 46n * y).toBe(2n);
  });

  it('gcd(35, 15) = 5', () => {
    const [g, x, y] = extGcd(35n, 15n);
    expect(g).toBe(5n);
    expect(35n * x + 15n * y).toBe(5n);
  });
});

describe('modInverseBig', () => {
  it('3^-1 mod 7 = 5', () => {
    expect(modInverseBig(3n, 7n)).toBe(5n);
  });

  it('17^-1 mod 3120 = 2753 (Wikipedia RSA)', () => {
    expect(modInverseBig(17n, 3120n)).toBe(2753n);
  });

  it('throws for non-coprime', () => {
    expect(() => modInverseBig(6n, 9n)).toThrow(/No modular inverse/);
  });
});

describe('gcd', () => {
  it('gcd(12, 8) = 4', () => {
    expect(gcd(12n, 8n)).toBe(4n);
  });

  it('gcd of coprimes = 1', () => {
    expect(gcd(17n, 65537n)).toBe(1n);
  });
});

describe('isqrt', () => {
  it('isqrt(0) = 0', () => {
    expect(isqrt(0n)).toBe(0n);
  });

  it('isqrt(1) = 1', () => {
    expect(isqrt(1n)).toBe(1n);
  });

  it('isqrt(100) = 10', () => {
    expect(isqrt(100n)).toBe(10n);
  });

  it('isqrt(99) = 9 (floor)', () => {
    expect(isqrt(99n)).toBe(9n);
  });

  it('isqrt of large perfect square', () => {
    const n = 123456789n;
    expect(isqrt(n * n)).toBe(n);
  });
});

describe('iroot', () => {
  it('cube root of 27 = 3', () => {
    expect(iroot(27n, 3)).toBe(3n);
  });

  it('cube root of 26 = 2 (floor)', () => {
    expect(iroot(26n, 3)).toBe(2n);
  });

  it('5th root of 32 = 2', () => {
    expect(iroot(32n, 5)).toBe(2n);
  });

  it('cube root of large number', () => {
    const m = 999999n;
    expect(iroot(m * m * m, 3)).toBe(m);
  });
});

describe('crt', () => {
  it('classic example: x≡2 mod 3, x≡3 mod 5, x≡2 mod 7 → x=23', () => {
    expect(crt([2n, 3n, 2n], [3n, 5n, 7n])).toBe(23n);
  });

  it('two moduli', () => {
    // x ≡ 1 mod 3, x ≡ 2 mod 5 → x = 7
    expect(crt([1n, 2n], [3n, 5n])).toBe(7n);
  });
});

describe('derivePrivateKey', () => {
  it('Wikipedia example: p=61, q=53, e=17', () => {
    const { d, n, phi } = derivePrivateKey(61n, 53n, 17n);
    expect(n).toBe(3233n);
    expect(phi).toBe(3120n);
    expect((17n * d) % phi).toBe(1n);
    expect(d).toBe(2753n);
  });
});

/* ================================================================== */
/*  Byte/text conversions                                              */
/* ================================================================== */

describe('bytesToBigInt / bigIntToBytes', () => {
  it('roundtrips', () => {
    const original = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
    const n = bytesToBigInt(original);
    const back = bigIntToBytes(n);
    expect(back).toEqual(original);
  });

  it('zero', () => {
    expect(bytesToBigInt(new Uint8Array([0]))).toBe(0n);
    expect(bigIntToBytes(0n)).toEqual(new Uint8Array([0]));
  });
});

describe('textToBigInt / bigIntToText', () => {
  it('roundtrips ASCII', () => {
    expect(bigIntToText(textToBigInt('Hello'))).toBe('Hello');
  });

  it('roundtrips UTF-8', () => {
    expect(bigIntToText(textToBigInt('flag{ok}'))).toBe('flag{ok}');
  });
});

/* ================================================================== */
/*  Format parsing                                                     */
/* ================================================================== */

describe('parseBigIntInput / formatBigIntOutput', () => {
  it('Decimal roundtrip', () => {
    expect(formatBigIntOutput(parseBigIntInput('12345', 'Decimal'), 'Decimal')).toBe('12345');
  });

  it('Hex roundtrip', () => {
    expect(formatBigIntOutput(parseBigIntInput('0xff', 'Hex'), 'Hex')).toBe('ff');
  });

  it('Hex without prefix', () => {
    expect(parseBigIntInput('deadbeef', 'Hex')).toBe(0xdeadbeefn);
  });

  it('Text roundtrip', () => {
    expect(formatBigIntOutput(parseBigIntInput('Hi', 'Text'), 'Text')).toBe('Hi');
  });
});

/* ================================================================== */
/*  RSA Cipher Encode                                                  */
/* ================================================================== */

describe('RSA Cipher Encode', () => {
  const enc = new RSACipherEncode();

  it('Wikipedia: m=65, n=3233, e=17 → c=2790', () => {
    const result = enc.run('65', ['3233', '17', 'Decimal', 'Decimal']);
    expect(result).toBe('2790');
  });

  it('hex output', () => {
    const result = enc.run('65', ['3233', '17', 'Decimal', 'Hex']);
    expect(result).toBe(2790n.toString(16));
  });

  it('throws when m >= n', () => {
    expect(() => enc.run('4000', ['3233', '17', 'Decimal', 'Decimal'])).toThrow(/must be less than n/);
  });

  it('throws when n is missing', () => {
    expect(() => enc.run('65', ['', '17', 'Decimal', 'Decimal'])).toThrow(/required/);
  });
});

/* ================================================================== */
/*  RSA Cipher Decode                                                  */
/* ================================================================== */

describe('RSA Cipher Decode', () => {
  const dec = new RSACipherDecode();

  it('Wikipedia: c=2790, n=3233, d=2753 → m=65', () => {
    const result = dec.run('2790', ['3233', '2753', '', '', '17', 'Decimal', 'Decimal']);
    expect(result).toBe('65');
  });

  it('auto-derive from (p, q, e): c=2790 → m=65', () => {
    const result = dec.run('2790', ['', '', '61', '53', '17', 'Decimal', 'Decimal']);
    expect(result).toBe('65');
  });

  it('throws when missing params', () => {
    expect(() => dec.run('2790', ['', '', '', '', '17', 'Decimal', 'Decimal'])).toThrow(/required parameters/);
  });
});

/* ================================================================== */
/*  Encode → Decode roundtrips                                         */
/* ================================================================== */

describe('RSA roundtrip', () => {
  const enc = new RSACipherEncode();
  const dec = new RSACipherDecode();

  it('text "Hi" with small primes', () => {
    const n = (257n * 263n).toString();
    const { d } = derivePrivateKey(257n, 263n, 17n);

    const ciphertext = enc.run('Hi', [n, '17', 'Text', 'Decimal']);
    const plaintext = dec.run(ciphertext, [n, d.toString(), '', '', '17', 'Decimal', 'Text']);
    expect(plaintext).toBe('Hi');
  });

  it('text "flag{textbook_rsa}" with CTF-sized primes', () => {
    const p = 1208925819614629174706111n;
    const q = 1208925819614629174706189n;
    const e = 65537n;
    const n = p * q;
    const { d } = derivePrivateKey(p, q, e);

    const msg = 'flag{textbook_rsa}';
    const ciphertext = enc.run(msg, [n.toString(), e.toString(), 'Text', 'Decimal']);
    const plaintext = dec.run(ciphertext, [n.toString(), d.toString(), '', '', e.toString(), 'Decimal', 'Text']);
    expect(plaintext).toBe(msg);
  });

  it('roundtrip with (p, q, e) derivation on decode side', () => {
    const p = 257n, q = 263n, e = 17n;
    const n = (p * q).toString();

    const ciphertext = enc.run('42', [n, e.toString(), 'Decimal', 'Decimal']);
    const plaintext = dec.run(ciphertext, ['', '', p.toString(), q.toString(), e.toString(), 'Decimal', 'Decimal']);
    expect(plaintext).toBe('42');
  });
});

/* ================================================================== */
/*  RSA Attacks                                                        */
/* ================================================================== */

describe('Small e attack', () => {
  it('e=3, m^3 < n: recovers plaintext', () => {
    const m = 42n;
    const e = 3n;
    const n = 1000000007n; // large prime, m^3 = 74088 << n
    const c = m ** e; // = 74088, no modular reduction
    const result = smallEAttack(c, e, n);
    expect(result).not.toBeNull();
    expect(result!.m).toBe(m);
  });

  it('e=3, m^3 slightly above n: recovers with k*n offset', () => {
    const m = 100n;
    const e = 3n;
    const n = 999983n; // prime, m^3 = 1000000 > n
    const c = modPow(m, e, n); // = 1000000 mod 999983 = 17
    const result = smallEAttack(c, e, n);
    expect(result).not.toBeNull();
    expect(result!.m).toBe(m);
  });

  it('returns null when not applicable', () => {
    // m=500, e=17, n=3233 → m^e >> n, many wraps
    const c = modPow(500n, 17n, 3233n);
    expect(smallEAttack(c, 17n, 3233n)).toBeNull();
  });
});

describe("Wiener's attack", () => {
  it('recovers d when d is small', () => {
    // Construct a Wiener-vulnerable keypair
    // p, q chosen so d is small
    const p = 1009n;
    const q = 3643n;
    const n = p * q; // 3675787
    const phi = (p - 1n) * (q - 1n); // 3671136
    const d = 29n; // small d
    const e = modInverseBig(d, phi);

    const result = wienerAttack(e, n);
    expect(result).not.toBeNull();
    expect(result!.details.d).toBe(d.toString());
    expect(BigInt(result!.details.p) * BigInt(result!.details.q)).toBe(n);
  });

  it('decrypts with ciphertext provided', () => {
    const p = 1009n;
    const q = 3643n;
    const n = p * q;
    const phi = (p - 1n) * (q - 1n);
    const d = 29n;
    const e = modInverseBig(d, phi);
    const m = 42n;
    const c = modPow(m, e, n);

    const result = wienerAttack(e, n, c);
    expect(result).not.toBeNull();
    expect(result!.m).toBe(42n);
  });
});

describe('Fermat factorization', () => {
  it('factors n when p and q are close', () => {
    const p = 1000003n;
    const q = 1000033n;
    const n = p * q;
    const result = fermatFactor(n);
    expect(result).not.toBeNull();
    expect(result!.p * result!.q).toBe(n);
    // Should find the actual factors (order may vary)
    const factors = [result!.p, result!.q].sort((a, b) => (a < b ? -1 : 1));
    expect(factors).toEqual([p, q]);
  });

  it('factors even number', () => {
    const result = fermatFactor(100n);
    expect(result).not.toBeNull();
    expect(result!.p).toBe(2n);
    expect(result!.q).toBe(50n);
  });

  it('returns null for distant primes with low maxIter', () => {
    // p and q very far apart → Fermat won't find in few iterations
    const n = 11n * 1000003n;
    const result = fermatFactor(n, 100);
    expect(result).toBeNull();
  });
});

describe('Pollard p-1', () => {
  it('factors when p-1 is smooth', () => {
    // p-1 = 2 * 3 * 5 * 7 * 11 * 13 = 30030, so p = 30031
    const p = 30031n; // not actually prime, let me check...
    // Actually 30031 = 59 * 509. Let me use p = 2 * 3 * 5 * 7 + 1 = 211, a prime
    // 210 = 2 * 3 * 5 * 7, 211 is prime ✓
    // q = 2 * 11 * 13 + 1 = 287 = 7 * 41, not prime
    // q = 2 * 3 * 11 + 1 = 67, prime ✓
    const pp = 211n;
    const qq = 67n;
    const n = pp * qq;
    const result = pollardPm1(n, 1000);
    expect(result).not.toBeNull();
    expect(result!.p * result!.q).toBe(n);
  });
});

describe('Pollard rho', () => {
  it('factors a semiprime', () => {
    const p = 104729n;
    const q = 104743n;
    const n = p * q;
    const result = pollardRho(n);
    expect(result).not.toBeNull();
    expect(result!.p * result!.q).toBe(n);
  });

  it('factors even number', () => {
    const result = pollardRho(246n);
    expect(result).not.toBeNull();
    expect(result!.p).toBe(2n);
  });
});

describe('Common modulus attack', () => {
  it('recovers plaintext with same n, different e', () => {
    const p = 61n, q = 53n;
    const n = p * q; // 3233
    const e1 = 17n, e2 = 23n;
    const m = 42n;
    const c1 = modPow(m, e1, n);
    const c2 = modPow(m, e2, n);

    const result = commonModulusAttack(n, e1, c1, e2, c2);
    expect(result).not.toBeNull();
    expect(result!.m).toBe(m);
  });

  it('returns null when e1 and e2 are not coprime', () => {
    const n = 3233n;
    const e1 = 6n, e2 = 9n; // gcd = 3
    const c1 = 100n, c2 = 200n;
    expect(commonModulusAttack(n, e1, c1, e2, c2)).toBeNull();
  });
});

describe('Hastad broadcast attack', () => {
  it('e=3, three recipients', () => {
    const m = 42n;
    const e = 3n;
    // Three different moduli (pairwise coprime)
    const n1 = 1009n * 1013n; // 1022117
    const n2 = 1019n * 1021n; // 1040399
    const n3 = 1031n * 1033n; // 1065023
    const c1 = modPow(m, e, n1);
    const c2 = modPow(m, e, n2);
    const c3 = modPow(m, e, n3);

    const result = hastadAttack(
      [{ n: n1, c: c1 }, { n: n2, c: c2 }, { n: n3, c: c3 }],
      e,
    );
    expect(result).not.toBeNull();
    expect(result!.m).toBe(m);
  });

  it('returns null with insufficient pairs', () => {
    expect(hastadAttack([{ n: 100n, c: 50n }], 3n)).toBeNull();
  });
});

/* ================================================================== */
/*  RSA Cipher Attack operation                                        */
/* ================================================================== */

describe('RSA Cipher Attack operation', () => {
  const atk = new RSACipherAttack();

  it('Small e mode: e=3, direct cube root', async () => {
    const m = 42n;
    const n = 1000000007n;
    const c = m ** 3n;
    const result = await atk.run(c.toString(), [
      'Small e', n.toString(), '3', '', '', '', 'Decimal', 'Decimal', false,
    ]);
    expect(result).toBe('42');
  });

  it("Wiener's mode: recovers plaintext", async () => {
    const p = 1009n, q = 3643n;
    const n = p * q;
    const phi = (p - 1n) * (q - 1n);
    const d = 29n;
    const e = modInverseBig(d, phi);
    const m = 42n;
    const c = modPow(m, e, n);

    const result = await atk.run(c.toString(), [
      "Wiener's", n.toString(), e.toString(), '', '', '', 'Decimal', 'Decimal', false,
    ]);
    expect(result).toBe('42');
  });

  it('Fermat mode: close primes', async () => {
    const p = 1000003n, q = 1000033n;
    const n = p * q;
    const e = 65537n;
    const { d } = derivePrivateKey(p, q, e);
    const m = 12345n;
    const c = modPow(m, e, n);

    const result = await atk.run(c.toString(), [
      'Fermat', n.toString(), e.toString(), '', '', '', 'Decimal', 'Decimal', false,
    ]);
    expect(result).toBe('12345');
  });

  it('Common Modulus mode', async () => {
    const p = 61n, q = 53n;
    const n = p * q;
    const e1 = 17n, e2 = 23n;
    const m = 42n;
    const c1 = modPow(m, e1, n);
    const c2 = modPow(m, e2, n);

    const result = await atk.run(c1.toString(), [
      'Common Modulus', n.toString(), e1.toString(),
      c2.toString(), e2.toString(), '',
      'Decimal', 'Decimal', false,
    ]);
    expect(result).toBe('42');
  });

  it('Hastad mode: e=3, three pairs', async () => {
    const m = 42n;
    const e = 3n;
    const n1 = 1009n * 1013n;
    const n2 = 1019n * 1021n;
    const n3 = 1031n * 1033n;
    const c1 = modPow(m, e, n1);
    const c2 = modPow(m, e, n2);
    const c3 = modPow(m, e, n3);

    const pairs = JSON.stringify([
      [n2.toString(), c2.toString()],
      [n3.toString(), c3.toString()],
    ]);

    const result = await atk.run(c1.toString(), [
      'Hastad Broadcast', n1.toString(), e.toString(),
      '', '', pairs,
      'Decimal', 'Decimal', false,
    ]);
    expect(result).toBe('42');
  });

  it('Show details mode includes attack name', async () => {
    const m = 42n;
    const n = 1000000007n;
    const c = m ** 3n;
    const result = await atk.run(c.toString(), [
      'Small e', n.toString(), '3', '', '', '', 'Decimal', 'Decimal', true,
    ]);
    expect(result).toContain('[Small e');
    expect(result).toContain('42');
  });

  it('throws when no attack succeeds', async () => {
    // Use Small e with e=65537 — won't work since m^65537 >> n
    const c = modPow(500n, 65537n, 3233n);
    await expect(
      atk.run(c.toString(), [
        'Small e', '3233', '65537', '', '', '', 'Decimal', 'Decimal', false,
      ]),
    ).rejects.toThrow(/No attack succeeded/);
  });

  it('Text output format works', async () => {
    // Encrypt "Hi" with small e=3
    const m = textToBigInt('Hi');
    const n = 1000000007n;
    const c = m ** 3n; // m=18537, m^3 = 6371241177753
    const result = await atk.run(c.toString(), [
      'Small e', n.toString(), '3', '', '', '', 'Decimal', 'Text', false,
    ]);
    expect(result).toBe('Hi');
  });
});
