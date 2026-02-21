import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Shakespeare Interpreter';

/* ------------------------------------------------------------------ */
/*  Shakespeare Programming Language (SPL) interpreter                */
/*  Spec: https://shakespearelang.com/1.0/                            */
/*  Esolang: https://esolangs.org/wiki/Shakespeare                    */
/* ------------------------------------------------------------------ */

const CHARACTER_NAMES = [
  'Romeo', 'Juliet', 'Hamlet', 'Ophelia', 'Othello', 'Macbeth',
  'Lady Macbeth', 'King Lear', 'Prospero', 'Ariel', 'Puck', 'Bottom',
  'Titania', 'Oberon', 'Desdemona', 'Cordelia', 'Horatio', 'Lysander',
  'Helena', 'Hermia', 'Portia', 'Shylock', 'Brutus', 'Cassius',
  'Cleopatra', 'Antony', 'Viola', 'Sebastian', 'Malvolio', 'Beatrice',
  'Benedick', 'Rosalind', 'Orlando', 'Caliban', 'Miranda', 'Ferdinand',
  'Banquo', 'Macduff', 'Tybalt', 'Mercutio',
];

/** Words that resolve to +1 (positive/neutral nouns). */
const POSITIVE_NOUNS = new Set([
  'lord', 'king', 'angel', 'flower', 'joy', 'heaven', 'summer', 'day',
  'hero', 'rose', 'sun', 'sky', 'light', 'star', 'kingdom', 'crown',
  'heart', 'love', 'beauty', 'youth', 'spirit', 'friend', 'dream',
  'hope', 'pride', 'fortune', 'grace', 'glory', 'gentle', 'sweet',
  'noble', 'fair', 'brave', 'true', 'good', 'great', 'rich', 'kind',
  'warm', 'bright', 'pure', 'golden', 'happy', 'proud', 'lovely',
  'royal', 'divine', 'precious', 'cat', 'dog', 'horse', 'bird',
  'morning', 'dawn', 'lamb', 'plum', 'town', 'tree', 'wind', 'moon',
  'hamlet', 'pony', 'rabbit', 'stone', 'door', 'road', 'land',
  'country', 'animal', 'brother', 'sister', 'father', 'mother',
  'mistress', 'woman', 'man', 'boy', 'girl', 'child', 'chariot',
  'roman', 'warrior', 'heaven', 'clearest', 'grandiose', 'ambassador',
  'painting', 'sky',
]);

/** Words that resolve to -1 (negative nouns). */
const NEGATIVE_NOUNS = new Set([
  'bastard', 'beggar', 'devil', 'fool', 'ghost', 'pig', 'villain',
  'coward', 'death', 'hell', 'winter', 'night', 'plague', 'curse',
  'poison', 'famine', 'war', 'storm', 'serpent', 'beast', 'monster',
  'liar', 'thief', 'worm', 'rat', 'toad', 'viper', 'blister',
  'codpiece', 'pestilence', 'foul', 'evil', 'wicked', 'vile', 'ugly',
  'stupid', 'fat', 'old', 'dark', 'rotten', 'lying', 'damned',
  'hideous', 'stinking', 'reeking', 'cunning', 'jealous', 'leech',
  'flirt-gill', 'hag', 'snotty', 'whey-face', 'skulking', 'oozing',
  'Microsoft', 'microsoft',
]);

