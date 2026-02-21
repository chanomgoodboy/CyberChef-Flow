/** Standard uppercase Latin alphabet. */
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Modulo that always returns a non-negative result. */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/**
 * Modular multiplicative inverse of `a` mod `m` using extended Euclidean algorithm.
 * Returns -1 if no inverse exists (gcd(a,m) !== 1).
 */
export function modInverse(a: number, m: number): number {
  a = mod(a, m);
  for (let x = 1; x < m; x++) {
    if (mod(a * x, m) === 1) return x;
  }
  return -1;
}

/**
 * Build a keyword alphabet: the keyword's unique letters followed
 * by the remaining alphabet letters in order.
 *
 * @param keyword - The keyword (case-insensitive)
 * @param alphabet - Base alphabet (default A-Z)
 */
export function keywordAlphabet(
  keyword: string,
  alphabet: string = ALPHABET,
): string {
  const upper = keyword.toUpperCase().replace(/[^A-Z]/g, '');
  const seen = new Set<string>();
  let result = '';
  for (const ch of upper) {
    if (!seen.has(ch)) {
      seen.add(ch);
      result += ch;
    }
  }
  for (const ch of alphabet) {
    if (!seen.has(ch)) {
      seen.add(ch);
      result += ch;
    }
  }
  return result;
}
