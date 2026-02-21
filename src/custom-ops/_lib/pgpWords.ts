/**
 * PGP Word List — biometric word list for reading hex fingerprints aloud.
 * Even-position bytes use 2-syllable words, odd-position use 3-syllable words.
 * Standard PGP word list: 256 words × 2 positions = 512 total.
 */

export const PGP_EVEN: string[] = [
  'aardvark', 'absurd', 'accrue', 'acme', 'adrift', 'adult', 'afflict', 'ahead',
  'aimless', 'Algol', 'allow', 'alone', 'ammo', 'ancient', 'apple', 'artist',
  'assume', 'Athens', 'atlas', 'Aztec', 'baboon', 'backfield', 'backward', 'banjo',
  'beaming', 'bedlamp', 'beehive', 'beeswax', 'befriend', 'Belfast', 'berserk', 'billiard',
  'bison', 'blackjack', 'blockade', 'blowtorch', 'bluebird', 'bombast', 'bookshelf', 'brackish',
  'breadline', 'breakup', 'brickyard', 'briefcase', 'Burbank', 'button', 'buzzard', 'cement',
  'chairlift', 'chatter', 'checkup', 'chessman', 'chivalry', 'citrus', 'classic', 'cleanup',
  'clockwork', 'cobra', 'commence', 'concert', 'cowbell', 'crackdown', 'cranky', 'crowfoot',
  'crucial', 'crumpled', 'crusade', 'cubic', 'dashboard', 'deadbolt', 'deckhand', 'dogsled',
  'dragnet', 'drainage', 'dreadful', 'drifter', 'dromedary', 'drumbeat', 'drunken', 'Dupont',
  'dwelling', 'eating', 'edict', 'egghead', 'eightball', 'endorse', 'endow', 'enlist',
  'erase', 'escape', 'exceed', 'eyeglass', 'eyetooth', 'facial', 'fallout', 'flagpole',
  'flatfoot', 'flytrap', 'fracture', 'framework', 'freedom', 'frighten', 'gazelle', 'Geiger',
  'glitter', 'glucose', 'goggles', 'goldfish', 'gremlin', 'guidance', 'hamlet', 'highchair',
  'hockey', 'indoors', 'indulge', 'inverse', 'involve', 'island', 'jawbone', 'keyboard',
  'kickoff', 'kiwi', 'klaxon', 'locale', 'lockup', 'merit', 'minnow', 'miser',
  'Mohawk', 'mural', 'music', 'necklace', 'Neptune', 'newborn', 'nightbird', 'Oakland',
  'obtuse', 'offload', 'optic', 'orca', 'payday', 'peachy', 'pheasant', 'physique',
  'playhouse', 'Pluto', 'preclude', 'prefer', 'preshrunk', 'printer', 'prowl', 'pupil',
  'puppy', 'python', 'quadrant', 'quiver', 'quota', 'ragtime', 'ratchet', 'rebirth',
  'reform', 'regain', 'reindeer', 'rematch', 'repay', 'retouch', 'revenge', 'reward',
  'rhythm', 'ribcage', 'ringbolt', 'robust', 'rocker', 'ruffled', 'sailboat', 'sawdust',
  'scallion', 'scenic', 'scorecard', 'Scotland', 'seabird', 'select', 'sentence', 'shadow',
  'shamrock', 'showdown', 'shrivel', 'shutdown', 'sidewalk', 'simulate', 'singular', 'skipper',
  'slogan', 'slowdown', 'snapline', 'snapshot', 'snowcap', 'snowslide', 'solo', 'southward',
  'soybean', 'spaniel', 'spearhead', 'spellbound', 'spheroid', 'spigot', 'spindle', 'spyglass',
  'stagehand', 'stagnate', 'stairway', 'standard', 'stapler', 'steamship', 'sterling', 'stockman',
  'stopwatch', 'stormy', 'sugar', 'surmount', 'suspense', 'sweatband', 'swelter', 'tactics',
  'talon', 'tapeworm', 'tempest', 'tiger', 'tissue', 'tonic', 'topmost', 'tracker',
  'transit', 'trauma', 'treadmill', 'Trojan', 'trouble', 'tumor', 'tunnel', 'tycoon',
  'uncut', 'unearth', 'unwind', 'uproot', 'upset', 'upshot', 'vapor', 'village',
  'virus', 'Vulcan', 'waffle', 'wallet', 'watchword', 'wayside', 'willow', 'woodlark',
];

