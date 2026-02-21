import type { OperationMeta } from '@/adapter/types';

/**
 * Smart search that handles:
 * - Prefix matching: "b" → "Base64", "Blowfish", etc.
 * - Substring matching: "hex" → "To Hex", "From Hex", "Hex to PEM"
 * - Abbreviation/initials: "b64" → "Base64", "tb64" → "To Base64"
 * - Number-aware: "sha2" → "SHA2", "aes128" → "AES...128"
 * - Fuzzy: minor typos tolerated
 *
 * Returns results sorted by relevance score (lower = better match).
 */

export interface SearchResult {
  op: OperationMeta;
  score: number;
  matchIndices: number[]; // indices into op.name that matched the query
}

/**
 * Find subsequence match indices. Returns indices array or null if no match.
 */
function subsequenceMatch(query: string, target: string): { indices: number[]; gaps: number } | null {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  const indices: number[] = [];
  let qi = 0;
  let gaps = 0;
  let lastMatchIdx = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      if (lastMatchIdx >= 0) {
        gaps += ti - lastMatchIdx - 1;
      }
      lastMatchIdx = ti;
      indices.push(ti);
      qi++;
    }
  }

  if (qi < q.length) return null;
  return { indices, gaps };
}

/**
 * Find substring match indices within target.
 */
function substringIndices(query: string, target: string): number[] | null {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  const idx = t.indexOf(q);
  if (idx < 0) return null;
  const indices: number[] = [];
  for (let i = 0; i < q.length; i++) {
    indices.push(idx + i);
  }
  return indices;
}

/**
 * Check if the query matches as an abbreviation of word boundaries.
 */
function abbreviationMatch(query: string, target: string): number[] | null {
  const q = query.toLowerCase();
  const words = target.split(/[\s/\-_]+/);
  const boundaries: { ch: string; idx: number }[] = [];
  let offset = 0;
  for (let wi = 0; wi < words.length; wi++) {
    const word = words[wi];
    for (let i = 0; i < word.length; i++) {
      const ch = word[i].toLowerCase();
      if (i === 0 || /\d/.test(ch)) {
        boundaries.push({ ch, idx: offset + i });
      }
    }
    offset += word.length + 1; // +1 for the separator
  }

  const indices: number[] = [];
  let qi = 0;
  for (let bi = 0; bi < boundaries.length && qi < q.length; bi++) {
    if (boundaries[bi].ch === q[qi]) {
      indices.push(boundaries[bi].idx);
      qi++;
    }
  }

  if (qi >= q.length) return indices;
  return null;
}

/**
 * Compute match score and indices. Lower score = better. null = no match.
 */
function matchScore(query: string, name: string, description: string): { score: number; indices: number[] } | null {
  const q = query.toLowerCase();
  const n = name.toLowerCase();
  const nNorm = n.replace(/[\s/\-_]+/g, '');

  // 1. Exact name match
  if (n === q) {
    return { score: 0, indices: Array.from({ length: name.length }, (_, i) => i) };
  }

  // 2. Name starts with query
  if (n.startsWith(q)) {
    return { score: 1, indices: Array.from({ length: q.length }, (_, i) => i) };
  }

  // 3. Any word in the name starts with query — prefer earlier word position
  const words = name.split(/[\s/\-_]+/);
  let offset = 0;
  for (let wi = 0; wi < words.length; wi++) {
    const w = words[wi].toLowerCase();
    if (w.startsWith(q)) {
      const indices = Array.from({ length: q.length }, (_, i) => offset + i);
      // Score 2.0 for first word, 2.1 for second, etc.
      // But "From X" (word at index 1) should rank higher than "To X" (word at index 1)
      // Use word index as sub-score
      return { score: 2 + wi * 0.1, indices };
    }
    offset += words[wi].length + 1;
  }

  // 4. Normalized (no spaces) contains query as contiguous substring
  if (nNorm.includes(q)) {
    const normIdx = nNorm.indexOf(q);
    // Map normalized indices back to original
    const indices: number[] = [];
    let ni = 0;
    for (let oi = 0; oi < name.length && indices.length < q.length; oi++) {
      if (/[\s/\-_]/.test(name[oi])) continue;
      if (ni >= normIdx && ni < normIdx + q.length) {
        indices.push(oi);
      }
      ni++;
    }
    return { score: 3, indices };
  }

  // 5. Abbreviation match on word boundaries
  const abbrIndices = abbreviationMatch(q, name);
  if (abbrIndices) {
    return { score: 4, indices: abbrIndices };
  }

  // 6. Subsequence match in name
  const subMatch = subsequenceMatch(q, name);
  if (subMatch) {
    return { score: 5 + subMatch.gaps * 0.01, indices: subMatch.indices };
  }

  // 7. Subsequence match in normalized name
  const subNormMatch = subsequenceMatch(q, nNorm);
  if (subNormMatch) {
    // Map normalized indices back
    const indices: number[] = [];
    let ni = 0;
    for (let oi = 0; oi < name.length; oi++) {
      if (/[\s/\-_]/.test(name[oi])) continue;
      if (subNormMatch.indices.includes(ni)) {
        indices.push(oi);
      }
      ni++;
    }
    return { score: 6 + subNormMatch.gaps * 0.01, indices };
  }

  // 8. Description contains query as substring
  if (description.toLowerCase().includes(q)) {
    return { score: 8, indices: [] };
  }

  // 9. Subsequence in description
  const descMatch = subsequenceMatch(q, description);
  if (descMatch) {
    return { score: 9 + descMatch.gaps * 0.01, indices: [] };
  }

  return null;
}

/**
 * Multi-word match: split query into words, require ALL words to match
 * (order-independent). Score is the worst (highest) individual word score.
 */
function multiWordMatch(
  words: string[],
  name: string,
  description: string,
): { score: number; indices: number[] } | null {
  let worstScore = 0;
  const allIndices: number[] = [];

  for (const word of words) {
    const result = matchScore(word, name, description);
    if (!result) return null; // all words must match
    if (result.score > worstScore) worstScore = result.score;
    for (const idx of result.indices) {
      if (!allIndices.includes(idx)) allIndices.push(idx);
    }
  }

  allIndices.sort((a, b) => a - b);
  // Slight penalty for multi-word vs single-token match
  return { score: worstScore + 0.5, indices: allIndices };
}

/**
 * Search operations with smart matching. Returns sorted results with match indices.
 */
export function smartSearch(
  ops: OperationMeta[],
  query: string,
  limit = 50,
): SearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const words = q.split(/\s+/).filter(Boolean);
  const isMultiWord = words.length > 1;

  const scored: SearchResult[] = [];

  for (const op of ops) {
    // Try full query as a single token first
    const singleResult = matchScore(q, op.name, op.description);

    // Try multi-word (order-independent) if query has spaces
    const multiResult = isMultiWord
      ? multiWordMatch(words, op.name, op.description)
      : null;

    // Pick the best (lowest score) match
    const best =
      singleResult && multiResult
        ? singleResult.score <= multiResult.score
          ? singleResult
          : multiResult
        : singleResult ?? multiResult;

    if (best) {
      scored.push({ op, score: best.score, matchIndices: best.indices });
    }
  }

  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit);
}
