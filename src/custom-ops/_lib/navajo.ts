/**
 * Navajo Code Talker dictionary.
 * Each letter has one or more Navajo word translations.
 * Based on the WWII code talker table.
 */

export const NAVAJO_TABLE: Record<string, string[]> = {
  A: ['WOL-LA-CHEE', 'BE-LA-SANA', 'TSE-NILL'],
  B: ['NA-HASH-CHID', 'SHUSH', 'TOISH-JEH'],
  C: ['MOASI', 'TLA-GIN', 'BA-GOSHI'],
  D: ['BE', 'CHINDI', 'LHA-CHA-EH'],
  E: ['AH-JAH', 'DZEH', 'AH-NAH'],
  F: ['CHUO', 'TSA-E-DONIN-EE', 'MA-E'],
  G: ['AH-TAD', 'KLIZZIE', 'JEHA'],
  H: ['TSE-GAH', 'CHA', 'LIN'],
  I: ['TKIN', 'YEH-HES', 'A-CHI'],
  J: ['TKELE-CHO-G', 'AH-YA-TSINNE', 'YIL-DOI'],
  K: ['KLIZZIE-YAZZIE', 'BA-AH-NE-DI-TININ', 'JAD-HO-LONI'],
  L: ['DIBEH-YAZZIE', 'AH-JAD', 'NASH-DOIE-TSO'],
  M: ['TSIN-TLITI', 'BE-TAS-TNI', 'NA-AS-TSO-SI'],
  N: ['TSAH', 'A-CHIN'],
  O: ['A-KHA', 'TLO-CHIN', 'NE-AHS-JAH'],
  P: ['CLA-GI-AIH', 'BI-SO-DIH', 'NE-ZHONI'],
  Q: ['CA-YEILTH'],
  R: ['GAH', 'DAH-NES-TSA', 'AH-LOSZ'],
  S: ['DIBEH', 'KLESH'],
  T: ['D-AH', 'A-WOH', 'THAN-ZIE'],
  U: ['SHI-DA', 'NO-DA-IH'],
  V: ['A-KEH-DI-GLINI'],
  W: ['GLOE-IH', 'AH-LASZ'],
  X: ['AL-NA-AS-DZOH'],
  Y: ['TSAH-AS-ZIH', 'A-KEAD'],
  Z: ['BESH-DO-TLIZ', 'NAHL-KIHD'],
};

/** Reverse lookup: Navajo word → letter. */
export const NAVAJO_REVERSE: Record<string, string> = {};
for (const [letter, words] of Object.entries(NAVAJO_TABLE)) {
  for (const word of words) {
    NAVAJO_REVERSE[word] = letter;
  }
}
