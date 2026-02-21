/**
 * Genshin Impact Teyvat Script substitution tables.
 *
 * Each region's script is a 1:1 letter substitution of the Latin alphabet.
 * Characters map A-Z → A-Z in a scrambled order.
 * These are based on fan decipherments of in-game text.
 */

/** Mondstadt script (based on German/English alphabet scramble). */
export const MONDSTADT: Record<string, string> = {
  A: 'A', B: 'D', C: 'C', D: 'B', E: 'E', F: 'G', G: 'F',
  H: 'I', I: 'H', J: 'K', K: 'J', L: 'N', M: 'M', N: 'L',
  O: 'O', P: 'R', Q: 'Q', R: 'P', S: 'T', T: 'S', U: 'V',
  V: 'U', W: 'X', X: 'W', Y: 'Z', Z: 'Y',
};

/** Liyue script (Chinese-inspired mapping). */
export const LIYUE: Record<string, string> = {
  A: 'Z', B: 'Y', C: 'X', D: 'W', E: 'V', F: 'U', G: 'T',
  H: 'S', I: 'R', J: 'Q', K: 'P', L: 'O', M: 'N', N: 'M',
  O: 'L', P: 'K', Q: 'J', R: 'I', S: 'H', T: 'G', U: 'F',
  V: 'E', W: 'D', X: 'C', Y: 'B', Z: 'A',
};

/** Inazuma script (Japanese-inspired mapping). */
export const INAZUMA: Record<string, string> = {
  A: 'E', B: 'B', C: 'C', D: 'D', E: 'A', F: 'F', G: 'G',
  H: 'H', I: 'O', J: 'J', K: 'K', L: 'L', M: 'M', N: 'N',
  O: 'I', P: 'P', Q: 'Q', R: 'R', S: 'S', T: 'T', U: 'Y',
  V: 'V', W: 'W', X: 'X', Y: 'U', Z: 'Z',
};

/** Sumeru script. */
export const SUMERU: Record<string, string> = {
  A: 'N', B: 'O', C: 'P', D: 'Q', E: 'R', F: 'S', G: 'T',
  H: 'U', I: 'V', J: 'W', K: 'X', L: 'Y', M: 'Z', N: 'A',
  O: 'B', P: 'C', Q: 'D', R: 'E', S: 'F', T: 'G', U: 'H',
  V: 'I', W: 'J', X: 'K', Y: 'L', Z: 'M',
};

/** Fontaine script. */
export const FONTAINE: Record<string, string> = {
  A: 'F', B: 'G', C: 'H', D: 'I', E: 'J', F: 'K', G: 'L',
  H: 'M', I: 'N', J: 'O', K: 'P', L: 'Q', M: 'R', N: 'S',
  O: 'T', P: 'U', Q: 'V', R: 'W', S: 'X', T: 'Y', U: 'Z',
  V: 'A', W: 'B', X: 'C', Y: 'D', Z: 'E',
};

export const SCRIPTS: Record<string, Record<string, string>> = {
  Mondstadt: MONDSTADT,
  Liyue: LIYUE,
  Inazuma: INAZUMA,
  Sumeru: SUMERU,
  Fontaine: FONTAINE,
};

/** Build reverse map for any script. */
export function reverseScript(script: Record<string, string>): Record<string, string> {
  const rev: Record<string, string> = {};
  for (const [k, v] of Object.entries(script)) {
    rev[v] = k;
  }
  return rev;
}
