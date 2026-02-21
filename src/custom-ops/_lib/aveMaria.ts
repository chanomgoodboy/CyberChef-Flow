/**
 * Trithemius Ave Maria cipher
 *
 * Each letter of the alphabet maps to a Latin word, so that the ciphertext
 * reads like a devotional prayer. The original table comes from
 * Trithemius's *Polygraphiae* (1518). This is a simplified 26-word version
 * (one word per letter A-Z).
 */

export const AVE_MARIA_TABLE: string[] = [
  'Deus',       // A
  'clemens',    // B
  'creator',    // C
  'coelestis',  // D (originally co-elestis)
  'aeternus',   // E
  'fidelis',    // F
  'gloriosus',  // G
  'humilis',    // H
  'immortalis', // I
  'justus',     // J
  'laudabilis', // K
  'magnificus', // L
  'misericors', // M
  'nobilis',    // N
  'omnipotens', // O
  'pius',       // P
  'potens',     // Q
  'regens',     // R
  'salvator',   // S
  'trinitas',   // T
  'unitas',     // U
  'veritas',    // V
  'virtus',     // W
  'excelsus',   // X
  'zelator',    // Y
  'altissimus', // Z
];

// Reverse map: lowercase word → letter index (0-based)
export const AVE_MARIA_REVERSE: Record<string, number> = {};
for (let i = 0; i < AVE_MARIA_TABLE.length; i++) {
  AVE_MARIA_REVERSE[AVE_MARIA_TABLE[i].toLowerCase()] = i;
}
