/**
 * Textbook RSA math library — pure BigInt, no external deps.
 *
 * Provides:
 * - Core math: modPow, extGcd, modInverseBig, gcd, isqrt, iroot
 * - Key derivation: derivePrivateKey
 * - Conversions: bytes/text ↔ BigInt, format parsing
 * - Attacks: smallE, Wiener, Fermat, Pollard p-1, Common Modulus, Hastad, FactorDB
 */

/* ------------------------------------------------------------------ */
/*  Core math                                                          */
/* ------------------------------------------------------------------ */

/** Square-and-multiply modular exponentiation: base^exp mod mod. */
export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  if (mod === 0n) throw new Error('Modulus must be non-zero');
  if (mod === 1n) return 0n;
  base = ((base % mod) + mod) % mod;
  let result = 1n;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    exp >>= 1n;
    base = (base * base) % mod;
  }
  return result;
}

/** Extended Euclidean algorithm → [gcd, x, y] where a*x + b*y = gcd. */
export function extGcd(a: bigint, b: bigint): [bigint, bigint, bigint] {
  if (b === 0n) return [a, 1n, 0n];
  const [g, x1, y1] = extGcd(b, a % b);
  return [g, y1, x1 - (a / b) * y1];
}

/** Modular multiplicative inverse of a mod m. Throws if gcd(a,m) ≠ 1. */
export function modInverseBig(a: bigint, m: bigint): bigint {
  const [g, x] = extGcd(((a % m) + m) % m, m);
  if (g !== 1n) throw new Error(`No modular inverse: gcd(${a}, ${m}) = ${g}`);
  return ((x % m) + m) % m;
}

/** Greatest common divisor. */
export function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

/** Integer square root via Newton's method (floor). */
export function isqrt(n: bigint): bigint {
  if (n < 0n) throw new Error('Square root of negative number');
  if (n < 2n) return n;
  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
}

/** Integer kth root via Newton's method (floor). k must be small (≤100). */
export function iroot(n: bigint, k: number): bigint {
  if (n < 0n) throw new Error('Root of negative number');
  if (n === 0n) return 0n;
  if (k === 1) return n;
  if (k === 2) return isqrt(n);
  if (k > 100) throw new Error('k too large for integer root computation');

  const kBig = BigInt(k);
  const km1 = kBig - 1n;

  // Initial guess from bit length
  const bits = n.toString(2).length;
  let x = 1n << BigInt(Math.ceil(bits / k) + 1);

  // Newton iteration: x_new = ((k-1)*x + n / x^(k-1)) / k
  for (let i = 0; i < 10000; i++) {
    const xkm1 = bigPow(x, km1);
    const xnew = (km1 * x + n / xkm1) / kBig;
    if (xnew >= x) break;
    x = xnew;
  }

  // Fine-tune
  while (bigPow(x + 1n, kBig) <= n) x++;
  while (x > 0n && bigPow(x, kBig) > n) x--;

  return x;
}

/** Simple BigInt power (for small exponents, not modular). */
function bigPow(base: bigint, exp: bigint): bigint {
  let result = 1n;
  let b = base;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result *= b;
    e >>= 1n;
    if (e > 0n) b *= b;
  }
  return result;
}

/**
 * Chinese Remainder Theorem.
 * Given pairwise coprime moduli, find x such that x ≡ r_i mod m_i for all i.
 */
export function crt(remainders: bigint[], moduli: bigint[]): bigint {
  if (remainders.length !== moduli.length || remainders.length === 0)
    throw new Error('CRT: remainders and moduli must have equal non-zero length');

  const N = moduli.reduce((a, b) => a * b, 1n);
  let result = 0n;
  for (let i = 0; i < moduli.length; i++) {
    const Ni = N / moduli[i];
    const xi = modInverseBig(Ni, moduli[i]);
    result = (result + remainders[i] * Ni * xi) % N;
  }
  return ((result % N) + N) % N;
}

/** Derive RSA private key from primes and public exponent. */
export function derivePrivateKey(
  p: bigint,
  q: bigint,
  e: bigint,
): { d: bigint; n: bigint; phi: bigint } {
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  const d = modInverseBig(e, phi);
  return { d, n, phi };
}

/* ------------------------------------------------------------------ */
/*  Byte / text ↔ BigInt conversions                                   */
/* ------------------------------------------------------------------ */

