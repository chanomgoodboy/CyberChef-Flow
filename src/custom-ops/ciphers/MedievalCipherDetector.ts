import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Medieval Cipher Detector';

/**
 * Detection-only tool: classify input against known medieval cipher patterns.
 *
 * Checks for structures consistent with ciphers from the 14th-16th centuries:
 * - Alberti disk (mixed upper/lower with periodic markers)
 * - Trithemius progressive Caesar (IC pattern)
 * - Porta cipher (case-sensitive, half-alphabet)
 * - Nomenclator (mixed code numbers and cipher letters)
 * - Vigenère-era polyalphabetic (multiple IC signatures)
 */
class MedievalCipherDetector extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Classify ciphertext against medieval cipher patterns (Alberti, Trithemius, ' +
      'Porta, Nomenclator, early Vigenère). Analysis and classification only.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    const trimmed = input.trim();
    if (trimmed.length < 10) return 'Input too short for analysis.';

    const lines: string[] = [];
    lines.push('=== Medieval Cipher Classification ===\n');

    const candidates: { name: string; score: number; evidence: string[] }[] = [];

    const upper = trimmed.toUpperCase().replace(/[^A-Z]/g, '');
    if (upper.length < 5) {
      return 'Not enough alphabetic characters for analysis.';
    }

    // 1. Index of Coincidence
    const ic = computeIC(upper);
    lines.push(`Index of Coincidence: ${ic.toFixed(4)}`);
    lines.push(`  (English ≈ 0.0667, random ≈ 0.0385)\n`);

    // 2. Check for Nomenclator (mixed numbers and letters)
    {
      const hasNumbers = /\d/.test(trimmed);
      const hasLetters = /[A-Za-z]/.test(trimmed);
      const digitRatio = [...trimmed].filter((c) => /\d/.test(c)).length / trimmed.length;
      if (hasNumbers && hasLetters && digitRatio >= 0.1 && digitRatio <= 0.6) {
        const evidence = [
          `Mixed letters and numbers (${(digitRatio * 100).toFixed(0)}% digits)`,
          'Nomenclators used number codes for common words + cipher for the rest',
        ];
        candidates.push({ name: 'Nomenclator', score: 60, evidence });
      }
    }

    // 3. Alberti Disk (periodic uppercase markers amid lowercase)
    {
      const mixedCase = /[A-Z]/.test(trimmed) && /[a-z]/.test(trimmed);
      const upperMarkers = [...trimmed].filter((c) => /[A-Z]/.test(c));
      const lowerChars = [...trimmed].filter((c) => /[a-z]/.test(c));
      if (mixedCase && upperMarkers.length >= 2 && lowerChars.length > upperMarkers.length * 3) {
        const evidence = [
          `${upperMarkers.length} uppercase markers amid ${lowerChars.length} lowercase chars`,
          'Alberti used capital letters as disk-reset indicators',
        ];
        candidates.push({ name: 'Alberti Disk Cipher', score: 55, evidence });
      }
    }

    // 4. Trithemius / Progressive Caesar (IC should be low, near random)
    if (ic < 0.045 && ic > 0.030 && upper.length >= 20) {
      const evidence = [
        `IC = ${ic.toFixed(4)} — close to random (0.0385)`,
        'Progressive shift produces near-uniform distribution',
      ];
      candidates.push({ name: 'Trithemius Progressive Cipher', score: 50, evidence });
    }

    // 5. Porta Cipher (half-alphabet, only 13 unique chars expected in output)
    {
      const unique = new Set(upper).size;
      if (unique <= 15 && upper.length >= 20) {
        const evidence = [
          `Only ${unique} unique letters in ${upper.length} chars`,
          'Porta cipher maps to half-alphabet (13 letters)',
        ];
        candidates.push({ name: 'Porta Cipher', score: 55, evidence });
      }
    }

    // 6. Vigenère-era polyalphabetic
    if (ic >= 0.035 && ic <= 0.055 && upper.length >= 30) {
      // Kasiski examination: look for repeated trigrams
      const repeats = findRepeatedNgrams(upper, 3);
      const evidence = [
        `IC = ${ic.toFixed(4)} — between random and English`,
        `${repeats} repeated trigrams found`,
      ];
      const score = repeats >= 3 ? 65 : 45;
      candidates.push({ name: 'Vigenère / Polyalphabetic', score, evidence });
    }

    // 7. Simple substitution (IC near English)
    if (ic >= 0.055) {
      const evidence = [
        `IC = ${ic.toFixed(4)} — close to English (0.0667)`,
        'Consistent with monoalphabetic substitution',
      ];
      candidates.push({ name: 'Monoalphabetic Substitution', score: 60, evidence });
    }

    // Sort by score
    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      lines.push('No clear medieval cipher pattern identified.');
    } else {
      lines.push('Possible classifications:\n');
      for (const c of candidates) {
        lines.push(`  ${c.name} (confidence: ${c.score}%)`);
        for (const e of c.evidence) {
          lines.push(`    - ${e}`);
        }
        lines.push('');
      }
    }

    // Frequency table
    lines.push('Letter frequencies:');
    const freq = new Array(26).fill(0);
    for (const ch of upper) {
      freq[ch.charCodeAt(0) - 65]++;
    }
    const sorted = freq
      .map((f, i) => ({ letter: String.fromCharCode(65 + i), count: f, pct: (f / upper.length) * 100 }))
      .filter((e) => e.count > 0)
      .sort((a, b) => b.count - a.count);
    for (const e of sorted.slice(0, 10)) {
      lines.push(`  ${e.letter}: ${e.count} (${e.pct.toFixed(1)}%)`);
    }

    return lines.join('\n');
  }
}

function computeIC(text: string): number {
  const freq = new Array(26).fill(0);
  for (const ch of text) freq[ch.charCodeAt(0) - 65]++;
  const n = text.length;
  if (n <= 1) return 0;
  let sum = 0;
  for (const f of freq) sum += f * (f - 1);
  return sum / (n * (n - 1));
}

function findRepeatedNgrams(text: string, n: number): number {
  const seen = new Map<string, number>();
  let repeats = 0;
  for (let i = 0; i <= text.length - n; i++) {
    const gram = text.slice(i, i + n);
    const prev = seen.get(gram) ?? 0;
    if (prev === 1) repeats++; // count on second occurrence
    seen.set(gram, prev + 1);
  }
  return repeats;
}

registerCustomOp(MedievalCipherDetector, {
  name: NAME,
  module: 'Custom',
  description: 'Classify ciphertext against medieval cipher patterns.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default MedievalCipherDetector;