export const PGP_ODD: string[] = [
  'adroitness', 'adviser', 'aftermath', 'aggregate', 'alkali', 'almighty', 'amulet', 'amusement',
  'antenna', 'applicant', 'Babylon', 'backwater', 'barbecue', 'belowground', 'bifocals', 'bodyguard',
  'bookseller', 'borderline', 'bottomless', 'Bradbury', 'bravado', 'Brazilian', 'breakaway', 'Burlington',
  'businessman', 'butterfat', 'Camelot', 'candidate', 'cannonball', 'Capricorn', 'caravan', 'caretaker',
  'celebrate', 'cellulose', 'certify', 'chambermaid', 'Cherokee', 'Chicago', 'clergyman', 'coherence',
  'combustion', 'commando', 'company', 'component', 'concurrent', 'confidence', 'conformist', 'congregate',
  'consensus', 'consulate', 'continent', 'converge', 'copier', 'cornucopia', 'cowhide', 'crescent',
  'crossover', 'crucifix', 'cumbersome', 'customer', 'Dakota', 'decadence', 'December', 'decimal',
  'designing', 'detector', 'detonate', 'dictionary', 'dinosaur', 'direction', 'disbelief', 'disruptive',
  'distortion', 'document', 'embezzle', 'enchanting', 'enrollment', 'enterprise', 'equation', 'equipment',
  'escapade', 'Eskimo', 'everyday', 'examine', 'existence', 'exodus', 'fascinate', 'filament',
  'finicky', 'forever', 'fortitude', 'frequency', 'garrison', 'gentleman', 'glucose', 'gossamer',
  'graduate', 'gravity', 'guitarist', 'hamburger', 'Hamilton', 'handiwork', 'hazardous', 'headwaters',
  'hemisphere', 'hesitate', 'hideaway', 'holiness', 'hurricane', 'hydraulic', 'hypnotic', 'impression',
  'inclusive', 'inertia', 'infancy', 'inferno', 'informant', 'inheritor', 'initiate', 'insincere',
  'intention', 'inventive', 'Istanbul', 'Jamaica', 'Jupiter', 'leapfrog', 'letterhead', 'liberty',
  'maritime', 'matchmaker', 'maverick', 'Medusa', 'megaton', 'microscope', 'microwave', 'midsummer',
  'millionaire', 'miracle', 'misnomer', 'molasses', 'molecule', 'Montana', 'monument', 'mosquito',
  'narrative', 'nebula', 'newsletter', 'Norwegian', 'October', 'Ohio', 'onlooker', 'opulent',
  'Orlando', 'outfielder', 'Pacific', 'pandemic', 'Pandora', 'paperweight', 'paragon', 'paragraph',
  'penthouse', 'percentage', 'pharmacy', 'Pittsburgh', 'playfield', 'Pluto', 'politeness', 'populate',
  'Portugal', 'potato', 'precaution', 'predator', 'president', 'proclaim', 'profusion', 'publisher',
  'pyramid', 'quantity', 'racketeer', 'rebellion', 'recipe', 'recover', 'redirect', 'reform',
  'regiment', 'reimburse', 'relapse', 'repellent', 'replica', 'reproduce', 'resistor', 'responsive',
  'retraction', 'retrieval', 'retrospect', 'revenue', 'revival', 'revolver', 'sandalwood', 'sardonic',
  'Saturday', 'savagery', 'scavenger', 'sensation', 'sociable', 'souvenir', 'specialist', 'speculate',
  'stethoscope', 'stupendous', 'supportive', 'surrender', 'suspicious', 'sympathy', 'tambourine', 'telephone',
  'therapist', 'tobacco', 'tolerance', 'tomorrow', 'torpedo', 'tradition', 'travesty', 'triangle',
  'trombonist', 'truncated', 'typewriter', 'ultimate', 'undaunted', 'underfoot', 'unicorn', 'unify',
  'universe', 'unravel', 'upcoming', 'vacancy', 'vagabond', 'vertigo', 'Virginia', 'visitor',
  'vocalist', 'voyager', 'warranty', 'Waterloo', 'whimsical', 'Wichita', 'Wilmington', 'Wyoming',
  'yesteryear', 'Yucatan', 'Zeppelin', 'Zurich', 'zulu', 'zephyr', 'zenith', 'zodiac',
];

// Build reverse maps: word (lowercase) → byte value
export const PGP_EVEN_REVERSE: Record<string, number> = {};
export const PGP_ODD_REVERSE: Record<string, number> = {};

for (let i = 0; i < PGP_EVEN.length; i++) {
  PGP_EVEN_REVERSE[PGP_EVEN[i].toLowerCase()] = i;
}
for (let i = 0; i < PGP_ODD.length; i++) {
  PGP_ODD_REVERSE[PGP_ODD[i].toLowerCase()] = i;
}

// Combined reverse for when position is unknown
export const PGP_ALL_REVERSE: Record<string, { byte: number; position: 'even' | 'odd' }> = {};
for (let i = 0; i < PGP_EVEN.length; i++) {
  PGP_ALL_REVERSE[PGP_EVEN[i].toLowerCase()] = { byte: i, position: 'even' };
}
for (let i = 0; i < PGP_ODD.length; i++) {
  PGP_ALL_REVERSE[PGP_ODD[i].toLowerCase()] = { byte: i, position: 'odd' };
}