/** Big-endian bytes → BigInt (matches Python int.from_bytes(b, 'big')). */
export function bytesToBigInt(bytes: Uint8Array): bigint {
  if (bytes.length === 0) return 0n;
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return BigInt('0x' + hex);
}

/** BigInt → big-endian bytes. */
export function bigIntToBytes(n: bigint): Uint8Array {
  if (n === 0n) return new Uint8Array([0]);
  if (n < 0n) throw new Error('Cannot convert negative BigInt to bytes');
  let hex = n.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** UTF-8 text → BigInt via byte encoding. */
export function textToBigInt(text: string): bigint {
  const encoded = new TextEncoder().encode(text);
  return bytesToBigInt(encoded);
}

/** BigInt → UTF-8 text via byte decoding. */
export function bigIntToText(n: bigint): string {
  if (n === 0n) return '\0';
  const bytes = bigIntToBytes(n);
  return new TextDecoder().decode(bytes);
}

/* ------------------------------------------------------------------ */
/*  Format parsing / formatting                                        */
/* ------------------------------------------------------------------ */

export type BigIntFormat = 'Text' | 'Decimal' | 'Hex';

/** Parse an input string to BigInt based on format. */
export function parseBigIntInput(input: string, format: BigIntFormat): bigint {
  switch (format) {
    case 'Text':
      return textToBigInt(input);
    case 'Decimal': {
      const cleaned = input.trim();
      if (!/^-?\d+$/.test(cleaned)) throw new Error('Invalid decimal number');
      return BigInt(cleaned);
    }
    case 'Hex': {
      let cleaned = input.trim();
      if (cleaned.startsWith('0x') || cleaned.startsWith('0X'))
        cleaned = cleaned.slice(2);
      if (!/^[0-9a-fA-F]+$/.test(cleaned)) throw new Error('Invalid hex number');
      return BigInt('0x' + cleaned);
    }
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

/** Format a BigInt as a string based on format. */
export function formatBigIntOutput(n: bigint, format: BigIntFormat): string {
  switch (format) {
    case 'Text':
      return bigIntToText(n);
    case 'Decimal':
      return n.toString(10);
    case 'Hex':
      return n.toString(16);
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

/* ================================================================== */
/*  RSA Attacks                                                        */
/* ================================================================== */

export interface AttackResult {
  attack: string;
  m: bigint;
  details: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/*  Small e attack (eth root)                                          */
/* ------------------------------------------------------------------ */

/**
 * When e is small and m^e < n, the ciphertext c = m^e (no modular reduction).
 * Just take the integer eth root.
 */
export function smallEAttack(c: bigint, e: bigint, n: bigint): AttackResult | null {
  if (e > 100n) return null; // only practical for small e
  const m = iroot(c, Number(e));
  if (m <= 0n) return null;

  // Verify: m^e must equal c (not mod n — that's the whole point)
  if (bigPow(m, e) === c) {
    return {
      attack: 'Small e (eth root)',
      m,
      details: { e: e.toString(), note: 'm^e < n, no modular reduction' },
    };
  }

  // Also try with small multiples of n added (m^e = c + k*n for small k)
  for (let k = 1n; k <= 100n; k++) {
    const candidate = iroot(c + k * n, Number(e));
    if (candidate > 0n && bigPow(candidate, e) === c + k * n) {
      return {
        attack: 'Small e (eth root + k*n)',
        m: candidate,
        details: { e: e.toString(), k: k.toString() },
      };
    }
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  Wiener's attack (small d via continued fractions)                   */
/* ------------------------------------------------------------------ */

/** Continued fraction expansion of num/den. */
function continuedFraction(num: bigint, den: bigint): bigint[] {
  const cf: bigint[] = [];
  while (den !== 0n) {
    const q = num / den;
    cf.push(q);
    [num, den] = [den, num - q * den];
  }
  return cf;
}

/** Convergents h_k/k_k of a continued fraction. */
function convergents(cf: bigint[]): [bigint, bigint][] {
  const convs: [bigint, bigint][] = [];
  let h_prev = 0n, h_curr = 1n;
  let k_prev = 1n, k_curr = 0n;
  for (const a of cf) {
    const h_next = a * h_curr + h_prev;
    const k_next = a * k_curr + k_prev;
    convs.push([h_next, k_next]);
    h_prev = h_curr; h_curr = h_next;
    k_prev = k_curr; k_curr = k_next;
  }
  return convs;
}

/**
 * Wiener's attack: when d < n^(1/4) / 3, the continued fraction
 * expansion of e/n reveals d.
 */
export function wienerAttack(
  e: bigint,
  n: bigint,
  c?: bigint,
): AttackResult | null {
  const cf = continuedFraction(e, n);
  const convs = convergents(cf);

  for (const [k, d] of convs) {
    if (k === 0n || d <= 0n) continue;

    const ed1 = e * d - 1n;
    if (ed1 % k !== 0n) continue;

    const phi = ed1 / k;

    // p + q = n - phi + 1
    const s = n - phi + 1n;
    const discriminant = s * s - 4n * n;
    if (discriminant < 0n) continue;

    const sqrtD = isqrt(discriminant);
    if (sqrtD * sqrtD !== discriminant) continue;

    const p = (s + sqrtD) / 2n;
    const q = (s - sqrtD) / 2n;

    if (p > 0n && q > 0n && p * q === n) {
      const result: AttackResult = {
        attack: "Wiener's attack",
        m: 0n,
        details: { d: d.toString(), p: p.toString(), q: q.toString(), phi: phi.toString() },
      };
      if (c !== undefined) {
        result.m = modPow(c, d, n);
      }
      return result;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Fermat factorization (close primes)                                */
/* ------------------------------------------------------------------ */

/**
 * Fermat's method: works when p and q are close (|p - q| is small).
 * n = a^2 - b^2 = (a+b)(a-b).
 */
export function fermatFactor(
  n: bigint,
  maxIter: number = 1000000,
): { p: bigint; q: bigint } | null {
  if (n % 2n === 0n) return { p: 2n, q: n / 2n };

  let a = isqrt(n);
  if (a * a === n) return { p: a, q: a };
  if (a * a < n) a++;

  for (let i = 0; i < maxIter; i++) {
    const b2 = a * a - n;
    const b = isqrt(b2);
    if (b * b === b2) {
      const p = a + b;
      const q = a - b;
      if (p > 1n && q > 1n) return { p, q };
    }
    a++;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Pollard p-1                                                        */
/* ------------------------------------------------------------------ */

/** Simple sieve to generate primes up to limit. */
function smallPrimes(limit: number): number[] {
  const sieve = new Uint8Array(limit + 1);
  for (let i = 2; i * i <= limit; i++) {
    if (!sieve[i]) {
      for (let j = i * i; j <= limit; j += i) sieve[j] = 1;
    }
  }
  const primes: number[] = [];
  for (let i = 2; i <= limit; i++) {
    if (!sieve[i]) primes.push(i);
  }
  return primes;
}

/**
 * Pollard's p-1: works when p-1 has only small prime factors (B-smooth).
 */
export function pollardPm1(
  n: bigint,
  B: number = 100000,
): { p: bigint; q: bigint } | null {
  const primes = smallPrimes(B);
  let a = 2n;

  for (const p of primes) {
    // Raise a to p^k where p^k <= B
    let pk = p;
    while (pk * p <= B) pk *= p;
    a = modPow(a, BigInt(pk), n);

    const g = gcd(a - 1n, n);
    if (g > 1n && g < n) {
      return { p: g, q: n / g };
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Pollard rho                                                        */
/* ------------------------------------------------------------------ */

/**
 * Pollard's rho: general-purpose probabilistic factorization.
 * Uses Brent's improvement with cycle detection.
 */
export function pollardRho(
  n: bigint,
  maxIter: number = 1000000,
): { p: bigint; q: bigint } | null {
  if (n % 2n === 0n) return { p: 2n, q: n / 2n };
  if (n % 3n === 0n) return { p: 3n, q: n / 3n };

  // Try several random starting values
  for (let c = 1n; c < 20n; c++) {
    const f = (x: bigint) => (x * x + c) % n;
    let x = 2n;
    let y = 2n;
    let d = 1n;

    let iter = 0;
    while (d === 1n && iter < maxIter) {
      x = f(x);
      y = f(f(y));
      d = gcd(x > y ? x - y : y - x, n);
      iter++;
    }

    if (d !== 1n && d !== n) {
      return { p: d, q: n / d };
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Common modulus attack                                               */
/* ------------------------------------------------------------------ */

/**
 * Common modulus attack: same message encrypted with same n, different e.
 * Requires gcd(e1, e2) = 1. Computes m = c1^s1 * c2^s2 mod n
 * where e1*s1 + e2*s2 = 1.
 */
export function commonModulusAttack(
  n: bigint,
  e1: bigint,
  c1: bigint,
  e2: bigint,
  c2: bigint,
): AttackResult | null {
  const [g, s1, s2] = extGcd(e1, e2);
  if (g !== 1n) return null;

  let part1: bigint;
  let part2: bigint;

  if (s1 < 0n) {
    part1 = modPow(modInverseBig(c1, n), -s1, n);
  } else {
    part1 = modPow(c1, s1, n);
  }

  if (s2 < 0n) {
    part2 = modPow(modInverseBig(c2, n), -s2, n);
  } else {
    part2 = modPow(c2, s2, n);
  }

  const m = (part1 * part2) % n;
  return {
    attack: 'Common modulus',
    m,
    details: { s1: s1.toString(), s2: s2.toString() },
  };
}

/* ------------------------------------------------------------------ */
/*  Hastad broadcast attack                                            */
/* ------------------------------------------------------------------ */

/**
 * Hastad's broadcast attack: same message sent to e recipients with
 * same small e but different n. Uses CRT then takes eth root.
 */
export function hastadAttack(
  pairs: { n: bigint; c: bigint }[],
  e: bigint,
): AttackResult | null {
  const needed = Number(e);
  if (pairs.length < needed) return null;
  if (needed > 100) return null; // impractical for large e

  const selected = pairs.slice(0, needed);
  const remainders = selected.map((p) => p.c);
  const moduli = selected.map((p) => p.n);

  const combined = crt(remainders, moduli);
  const m = iroot(combined, needed);

  // Verify
  if (bigPow(m, e) === combined) {
    return {
      attack: 'Hastad broadcast',
      m,
      details: { e: e.toString(), pairs: needed.toString() },
    };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  FactorDB API                                                       */
/* ------------------------------------------------------------------ */

export interface FactorDBResult {
  status: string;
  factors: [bigint, number][];
}

/**
 * Query FactorDB API for the factorization of n.
 * Returns null on network/CORS error or if n is not factored.
 */
export async function fetchFactorDB(n: bigint): Promise<FactorDBResult | null> {
  try {
    const url = `https://factordb.com/api?query=${n.toString()}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    // Status: FF = fully factored, CF = composite fully factored,
    // P = prime, Prp = probable prime, C = composite (no factors known)
    const status = data.status as string;

    const factors: [bigint, number][] = (
      data.factors as [string, number][]
    ).map(([f, exp]) => [BigInt(f), exp]);

    return { status, factors };
  } catch {
    return null;
  }
}

/**
 * Try to factor n using FactorDB and derive d.
 * Returns the two largest prime factors for RSA decryption.
 */
export async function factorDBAttack(
  n: bigint,
  e: bigint,
  c: bigint,
): Promise<AttackResult | null> {
  const result = await fetchFactorDB(n);
  if (!result) return null;

  if (result.status !== 'FF' && result.status !== 'CF') return null;

  // Extract prime factors
  const primeFactors = result.factors.filter(([, exp]) => exp >= 1);
  if (primeFactors.length < 2) return null;

  // Compute Euler's totient for arbitrary factorization
  // phi(n) = n * product((1 - 1/p) for each prime p dividing n)
  // For n = p1^a1 * p2^a2 * ...: phi = product(p_i^(a_i-1) * (p_i - 1))
  let phi = 1n;
  for (const [p, a] of primeFactors) {
    phi *= bigPow(p, BigInt(a - 1)) * (p - 1n);
  }

  try {
    const d = modInverseBig(e, phi);
    const m = modPow(c, d, n);
    const factorStrs = primeFactors.map(([p, a]) => a === 1 ? p.toString() : `${p}^${a}`);
    return {
      attack: 'FactorDB',
      m,
      details: {
        factors: factorStrs.join(' × '),
        d: d.toString(),
        phi: phi.toString(),
      },
    };
  } catch {
    return null; // e not coprime with phi
  }
}