/** Adjectives -- any of these before a noun doubles the value. */
const ADJECTIVES = new Set([
  'pretty', 'little', 'big', 'old', 'young', 'beautiful', 'ugly',
  'sweet', 'brave', 'cowardly', 'lovely', 'noble', 'vile', 'wicked',
  'fair', 'foul', 'gentle', 'rough', 'rich', 'poor', 'happy', 'sad',
  'warm', 'cold', 'dark', 'bright', 'cunning', 'stupid', 'proud',
  'humble', 'bold', 'shy', 'rotten', 'golden', 'fat', 'thin',
  'clean', 'dirty', 'fresh', 'stale', 'royal', 'divine', 'precious',
  'damned', 'hideous', 'stinking', 'reeking', 'lying', 'jealous',
  'amazing', 'blue', 'bottomless', 'broken', 'charming', 'clearest',
  'cursed', 'cute', 'dusty', 'embossed', 'fatherless', 'fine',
  'flirtatious', 'furry', 'good', 'grandiose', 'green', 'hairy',
  'handsome', 'hard', 'heavy', 'holy', 'horrible', 'huge', 'large',
  'lazy', 'little', 'lovely', 'mad', 'mighty', 'miserable',
  'misused', 'musty', 'normal', 'old', 'peaceful', 'plump',
  'prompt', 'proud', 'purple', 'puny', 'quick', 'red', 'rural',
  'rusty', 'slimy', 'small', 'smelly', 'smooth', 'sorry', 'square',
  'stuffed', 'stupid', 'suspicious', 'sweet', 'tiny', 'tired',
  'treacherous', 'trustworthy', 'ugly', 'unfriendly', 'unpleasant',
  'villainous', 'worried', 'yellow',
]);

/** All valid character names in lower case for matching. */
const CHARACTER_NAMES_LOWER = CHARACTER_NAMES.map((n) => n.toLowerCase());

interface SPLCharacter {
  name: string;
  value: number;
  stack: number[];
}

interface SPLResult {
  output: string;
  error?: string;
}

interface SPLScene {
  actIndex: number;
  sceneIndex: number;
  lines: { speaker: string; text: string }[];
}

