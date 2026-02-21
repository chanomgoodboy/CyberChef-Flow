import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'McCormick Cipher Detector';

/**
 * Detection-only tool: analyzes input for patterns consistent with
 * Ricky McCormick's unsolved cipher notes (found 1999).
 *
 * McCormick's notes are characterized by:
 * - Mix of uppercase letters, digits, and punctuation
 * - Short "words" (2-5 chars) separated by spaces or line breaks
 * - Frequent parentheses and slashes
 * - No recognizable English words
 * - Letters N, S, E, W (compass directions) are overrepresented
 * - High proportion of consonant clusters
 */
class McCormickDetector extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Analyze input for structural patterns similar to Ricky McCormick\'s ' +
      'unsolved cipher notes. Detection and analysis only — the cipher remains unsolved.';
    this.infoURL = 'https://www.dcode.fr/ricky-mccormick-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    const trimmed = input.trim();
    if (trimmed.length < 10) return 'Input too short for analysis.';

    const lines: string[] = [];
    const chars = [...trimmed];
    const total = chars.length;

    // Character class analysis
    const letters = chars.filter((c) => /[A-Za-z]/.test(c)).length;
    const digits = chars.filter((c) => /[0-9]/.test(c)).length;
    const parens = chars.filter((c) => c === '(' || c === ')').length;
    const slashes = chars.filter((c) => c === '/').length;
    const spaces = chars.filter((c) => c === ' ').length;

    lines.push('=== McCormick Cipher Pattern Analysis ===\n');
    lines.push(`Total characters: ${total}`);
    lines.push(`Letters: ${letters} (${((letters / total) * 100).toFixed(1)}%)`);
    lines.push(`Digits: ${digits} (${((digits / total) * 100).toFixed(1)}%)`);
    lines.push(`Parentheses: ${parens}`);
    lines.push(`Slashes: ${slashes}`);

    // Word length analysis
    const words = trimmed.split(/\s+/).filter(Boolean);
    const avgLen = words.reduce((s, w) => s + w.length, 0) / (words.length || 1);
    const shortWords = words.filter((w) => w.length <= 5).length;

    lines.push(`\nWord count: ${words.length}`);
    lines.push(`Average word length: ${avgLen.toFixed(1)}`);
    lines.push(`Short words (≤5 chars): ${shortWords} (${((shortWords / (words.length || 1)) * 100).toFixed(1)}%)`);

    // Compass letters
    const upper = trimmed.toUpperCase();
    const compassCount = [...upper].filter((c) => 'NSEW'.includes(c)).length;
    const letterOnly = [...upper].filter((c) => /[A-Z]/.test(c));
    const compassPct = letterOnly.length > 0 ? (compassCount / letterOnly.length) * 100 : 0;
    lines.push(`\nCompass letters (N/S/E/W): ${compassCount} (${compassPct.toFixed(1)}% of letters)`);

    // English word check
    const COMMON = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'way', 'who', 'did', 'get', 'let', 'say', 'she', 'too', 'use', 'this', 'that', 'with', 'have', 'from', 'they', 'been', 'said', 'each', 'which', 'their', 'will', 'other', 'about', 'there', 'would']);
    const englishCount = words.filter((w) => COMMON.has(w.toLowerCase())).length;
    lines.push(`Common English words found: ${englishCount}`);

    // Scoring
    let score = 0;
    const reasons: string[] = [];

    // Short words dominant
    if (avgLen <= 4 && avgLen >= 1.5) { score += 20; reasons.push('short word lengths'); }
    // Mixed alphanumeric
    if (letters > 0 && digits > 0 && digits / total > 0.05) { score += 15; reasons.push('mixed letters and digits'); }
    // Parentheses present
    if (parens >= 2) { score += 10; reasons.push('parentheses usage'); }
    // Slashes present
    if (slashes >= 1) { score += 10; reasons.push('slash separators'); }
    // Low English word rate
    if (englishCount <= 1 && words.length >= 5) { score += 15; reasons.push('no recognizable English words'); }
    // Compass overrepresentation
    if (compassPct >= 20) { score += 15; reasons.push('compass letters overrepresented'); }
    // Uppercase dominant
    const upperCount = chars.filter((c) => /[A-Z]/.test(c)).length;
    if (upperCount > letters * 0.7) { score += 15; reasons.push('predominantly uppercase'); }

    lines.push(`\n=== Similarity Score: ${score}/100 ===`);
    if (reasons.length > 0) {
      lines.push(`Matching features: ${reasons.join(', ')}`);
    }

    if (score >= 60) {
      lines.push('\nHigh similarity to McCormick cipher patterns.');
    } else if (score >= 30) {
      lines.push('\nModerate similarity to McCormick cipher patterns.');
    } else {
      lines.push('\nLow similarity to McCormick cipher patterns.');
    }

    return lines.join('\n');
  }
}

registerCustomOp(McCormickDetector, {
  name: NAME,
  module: 'Custom',
  description: 'Detect patterns similar to Ricky McCormick\'s unsolved cipher.',
  infoURL: 'https://www.dcode.fr/ricky-mccormick-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default McCormickDetector;
