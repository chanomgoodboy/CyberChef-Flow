/**
 * Phonetic alphabet systems for spelling out letters.
 */

export const PHONETIC_SYSTEMS: Record<string, string[]> = {
  French: [
    'Anatole', 'Berthe', 'Celestin', 'Desire', 'Eugene', 'Francois',
    'Gaston', 'Henri', 'Irma', 'Joseph', 'Kleber', 'Louis', 'Marcel',
    'Nicolas', 'Oscar', 'Pierre', 'Quintal', 'Raoul', 'Suzanne',
    'Therese', 'Ursule', 'Victor', 'William', 'Xavier', 'Yvonne', 'Zoe',
  ],
  German: [
    'Anton', 'Berta', 'Casar', 'Dora', 'Emil', 'Friedrich',
    'Gustav', 'Heinrich', 'Ida', 'Julius', 'Kaufmann', 'Ludwig', 'Martha',
    'Nordpol', 'Otto', 'Paula', 'Quelle', 'Richard', 'Samuel',
    'Theodor', 'Ulrich', 'Viktor', 'Wilhelm', 'Xanthippe', 'Ypsilon', 'Zacharias',
  ],
  LAPD: [
    'Adam', 'Boy', 'Charles', 'David', 'Edward', 'Frank',
    'George', 'Henry', 'Ida', 'John', 'King', 'Lincoln', 'Mary',
    'Nora', 'Ocean', 'Paul', 'Queen', 'Robert', 'Sam',
    'Tom', 'Union', 'Victor', 'William', 'X-ray', 'Young', 'Zebra',
  ],
  Italian: [
    'Ancona', 'Bologna', 'Como', 'Domodossola', 'Empoli', 'Firenze',
    'Genova', 'Hotel', 'Imola', 'Jolly', 'Kappa', 'Livorno', 'Milano',
    'Napoli', 'Otranto', 'Padova', 'Quadro', 'Roma', 'Savona',
    'Torino', 'Udine', 'Venezia', 'Washington', 'Xilofono', 'Yacht', 'Zara',
  ],
  Spanish: [
    'Antonio', 'Barcelona', 'Carmen', 'Dolores', 'Enrique', 'Francia',
    'Gerona', 'Historia', 'Ines', 'Jose', 'Kilo', 'Lorenzo', 'Madrid',
    'Navarra', 'Oviedo', 'Paris', 'Querido', 'Ramon', 'Sabado',
    'Tarragona', 'Ulises', 'Valencia', 'Washington', 'Xiquena', 'Yegua', 'Zamora',
  ],
};

/** Build reverse lookups: word → letter index. */
export function buildPhoneticReverse(system: string): Record<string, number> {
  const words = PHONETIC_SYSTEMS[system];
  if (!words) return {};
  const rev: Record<string, number> = {};
  for (let i = 0; i < words.length; i++) {
    rev[words[i].toUpperCase()] = i;
  }
  return rev;
}