function executeShakespeare(program: string, stdin: string, maxSteps: number): SPLResult {
  const MAX_OUTPUT = 10_000;
  let output = '';
  let stdinPos = 0;

  // ---- helpers ----
  function readChar(): number {
    if (stdinPos >= stdin.length) return -1;
    return stdin.charCodeAt(stdinPos++);
  }

  function readNumber(): number {
    // Read until whitespace or end
    let num = '';
    while (stdinPos < stdin.length && /\s/.test(stdin[stdinPos])) stdinPos++;
    while (stdinPos < stdin.length && /[0-9\-]/.test(stdin[stdinPos])) {
      num += stdin[stdinPos++];
    }
    return num ? parseInt(num, 10) || 0 : 0;
  }

  function appendOutput(s: string): boolean {
    output += s;
    return output.length <= MAX_OUTPUT;
  }

  // ---- parse ----
  const rawLines = program.split('\n');
  const characters: Map<string, SPLCharacter> = new Map();
  const onStage: Set<string> = new Set();

  // Index for acts and scenes: acts[actNum][sceneNum] = SPLScene
  const acts: Map<number, Map<number, SPLScene>> = new Map();
  const actOrder: number[] = [];
  const sceneOrder: Map<number, number[]> = new Map();

  let lineIdx = 0;

  // Skip title (first line that ends with a period or is non-empty)
  while (lineIdx < rawLines.length && rawLines[lineIdx].trim() === '') lineIdx++;
  if (lineIdx < rawLines.length) lineIdx++; // skip the title line

  // Parse character declarations (lines like "Name, description.")
  while (lineIdx < rawLines.length) {
    const line = rawLines[lineIdx].trim();
    if (line === '') { lineIdx++; continue; }

    // Check if this is an act header
    if (/^act\s/i.test(line)) break;

    // Try to match character declaration
    let foundChar = false;
    for (const charName of CHARACTER_NAMES) {
      if (line.toLowerCase().startsWith(charName.toLowerCase() + ',') ||
          line.toLowerCase().startsWith(charName.toLowerCase() + ' ,')) {
        characters.set(charName.toLowerCase(), {
          name: charName,
          value: 0,
          stack: [],
        });
        foundChar = true;
        break;
      }
    }
    if (!foundChar) break; // Not a character declaration, must be acts
    lineIdx++;
  }

  if (characters.size === 0) {
    return { output: '', error: 'No characters declared' };
  }

  // Parse acts, scenes, and dialogue
  let currentAct = 0;
  let currentScene = 0;
  let currentSpeaker = '';
  let currentLines: { speaker: string; text: string }[] = [];

  function saveScene(): void {
    if (currentAct > 0 && currentScene > 0) {
      if (!acts.has(currentAct)) {
        acts.set(currentAct, new Map());
        actOrder.push(currentAct);
        sceneOrder.set(currentAct, []);
      }
      const actMap = acts.get(currentAct)!;
      if (!actMap.has(currentScene)) {
        sceneOrder.get(currentAct)!.push(currentScene);
      }
      actMap.set(currentScene, {
        actIndex: currentAct,
        sceneIndex: currentScene,
        lines: [...currentLines],
      });
    }
  }

  function parseRoman(s: string): number {
    const roman: Record<string, number> = {
      i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000,
    };
    const str = s.toLowerCase().trim();
    let result = 0;
    for (let i = 0; i < str.length; i++) {
      const cur = roman[str[i]] || 0;
      const next = i + 1 < str.length ? (roman[str[i + 1]] || 0) : 0;
      if (cur < next) {
        result -= cur;
      } else {
        result += cur;
      }
    }
    return result;
  }

  while (lineIdx < rawLines.length) {
    const line = rawLines[lineIdx].trim();
    lineIdx++;
    if (line === '') continue;

    // Act header
    const actMatch = line.match(/^act\s+([ivxlcdm]+)\s*:/i);
    if (actMatch) {
      saveScene();
      currentAct = parseRoman(actMatch[1]);
      currentScene = 0;
      currentLines = [];
      currentSpeaker = '';
      continue;
    }

    // Scene header
    const sceneMatch = line.match(/^scene\s+([ivxlcdm]+)\s*:/i);
    if (sceneMatch) {
      saveScene();
      currentScene = parseRoman(sceneMatch[1]);
      currentLines = [];
      currentSpeaker = '';
      continue;
    }

    // Stage direction: [Enter ...], [Exit ...], [Exeunt ...]
    const stageMatch = line.match(/^\[(.+)\]\s*$/i);
    if (stageMatch) {
      const directive = stageMatch[1].trim();
      currentLines.push({ speaker: '', text: `[${directive}]` });
      continue;
    }

    // Speaker header: "Name:"
    let foundSpeaker = false;
    for (const charName of CHARACTER_NAMES) {
      const pattern = new RegExp('^' + escapeRegex(charName) + '\\s*:', 'i');
      if (pattern.test(line)) {
        currentSpeaker = charName.toLowerCase();
        // There might be text after "Name: text"
        const afterColon = line.slice(line.indexOf(':') + 1).trim();
        if (afterColon) {
          currentLines.push({ speaker: currentSpeaker, text: afterColon });
        }
        foundSpeaker = true;
        break;
      }
    }
    if (foundSpeaker) continue;

    // Continuation of current speaker's dialogue
    if (currentSpeaker && line) {
      currentLines.push({ speaker: currentSpeaker, text: line });
    }
  }
  saveScene();

  // ---- build flat instruction list ----
  interface Instruction {
    act: number;
    scene: number;
    speaker: string;
    text: string;
  }

  const instructions: Instruction[] = [];
  const sceneStarts: Map<string, number> = new Map(); // "act:scene" -> instruction index

  for (const actNum of actOrder) {
    const scenes = sceneOrder.get(actNum)!;
    for (const sceneNum of scenes) {
      const scene = acts.get(actNum)!.get(sceneNum)!;
      const key = `${actNum}:${sceneNum}`;
      sceneStarts.set(key, instructions.length);
      for (const line of scene.lines) {
        instructions.push({
          act: actNum,
          scene: sceneNum,
          speaker: line.speaker,
          text: line.text,
        });
      }
    }
  }

  if (instructions.length === 0) {
    return { output: '' };
  }

  // ---- helper: find the other character on stage ----
  function getOther(speaker: string): string | null {
    for (const name of onStage) {
      if (name !== speaker) return name;
    }
    return null;
  }

  function getChar(name: string): SPLCharacter | null {
    return characters.get(name) || null;
  }

  // ---- evaluate a noun phrase to a numeric value ----
  function evaluateExpression(text: string, speaker: string): number {
    const t = text.trim().toLowerCase();

    // "nothing" / "zero"
    if (/\bnothing\b/.test(t) || /\bzero\b/.test(t)) return 0;

    // Reference to a character name => that character's value
    for (const cn of CHARACTER_NAMES_LOWER) {
      if (t === cn || t === 'the ' + cn) {
        const ch = characters.get(cn);
        if (ch) return ch.value;
      }
    }

    // "yourself" / "thyself" / "you" / "thee" / "thou" => the speaker (since the speaker says "you")
    // Actually in SPL, "you/thee/thou" in an expression refers to the person being spoken to
    // But when evaluating value expressions, "you" = the addressee
    if (/\b(yourself|thyself)\b/.test(t)) {
      const other = getOther(speaker);
      if (other) {
        const ch = characters.get(other);
        if (ch) return ch.value;
      }
      return 0;
    }
    if (/^(you|thee|thou)$/.test(t)) {
      const other = getOther(speaker);
      if (other) {
        const ch = characters.get(other);
        if (ch) return ch.value;
      }
      return 0;
    }

    // "me" / "myself" / "i" => the speaker's value
    if (/^(me|myself|i)$/.test(t)) {
      const ch = characters.get(speaker);
      if (ch) return ch.value;
      return 0;
    }

    // Arithmetic: "the sum of X and Y"
    const sumMatch = t.match(/the\s+sum\s+of\s+(.+?)\s+and\s+(.+)/);
    if (sumMatch) {
      return evaluateExpression(sumMatch[1], speaker) + evaluateExpression(sumMatch[2], speaker);
    }

    // "the difference between X and Y"
    const diffMatch = t.match(/the\s+difference\s+between\s+(.+?)\s+and\s+(.+)/);
    if (diffMatch) {
      return evaluateExpression(diffMatch[1], speaker) - evaluateExpression(diffMatch[2], speaker);
    }

    // "the product of X and Y"
    const prodMatch = t.match(/the\s+product\s+of\s+(.+?)\s+and\s+(.+)/);
    if (prodMatch) {
      return evaluateExpression(prodMatch[1], speaker) * evaluateExpression(prodMatch[2], speaker);
    }

    // "the quotient between X and Y"
    const quotMatch = t.match(/the\s+quotient\s+between\s+(.+?)\s+and\s+(.+)/);
    if (quotMatch) {
      const divisor = evaluateExpression(quotMatch[2], speaker);
      if (divisor === 0) return 0;
      return Math.trunc(evaluateExpression(quotMatch[1], speaker) / divisor);
    }

    // "the remainder of the quotient between X and Y"
    const remMatch = t.match(/the\s+remainder\s+of\s+the\s+quotient\s+between\s+(.+?)\s+and\s+(.+)/);
    if (remMatch) {
      const divisor = evaluateExpression(remMatch[2], speaker);
      if (divisor === 0) return 0;
      return evaluateExpression(remMatch[1], speaker) % divisor;
    }

    // "the square of X"
    const sqMatch = t.match(/the\s+square\s+of\s+(.+)/);
    if (sqMatch) {
      const v = evaluateExpression(sqMatch[1], speaker);
      return v * v;
    }

    // "the cube of X"
    const cubeMatch = t.match(/the\s+cube\s+of\s+(.+)/);
    if (cubeMatch) {
      const v = evaluateExpression(cubeMatch[1], speaker);
      return v * v * v;
    }

    // "the square root of X"
    const sqrtMatch = t.match(/the\s+square\s+root\s+of\s+(.+)/);
    if (sqrtMatch) {
      const v = evaluateExpression(sqrtMatch[1], speaker);
      return Math.floor(Math.sqrt(Math.abs(v)));
    }

    // "the factorial of X"
    const factMatch = t.match(/the\s+factorial\s+of\s+(.+)/);
    if (factMatch) {
      let v = evaluateExpression(factMatch[1], speaker);
      if (v < 0) v = 0;
      if (v > 20) v = 20; // cap to avoid overflow
      let result = 1;
      for (let i = 2; i <= v; i++) result *= i;
      return result;
    }

    // "twice X"
    const twiceMatch = t.match(/twice\s+(.+)/);
    if (twiceMatch) {
      return 2 * evaluateExpression(twiceMatch[1], speaker);
    }

    // Count adjectives before the last noun-word
    const words = t.replace(/[^a-z\s'-]/g, '').split(/\s+/).filter(Boolean);
    if (words.length === 0) return 0;

    // Find the base noun (last word that is a known noun, or just the last word)
    let baseValue = 0;
    let nounIdx = -1;
    for (let i = words.length - 1; i >= 0; i--) {
      const w = words[i];
      if (POSITIVE_NOUNS.has(w)) { baseValue = 1; nounIdx = i; break; }
      if (NEGATIVE_NOUNS.has(w)) { baseValue = -1; nounIdx = i; break; }
    }

    // If no known noun found, try the last word as a character reference
    if (nounIdx === -1) {
      // Check multi-word character names
      for (const cn of CHARACTER_NAMES_LOWER) {
        if (t.includes(cn)) {
          const ch = characters.get(cn);
          if (ch) return ch.value;
        }
      }
      // Default: treat as positive noun (lenient for unknown words)
      baseValue = 1;
      nounIdx = words.length - 1;
    }

    // Count adjectives before the noun
    let adjCount = 0;
    for (let i = 0; i < nounIdx; i++) {
      const w = words[i];
      if (ADJECTIVES.has(w)) {
        adjCount++;
      } else if (w === 'a' || w === 'an' || w === 'the' || w === 'my' || w === 'your' ||
                 w === 'his' || w === 'her' || w === 'their' || w === 'our') {
        // Skip articles/possessives
      } else if (POSITIVE_NOUNS.has(w) || NEGATIVE_NOUNS.has(w)) {
        // Adjective-like usage of nouns; treat as adjective
        adjCount++;
      } else {
        // Unknown word, treat as adjective (lenient)
        adjCount++;
      }
    }

    return baseValue * Math.pow(2, adjCount);
  }

  // ---- comparison state ----
  let comparisonResult = false;

  // ---- execute ----
  let ip = 0;
  let steps = 0;

  function executeStageDirection(text: string): string | null {
    const inner = text.slice(1, -1).trim(); // strip [ and ]
    const lower = inner.toLowerCase();

    // [Exeunt] -- everyone leaves
    if (/^exeunt\s*$/.test(lower)) {
      onStage.clear();
      return null;
    }

    // [Exeunt Name and Name]
    const exeuntMatch = lower.match(/^exeunt\s+(.+)/);
    if (exeuntMatch) {
      const namesStr = exeuntMatch[1];
      for (const cn of CHARACTER_NAMES_LOWER) {
        if (namesStr.includes(cn)) {
          onStage.delete(cn);
        }
      }
      return null;
    }

    // [Exit Name]
    const exitMatch = lower.match(/^exit\s+(.+)/);
    if (exitMatch) {
      const nameStr = exitMatch[1].replace(/[.\s]+$/, '');
      for (const cn of CHARACTER_NAMES_LOWER) {
        if (nameStr.includes(cn)) {
          onStage.delete(cn);
        }
      }
      return null;
    }

    // [Enter Name] or [Enter Name and Name]
    const enterMatch = lower.match(/^enter\s+(.+)/);
    if (enterMatch) {
      const namesStr = enterMatch[1];
      for (const cn of CHARACTER_NAMES_LOWER) {
        if (namesStr.includes(cn)) {
          if (!characters.has(cn)) {
            return `Unknown character entering stage: ${cn}`;
          }
          onStage.add(cn);
        }
      }
      return null;
    }

    return null; // Unknown stage direction, ignore
  }

  function executeSentence(sentence: string, speaker: string): string | null {
    const s = sentence.trim();
    if (!s) return null;
    const lower = s.toLowerCase();
    const other = getOther(speaker);
    if (!other) return null; // no one to talk to

    const otherChar = getChar(other)!;
    const speakerChar = getChar(speaker)!;

    // "Speak your mind!" / "Speak thy mind!" => output as char
    if (/speak\s+(your|thy|his|her)\s+mind/i.test(lower)) {
      const ch = otherChar.value;
      if (ch >= 0 && ch <= 0x10FFFF) {
        if (!appendOutput(String.fromCharCode(ch & 0xFFFF))) {
          return 'Output limit exceeded';
        }
      }
      return null;
    }

    // "Open your heart!" / "Open thy heart!" => output as number
    if (/open\s+(your|thy|his|her)\s+heart/i.test(lower)) {
      if (!appendOutput(String(otherChar.value))) {
        return 'Output limit exceeded';
      }
      return null;
    }

    // "Listen to your heart." / "Listen to thy heart." => read number from input
    if (/listen\s+to\s+(your|thy|his|her)\s+heart/i.test(lower)) {
      otherChar.value = readNumber();
      return null;
    }

    // "Open your mind." / "Open thy mind." => read char from input
    if (/open\s+(your|thy|his|her)\s+mind/i.test(lower)) {
      const c = readChar();
      otherChar.value = c === -1 ? -1 : c;
      return null;
    }

    // "Remember ..." => push onto other's stack
    if (/^remember\b/i.test(lower)) {
      const expr = s.replace(/^remember\s+/i, '').replace(/[.!]+$/, '');
      const val = evaluateExpression(expr, speaker);
      otherChar.stack.push(val);
      return null;
    }

    // "Recall ..." => pop from other's stack
    if (/^recall\b/i.test(lower)) {
      if (otherChar.stack.length > 0) {
        otherChar.value = otherChar.stack.pop()!;
      }
      return null;
    }

    // Goto: "Let us proceed to scene III" / "Let us return to scene III"
    const gotoSceneMatch = lower.match(/let\s+us\s+(?:proceed|return)\s+to\s+scene\s+([ivxlcdm]+)/i);
    if (gotoSceneMatch) {
      const targetScene = parseRoman(gotoSceneMatch[1]);
      // Find current act
      const currentActNum = instructions[ip]?.act || 1;
      const key = `${currentActNum}:${targetScene}`;
      const target = sceneStarts.get(key);
      if (target !== undefined) {
        ip = target - 1; // Will be incremented
      }
      return null;
    }

    // Goto: "Let us proceed to act I" / "Let us return to act I"
    const gotoActMatch = lower.match(/let\s+us\s+(?:proceed|return)\s+to\s+act\s+([ivxlcdm]+)/i);
    if (gotoActMatch) {
      const targetAct = parseRoman(gotoActMatch[1]);
      // Go to first scene of the act
      const actScenes = sceneOrder.get(targetAct);
      if (actScenes && actScenes.length > 0) {
        const key = `${targetAct}:${actScenes[0]}`;
        const target = sceneStarts.get(key);
        if (target !== undefined) {
          ip = target - 1;
        }
      }
      return null;
    }

    // Comparison: "Am I better than you?" / "Am I not better than you?"
    // "Are you better than me?" / "Are you not better than me?"
    // "Is X as good as Y?" / "Is X better than Y?" / "Is X worse than Y?"
    if (/\?/.test(s)) {
      // "Am I better/worse than you?"
      const amIBetter = /am\s+i\s+(better|worse)\s+than\s+(you|thee|thou)/i.exec(lower);
      if (amIBetter) {
        const comp = amIBetter[1].toLowerCase();
        if (comp === 'better') {
          comparisonResult = speakerChar.value > otherChar.value;
        } else {
          comparisonResult = speakerChar.value < otherChar.value;
        }
        return null;
      }

      // "Am I not better/worse than you?" -- negated
      const amINotBetter = /am\s+i\s+not\s+(better|worse)\s+than\s+(you|thee|thou)/i.exec(lower);
      if (amINotBetter) {
        const comp = amINotBetter[1].toLowerCase();
        if (comp === 'better') {
          comparisonResult = !(speakerChar.value > otherChar.value);
        } else {
          comparisonResult = !(speakerChar.value < otherChar.value);
        }
        return null;
      }

      // "Are you better/worse than me?"
      const areYouBetter = /are\s+you\s+(better|worse)\s+than\s+(me|i)/i.exec(lower);
      if (areYouBetter) {
        const comp = areYouBetter[1].toLowerCase();
        if (comp === 'better') {
          comparisonResult = otherChar.value > speakerChar.value;
        } else {
          comparisonResult = otherChar.value < speakerChar.value;
        }
        return null;
      }

      // "Are you not better/worse than me?"
      const areYouNotBetter = /are\s+you\s+not\s+(better|worse)\s+than\s+(me|i)/i.exec(lower);
      if (areYouNotBetter) {
        const comp = areYouNotBetter[1].toLowerCase();
        if (comp === 'better') {
          comparisonResult = !(otherChar.value > speakerChar.value);
        } else {
          comparisonResult = !(otherChar.value < speakerChar.value);
        }
        return null;
      }

      // "Is X as good as Y?" => equality
      const asGoodAs = /is\s+(.+?)\s+as\s+(?:good|bad)\s+as\s+(.+?)\s*\?/i.exec(s);
      if (asGoodAs) {
        const lhs = evaluateExpression(asGoodAs[1], speaker);
        const rhs = evaluateExpression(asGoodAs[2], speaker);
        comparisonResult = lhs === rhs;
        return null;
      }

      // "Is X better/worse than Y?"
      const isBetter = /is\s+(.+?)\s+(better|worse)\s+than\s+(.+?)\s*\?/i.exec(s);
      if (isBetter) {
        const lhs = evaluateExpression(isBetter[1], speaker);
        const comp = isBetter[2].toLowerCase();
        const rhs = evaluateExpression(isBetter[3], speaker);
        if (comp === 'better') {
          comparisonResult = lhs > rhs;
        } else {
          comparisonResult = lhs < rhs;
        }
        return null;
      }

      // "Is X more/less [adj] than Y?"
      const moreAdj = /is\s+(.+?)\s+(more|less)\s+\w+\s+than\s+(.+?)\s*\?/i.exec(s);
      if (moreAdj) {
        const lhs = evaluateExpression(moreAdj[1], speaker);
        const comp = moreAdj[2].toLowerCase();
        const rhs = evaluateExpression(moreAdj[3], speaker);
        if (comp === 'more') {
          comparisonResult = lhs > rhs;
        } else {
          comparisonResult = lhs < rhs;
        }
        return null;
      }

      return null; // Unknown question, ignore
    }

    // Conditional: "If so, ..." / "If not, ..."
    const ifSoMatch = s.match(/^if\s+so\s*,\s*(.+)/i);
    if (ifSoMatch) {
      if (comparisonResult) {
        return executeSentence(ifSoMatch[1], speaker);
      }
      return null;
    }

    const ifNotMatch = s.match(/^if\s+not\s*,\s*(.+)/i);
    if (ifNotMatch) {
      if (!comparisonResult) {
        return executeSentence(ifNotMatch[1], speaker);
      }
      return null;
    }

    // Assignment: "You are as [adj] as the sum/difference/product/quotient of X and Y."
    const asAsMatch = lower.match(/(?:you\s+are|thou\s+art)\s+as\s+\w+\s+as\s+(.+)/);
    if (asAsMatch) {
      let expr = asAsMatch[1].replace(/[.!]+$/, '');
      otherChar.value = evaluateExpression(expr, speaker);
      return null;
    }

    // Assignment: "You are X." / "Thou art X." / "You X." (noun phrase)
    const youAreMatch = s.match(/^(?:you\s+are|thou\s+art)\s+(.+)/i);
    if (youAreMatch) {
      let expr = youAreMatch[1].replace(/[.!]+$/, '');
      otherChar.value = evaluateExpression(expr, speaker);
      return null;
    }

    // Unknown sentence -- ignore
    return null;
  }

  // ---- main execution loop ----
  while (ip < instructions.length) {
    if (steps++ >= maxSteps) {
      return { output, error: `Execution limit reached (${maxSteps} steps)` };
    }

    const instr = instructions[ip];

    // Stage direction
    if (instr.text.startsWith('[') && instr.text.endsWith(']')) {
      const err = executeStageDirection(instr.text);
      if (err) return { output, error: err };
      ip++;
      continue;
    }

    // Dialogue
    if (instr.speaker && onStage.has(instr.speaker)) {
      // Split text into sentences (split on . ! ? but keep the delimiter for ? checks)
      const sentences = splitSentences(instr.text);
      for (const sent of sentences) {
        if (steps++ >= maxSteps) {
          return { output, error: `Execution limit reached (${maxSteps} steps)` };
        }
        const prevIp = ip;
        const err = executeSentence(sent, instr.speaker);
        if (err) return { output, error: err };
        // If ip changed (goto), break out of sentence loop
        if (ip !== prevIp) break;
      }
    }

    ip++;
  }

  return { output };
}

/** Split text into individual sentences, preserving ? for question detection. */
function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  // Split on sentence-ending punctuation but keep the punctuation with the sentence
  const parts = text.split(/(?<=[.!?])\s+/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed) sentences.push(trimmed);
  }
  // If no split happened and text is non-empty, treat entire text as one sentence
  if (sentences.length === 0 && text.trim()) {
    sentences.push(text.trim());
  }
  return sentences;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class ShakespeareInterpreter extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Interprets the Shakespeare Programming Language — programs written as Shakespearean plays.';
    this.infoURL = 'https://esolangs.org/wiki/Shakespeare';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Mode', type: 'option', value: ['Code in input', 'Separate code and input'] },
      { name: 'Code', type: 'text', value: '' },
      { name: 'Max Steps', type: 'number', value: 100000 },
      { name: 'Strip null bytes', type: 'boolean', value: true },
    ];
  }

  run(input: string, args: any[]): string {
    const mode = args[0] as string;
    const code = args[1] as string;
    const maxSteps = args[2] as number;
    const stripNulls = args[3] !== false;

    let program: string, stdin: string;
    if (mode === 'Separate code and input') {
      program = code;
      stdin = input;
    } else {
      program = input;
      stdin = '';
    }

    const result = executeShakespeare(program, stdin, maxSteps);
    let out = stripNulls ? result.output.replace(/\x00/g, '') : result.output;
    if (result.error) return `${out}\n[Error: ${result.error}]`;
    return out;
  }
}

registerCustomOp(ShakespeareInterpreter, {
  name: NAME,
  module: 'Custom',
  description: 'Interprets the Shakespeare Programming Language (plays as programs).',
  infoURL: 'https://esolangs.org/wiki/Shakespeare',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Mode', type: 'option', value: ['Code in input', 'Separate code and input'] },
    { name: 'Code', type: 'text', value: '' },
    { name: 'Max Steps', type: 'number', value: 100000 },
    { name: 'Strip null bytes', type: 'boolean', value: true },
  ],
  flowControl: false,
}, 'Esoteric Languages');

export default ShakespeareInterpreter;
