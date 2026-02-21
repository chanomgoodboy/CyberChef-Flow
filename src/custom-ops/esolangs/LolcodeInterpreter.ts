import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'LOLCODE Interpreter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LolType = 'NUMBR' | 'NUMBAR' | 'YARN' | 'TROOF' | 'NOOB';

interface LolValue {
  type: LolType;
  value: number | string | boolean | null;
}

interface LolResult {
  output: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mkNoob(): LolValue { return { type: 'NOOB', value: null }; }
function mkNumbr(n: number): LolValue { return { type: 'NUMBR', value: Math.trunc(n) }; }
function mkNumbar(n: number): LolValue { return { type: 'NUMBAR', value: n }; }
function mkYarn(s: string): LolValue { return { type: 'YARN', value: s }; }
function mkTroof(b: boolean): LolValue { return { type: 'TROOF', value: b }; }

function isTruthy(v: LolValue): boolean {
  switch (v.type) {
    case 'TROOF': return v.value === true;
    case 'NUMBR': return v.value !== 0;
    case 'NUMBAR': return v.value !== 0;
    case 'YARN': return (v.value as string).length > 0;
    case 'NOOB': return false;
  }
}

function toNumbr(v: LolValue): number {
  switch (v.type) {
    case 'NUMBR': return v.value as number;
    case 'NUMBAR': return Math.trunc(v.value as number);
    case 'YARN': { const n = parseInt(v.value as string, 10); return isNaN(n) ? 0 : n; }
    case 'TROOF': return v.value ? 1 : 0;
    case 'NOOB': return 0;
  }
}

function toNumbar(v: LolValue): number {
  switch (v.type) {
    case 'NUMBR': return v.value as number;
    case 'NUMBAR': return v.value as number;
    case 'YARN': { const n = parseFloat(v.value as string); return isNaN(n) ? 0 : n; }
    case 'TROOF': return v.value ? 1 : 0;
    case 'NOOB': return 0;
  }
}

function toYarn(v: LolValue): string {
  switch (v.type) {
    case 'YARN': return v.value as string;
    case 'NUMBR': return String(v.value);
    case 'NUMBAR': {
      const n = v.value as number;
      return Number.isInteger(n) ? n.toFixed(1) : String(n);
    }
    case 'TROOF': return v.value ? 'WIN' : 'FAIL';
    case 'NOOB': return '';
  }
}

function toTroof(v: LolValue): boolean {
  return isTruthy(v);
}

function castTo(v: LolValue, targetType: string): LolValue {
  switch (targetType) {
    case 'NUMBR': return mkNumbr(toNumbr(v));
    case 'NUMBAR': return mkNumbar(toNumbar(v));
    case 'YARN': return mkYarn(toYarn(v));
    case 'TROOF': return mkTroof(toTroof(v));
    default: return v;
  }
}

/** Compute a numeric result, promoting to NUMBAR if either operand is NUMBAR */
function numericOp(a: LolValue, b: LolValue, fn: (x: number, y: number) => number): LolValue {
  if (a.type === 'NUMBAR' || b.type === 'NUMBAR') {
    const result = fn(toNumbar(a), toNumbar(b));
    return mkNumbar(result);
  }
  const result = fn(toNumbr(a), toNumbr(b));
  return mkNumbr(result);
}

function looseEqual(a: LolValue, b: LolValue): boolean {
  // Same type: compare directly
  if (a.type === b.type) {
    return a.value === b.value;
  }
  // If one is NUMBR and the other NUMBAR, compare as numbers
  if ((a.type === 'NUMBR' || a.type === 'NUMBAR') && (b.type === 'NUMBR' || b.type === 'NUMBAR')) {
    return toNumbar(a) === toNumbar(b);
  }
  // Compare as yarn
  return toYarn(a) === toYarn(b);
}

// ---------------------------------------------------------------------------
// String escaping: LOLCODE string escape sequences
// ---------------------------------------------------------------------------

function unescapeLolString(raw: string): string {
  let result = '';
  let i = 0;
  while (i < raw.length) {
    if (raw[i] === ':' && i + 1 < raw.length) {
      const next = raw[i + 1];
      switch (next) {
        case ')': result += '\n'; i += 2; continue;
        case '>': result += '\t'; i += 2; continue;
        case 'o': result += '\x07'; i += 2; continue; // bell
        case '"': result += '"'; i += 2; continue;
        case ':': result += ':'; i += 2; continue;
        case '(': {
          // Unicode: :(XXXX) — hex codepoint
          const close = raw.indexOf(')', i + 2);
          if (close !== -1) {
            const hex = raw.substring(i + 2, close);
            const cp = parseInt(hex, 16);
            if (!isNaN(cp)) {
              result += String.fromCodePoint(cp);
              i = close + 1;
              continue;
            }
          }
          result += ':';
          i++;
          continue;
        }
        case '{': {
          // Variable interpolation: :{varname}
          const close = raw.indexOf('}', i + 2);
          if (close !== -1) {
            // We'll handle interpolation later in parseExpression context
            // For now, store a placeholder
            result += '\x00INTERP:' + raw.substring(i + 2, close) + '\x00';
            i = close + 1;
            continue;
          }
          result += ':';
          i++;
          continue;
        }
        default:
          result += ':';
          i++;
          continue;
      }
    }
    result += raw[i];
    i++;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Tokenizer / line preprocessor
// ---------------------------------------------------------------------------

interface ParsedLine {
  raw: string;
  tokens: string[];
  lineNum: number;
}

function preprocessLines(source: string): ParsedLine[] {
  const result: ParsedLine[] = [];
  const raw = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Strip block comments OBTW ... TLDR
  let cleaned = '';
  const lines = raw.split('\n');
  let inBlock = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (inBlock) {
      if (trimmed === 'TLDR') {
        inBlock = false;
      }
      continue;
    }
    if (trimmed === 'OBTW') {
      inBlock = true;
      continue;
    }
    cleaned += line + '\n';
  }
  if (cleaned.endsWith('\n')) cleaned = cleaned.slice(0, -1);

  // Process each line
  const cleanedLines = cleaned.split('\n');
  for (let ln = 0; ln < cleanedLines.length; ln++) {
    let line = cleanedLines[ln];

    // Strip single-line comments (BTW ...)
    const btwIdx = findBTW(line);
    if (btwIdx !== -1) {
      line = line.substring(0, btwIdx);
    }

    line = line.trim();

    // Handle line continuation (...)
    while (line.endsWith('...') || (line.endsWith('\u2026'))) {
      line = line.replace(/\.\.\.$/,'').replace(/\u2026$/, '');
      ln++;
      if (ln < cleanedLines.length) {
        let next = cleanedLines[ln];
        const btwIdx2 = findBTW(next);
        if (btwIdx2 !== -1) next = next.substring(0, btwIdx2);
        line += ' ' + next.trim();
      }
    }

    // Split by comma (statement separator)
    const statements = line.split(',').map(s => s.trim()).filter(s => s.length > 0);
    for (const stmt of statements) {
      const tokens = tokenize(stmt);
      if (tokens.length > 0) {
        result.push({ raw: stmt, tokens, lineNum: ln + 1 });
      }
    }
  }

  return result;
}

function findBTW(line: string): number {
  // Find BTW that's not inside a string literal
  let inString = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"' && (i === 0 || line[i-1] !== ':')) {
      inString = !inString;
    }
    if (!inString && line.substring(i).startsWith('BTW') &&
        (i === 0 || /\s/.test(line[i-1])) &&
        (i + 3 >= line.length || /\s/.test(line[i+3]))) {
      return i;
    }
  }
  return -1;
}

function tokenize(line: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < line.length) {
    // Skip whitespace
    if (/\s/.test(line[i])) { i++; continue; }

    // String literal
    if (line[i] === '"') {
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === ':' && j + 1 < line.length && line[j + 1] === '"') {
          j += 2; // escaped quote
          continue;
        }
        if (line[j] === '"') break;
        j++;
      }
      tokens.push(line.substring(i, j + 1));
      i = j + 1;
      continue;
    }

    // Word / number token
    let j = i;
    while (j < line.length && !/\s/.test(line[j]) && line[j] !== '"') {
      j++;
    }
    tokens.push(line.substring(i, j));
    i = j;
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// Expression parser
// ---------------------------------------------------------------------------

interface ParseContext {
  tokens: string[];
  pos: number;
  vars: Map<string, LolValue>;
}

function parseExpression(ctx: ParseContext): LolValue {
  if (ctx.pos >= ctx.tokens.length) return mkNoob();

  const tok = ctx.tokens[ctx.pos];

  // String literal
  if (tok.startsWith('"') && tok.endsWith('"') && tok.length >= 2) {
    ctx.pos++;
    let s = unescapeLolString(tok.slice(1, -1));
    // Handle variable interpolation placeholders
    s = s.replace(/\x00INTERP:([^\x00]+)\x00/g, (_match, varName) => {
      const v = ctx.vars.get(varName);
      return v ? toYarn(v) : '';
    });
    return mkYarn(s);
  }

  // TROOF literals
  if (tok === 'WIN') { ctx.pos++; return mkTroof(true); }
  if (tok === 'FAIL') { ctx.pos++; return mkTroof(false); }

  // NOOB literal
  if (tok === 'NOOB') { ctx.pos++; return mkNoob(); }

  // Numeric literals
  if (/^-?\d+\.\d+$/.test(tok)) { ctx.pos++; return mkNumbar(parseFloat(tok)); }
  if (/^-?\d+$/.test(tok)) { ctx.pos++; return mkNumbr(parseInt(tok, 10)); }

  // NOT expr
  if (tok === 'NOT') {
    ctx.pos++;
    const v = parseExpression(ctx);
    return mkTroof(!isTruthy(v));
  }

  // Binary math ops: SUM OF, DIFF OF, PRODUKT OF, QUOSHUNT OF, MOD OF, BIGGR OF, SMALLR OF
  if (tok === 'SUM' && peek(ctx, 1) === 'OF') {
    ctx.pos += 2;
    const a = parseExpression(ctx);
    consumeAN(ctx);
    const b = parseExpression(ctx);
    return numericOp(a, b, (x, y) => x + y);
  }
  if (tok === 'DIFF' && peek(ctx, 1) === 'OF') {
    ctx.pos += 2;
    const a = parseExpression(ctx);
    consumeAN(ctx);
    const b = parseExpression(ctx);
    return numericOp(a, b, (x, y) => x - y);
  }
  if (tok === 'PRODUKT' && peek(ctx, 1) === 'OF') {
    ctx.pos += 2;
    const a = parseExpression(ctx);
    consumeAN(ctx);
    const b = parseExpression(ctx);
    return numericOp(a, b, (x, y) => x * y);
  }
  if (tok === 'QUOSHUNT' && peek(ctx, 1) === 'OF') {
    ctx.pos += 2;
    const a = parseExpression(ctx);
    consumeAN(ctx);
    const b = parseExpression(ctx);
    const bNum = (a.type === 'NUMBAR' || b.type === 'NUMBAR') ? toNumbar(b) : toNumbr(b);
    if (bNum === 0) return mkNumbr(0); // division by zero yields 0
    return numericOp(a, b, (x, y) => y === 0 ? 0 : x / y);
  }
  if (tok === 'MOD' && peek(ctx, 1) === 'OF') {
    ctx.pos += 2;
    const a = parseExpression(ctx);
    consumeAN(ctx);
    const b = parseExpression(ctx);
    return numericOp(a, b, (x, y) => y === 0 ? 0 : x % y);
  }
  if (tok === 'BIGGR' && peek(ctx, 1) === 'OF') {
    ctx.pos += 2;
    const a = parseExpression(ctx);
    consumeAN(ctx);
    const b = parseExpression(ctx);
    return numericOp(a, b, (x, y) => Math.max(x, y));
  }
  if (tok === 'SMALLR' && peek(ctx, 1) === 'OF') {
    ctx.pos += 2;
    const a = parseExpression(ctx);
    consumeAN(ctx);
    const b = parseExpression(ctx);
    return numericOp(a, b, (x, y) => Math.min(x, y));
  }

  // Comparison: BOTH SAEM a AN b, DIFFRINT a AN b
  if (tok === 'BOTH' && peek(ctx, 1) === 'SAEM') {
    ctx.pos += 2;
    const a = parseExpression(ctx);
    consumeAN(ctx);
    const b = parseExpression(ctx);
    return mkTroof(looseEqual(a, b));
  }
  if (tok === 'DIFFRINT') {
    ctx.pos++;
    const a = parseExpression(ctx);
    consumeAN(ctx);
    const b = parseExpression(ctx);
    return mkTroof(!looseEqual(a, b));
  }

  // Boolean: BOTH OF a AN b, EITHER OF a AN b
  if (tok === 'BOTH' && peek(ctx, 1) === 'OF') {
    ctx.pos += 2;
    const a = parseExpression(ctx);
    consumeAN(ctx);
    const b = parseExpression(ctx);
    return mkTroof(isTruthy(a) && isTruthy(b));
  }
  if (tok === 'EITHER' && peek(ctx, 1) === 'OF') {
    ctx.pos += 2;
    const a = parseExpression(ctx);
    consumeAN(ctx);
    const b = parseExpression(ctx);
    return mkTroof(isTruthy(a) || isTruthy(b));
  }

  // SMOOSH expr AN expr ... MKAY
  if (tok === 'SMOOSH') {
    ctx.pos++;
    let result = '';
    result += toYarn(parseExpression(ctx));
    while (ctx.pos < ctx.tokens.length) {
      if (ctx.tokens[ctx.pos] === 'MKAY') { ctx.pos++; break; }
      consumeAN(ctx);
      if (ctx.pos < ctx.tokens.length && ctx.tokens[ctx.pos] === 'MKAY') { ctx.pos++; break; }
      result += toYarn(parseExpression(ctx));
    }
    return mkYarn(result);
  }

  // MAEK expr A TYPE (casting)
  if (tok === 'MAEK') {
    ctx.pos++;
    const v = parseExpression(ctx);
    if (ctx.pos < ctx.tokens.length && ctx.tokens[ctx.pos] === 'A') {
      ctx.pos++;
    }
    if (ctx.pos < ctx.tokens.length) {
      const targetType = ctx.tokens[ctx.pos];
      ctx.pos++;
      return castTo(v, targetType);
    }
    return v;
  }

  // Variable reference
  if (/^[a-zA-Z_]\w*$/.test(tok)) {
    ctx.pos++;
    // Check for IS NOW A (inline cast)
    // Not here — assignment handles that
    const v = ctx.vars.get(tok);
    return v ? { ...v } : mkNoob();
  }

  // IT implicit variable
  if (tok === 'IT') {
    ctx.pos++;
    const v = ctx.vars.get('IT');
    return v ? { ...v } : mkNoob();
  }

  // Unknown token — treat as NOOB
  ctx.pos++;
  return mkNoob();
}

function peek(ctx: ParseContext, offset: number): string | undefined {
  return ctx.tokens[ctx.pos + offset];
}

function consumeAN(ctx: ParseContext): void {
  if (ctx.pos < ctx.tokens.length && ctx.tokens[ctx.pos] === 'AN') {
    ctx.pos++;
  }
}

// ---------------------------------------------------------------------------
// Interpreter
// ---------------------------------------------------------------------------

function executeLolcode(source: string, stdin: string, maxSteps: number): LolResult {
  const parsedLines = preprocessLines(source);
  const vars = new Map<string, LolValue>();
  vars.set('IT', mkNoob());

  let output = '';
  const stdinLines = stdin.split('\n');
  let stdinIdx = 0;
  let steps = 0;
  let ip = 0;

  // Check HAI
  if (parsedLines.length === 0) return { output: '' };
  if (parsedLines[0].tokens[0] !== 'HAI') {
    return { output: '', error: 'Program must start with HAI' };
  }
  ip = 1;

  // Find KTHXBYE to know program bounds
  let programEnd = parsedLines.length;
  for (let i = 0; i < parsedLines.length; i++) {
    if (parsedLines[i].tokens[0] === 'KTHXBYE') {
      programEnd = i;
      break;
    }
  }

  // Build label index for loops
  const loopStarts = new Map<string, number>(); // label -> line index of IM IN YR
  const loopEnds = new Map<string, number>();   // label -> line index of IM OUTTA YR

  for (let i = 0; i < parsedLines.length; i++) {
    const t = parsedLines[i].tokens;
    if (t[0] === 'IM' && t[1] === 'IN' && t[2] === 'YR' && t[3]) {
      loopStarts.set(t[3], i);
    }
    if (t[0] === 'IM' && t[1] === 'OUTTA' && t[2] === 'YR' && t[3]) {
      loopEnds.set(t[3], i);
    }
  }

  // Build block structure for O RLY? / WTF? / OIC
  // We'll handle these inline via scanning

  function readLine(): string {
    if (stdinIdx < stdinLines.length) {
      return stdinLines[stdinIdx++];
    }
    return '';
  }

  function evalExpr(tokens: string[], startPos = 0): LolValue {
    const ctx: ParseContext = { tokens, pos: startPos, vars };
    const result = parseExpression(ctx);
    vars.set('IT', { ...result });
    return result;
  }

  function evalExprNoIT(tokens: string[], startPos = 0): LolValue {
    const ctx: ParseContext = { tokens, pos: startPos, vars };
    return parseExpression(ctx);
  }

  // Find YA RLY, MEBBE, NO WAI, OIC at the same nesting level
  function findIfBranches(from: number): { yaRly: number; mebbes: Array<{ line: number; exprStart: number }>; noWai: number; oic: number } {
    let depth = 0;
    let yaRly = -1;
    const mebbes: Array<{ line: number; exprStart: number }> = [];
    let noWai = -1;
    let oic = -1;
    for (let i = from; i < programEnd; i++) {
      const t = parsedLines[i].tokens;
      if ((t[0] === 'O' && t[1] === 'RLY?') || t[0] === 'WTF?') {
        if (i !== from) depth++;
        continue;
      }
      if (t[0] === 'OIC') {
        if (depth <= 0) { oic = i; break; }
        depth--;
        continue;
      }
      if (depth > 0) continue;
      if (t[0] === 'YA' && t[1] === 'RLY') yaRly = i;
      else if (t[0] === 'MEBBE') mebbes.push({ line: i, exprStart: 1 });
      else if (t[0] === 'NO' && t[1] === 'WAI') noWai = i;
    }
    return { yaRly, mebbes, noWai, oic };
  }

  // Find WTF? branches: OMG value, OMGWTF, OIC
  function findWtfBranches(from: number): { omgs: Array<{ line: number; valueStart: number }>; omgwtf: number; oic: number } {
    let depth = 0;
    const omgs: Array<{ line: number; valueStart: number }> = [];
    let omgwtf = -1;
    let oic = -1;
    for (let i = from + 1; i < programEnd; i++) {
      const t = parsedLines[i].tokens;
      if ((t[0] === 'O' && t[1] === 'RLY?') || t[0] === 'WTF?') { depth++; continue; }
      if (t[0] === 'OIC') {
        if (depth <= 0) { oic = i; break; }
        depth--;
        continue;
      }
      if (depth > 0) continue;
      if (t[0] === 'OMG') omgs.push({ line: i, valueStart: 1 });
      else if (t[0] === 'OMGWTF') omgwtf = i;
    }
    return { omgs, omgwtf, oic };
  }

  // Execute a range of lines [from, to) exclusive
  function execRange(from: number, to: number): string | undefined {
    ip = from;
    while (ip < to) {
      if (steps++ >= maxSteps) {
        return `Execution limit reached (${maxSteps} steps)`;
      }

      const line = parsedLines[ip];
      const t = line.tokens;

      // Skip structural keywords when encountered during execution
      if (t[0] === 'HAI' || t[0] === 'KTHXBYE' || t[0] === 'YA' || t[0] === 'OIC' || t[0] === 'OMGWTF') {
        ip++;
        continue;
      }
      if (t[0] === 'NO' && t[1] === 'WAI') { ip++; continue; }
      if (t[0] === 'MEBBE') { ip++; continue; }
      if (t[0] === 'OMG') { ip++; continue; }
      if (t[0] === 'GTFO') {
        // Break out of current WTF? or loop — handled by caller
        return 'GTFO';
      }

      const err = execLine(line, t);
      if (err) {
        if (err === 'GTFO') return err;
        return err;
      }
      ip++;
    }
    return undefined;
  }

  function execLine(line: ParsedLine, t: string[]): string | undefined {
    // VISIBLE expr [expr ...] [!]
    if (t[0] === 'VISIBLE') {
      let suppressNewline = false;
      // Check if last token is ! (not part of an expression)
      let endIdx = t.length;
      if (t[t.length - 1] === '!') {
        suppressNewline = true;
        endIdx = t.length - 1;
      }
      // Evaluate all remaining tokens as concatenated expressions
      let result = '';
      const ctx: ParseContext = { tokens: t.slice(0, endIdx), pos: 1, vars };
      while (ctx.pos < ctx.tokens.length) {
        const v = parseExpression(ctx);
        result += toYarn(v);
        // Consume optional AN between expressions
        if (ctx.pos < ctx.tokens.length && ctx.tokens[ctx.pos] === 'AN') {
          // Do NOT consume AN here — VISIBLE concatenates space-separated expressions
          // Actually VISIBLE uses implicit concatenation, AN is consumed in ops
        }
      }
      vars.set('IT', mkYarn(result));
      output += result;
      if (!suppressNewline) output += '\n';
      return undefined;
    }

    // GIMMEH var
    if (t[0] === 'GIMMEH' && t[1]) {
      const varName = t[1];
      const val = readLine();
      vars.set(varName, mkYarn(val));
      return undefined;
    }

    // I HAS A var [ITZ expr]
    if (t[0] === 'I' && t[1] === 'HAS' && t[2] === 'A' && t[3]) {
      const varName = t[3];
      if (t[4] === 'ITZ') {
        const val = evalExpr(t, 5);
        vars.set(varName, { ...val });
      } else {
        vars.set(varName, mkNoob());
      }
      return undefined;
    }

    // var R expr (assignment)
    // var IS NOW A TYPE (recast)
    if (t.length >= 3 && t[1] === 'IS' && t[2] === 'NOW' && t[3] === 'A' && t[4]) {
      const varName = t[0];
      const current = vars.get(varName);
      if (!current) return `Variable ${varName} not declared`;
      vars.set(varName, castTo(current, t[4]));
      return undefined;
    }

    if (t.length >= 3 && t[1] === 'R') {
      const varName = t[0];
      if (!vars.has(varName)) return `Variable ${varName} not declared`;
      const val = evalExpr(t, 2);
      vars.set(varName, { ...val });
      return undefined;
    }

    // O RLY?
    if (t[0] === 'O' && t[1] === 'RLY?') {
      const it = vars.get('IT') || mkNoob();
      const branches = findIfBranches(ip);
      if (branches.oic === -1) return 'O RLY? without matching OIC';

      if (isTruthy(it)) {
        // Execute YA RLY block
        if (branches.yaRly !== -1) {
          const blockEnd = branches.mebbes.length > 0 ? branches.mebbes[0].line :
                           branches.noWai !== -1 ? branches.noWai : branches.oic;
          const err = execRange(branches.yaRly + 1, blockEnd);
          if (err && err !== 'GTFO') return err;
        }
      } else {
        // Try MEBBE branches
        let handled = false;
        for (let mi = 0; mi < branches.mebbes.length; mi++) {
          const mebbe = branches.mebbes[mi];
          const mebbeTokens = parsedLines[mebbe.line].tokens;
          const condVal = evalExprNoIT(mebbeTokens, mebbe.exprStart);
          if (isTruthy(condVal)) {
            const blockEnd = mi + 1 < branches.mebbes.length ? branches.mebbes[mi + 1].line :
                             branches.noWai !== -1 ? branches.noWai : branches.oic;
            const err = execRange(mebbe.line + 1, blockEnd);
            if (err && err !== 'GTFO') return err;
            handled = true;
            break;
          }
        }
        if (!handled && branches.noWai !== -1) {
          const err = execRange(branches.noWai + 1, branches.oic);
          if (err && err !== 'GTFO') return err;
        }
      }
      ip = branches.oic; // will be incremented by main loop
      return undefined;
    }

    // WTF?
    if (t[0] === 'WTF?') {
      const it = vars.get('IT') || mkNoob();
      const branches = findWtfBranches(ip);
      if (branches.oic === -1) return 'WTF? without matching OIC';

      let matched = false;
      let fallThrough = false;
      for (let oi = 0; oi < branches.omgs.length; oi++) {
        const omg = branches.omgs[oi];
        const omgTokens = parsedLines[omg.line].tokens;
        const caseVal = evalExprNoIT(omgTokens, omg.valueStart);

        if (fallThrough || looseEqual(it, caseVal)) {
          matched = true;
          fallThrough = true;
          // Execute until next OMG, OMGWTF, OIC, or GTFO
          const blockEnd = oi + 1 < branches.omgs.length ? branches.omgs[oi + 1].line :
                           branches.omgwtf !== -1 ? branches.omgwtf : branches.oic;
          const err = execRange(omg.line + 1, blockEnd);
          if (err === 'GTFO') { fallThrough = false; break; }
          if (err) return err;
        }
      }
      if (fallThrough && branches.omgwtf !== -1) {
        const err = execRange(branches.omgwtf + 1, branches.oic);
        if (err && err !== 'GTFO') return err;
      }
      if (!matched && branches.omgwtf !== -1) {
        const err = execRange(branches.omgwtf + 1, branches.oic);
        if (err && err !== 'GTFO') return err;
      }
      ip = branches.oic;
      return undefined;
    }

    // IM IN YR label [UPPIN|NERFIN YR var [TIL|WILE expr]]
    if (t[0] === 'IM' && t[1] === 'IN' && t[2] === 'YR') {
      const label = t[3];
      const endLine = loopEnds.get(label);
      if (endLine === undefined) return `No matching IM OUTTA YR ${label}`;

      let opType: string | null = null; // UPPIN or NERFIN
      let loopVar: string | null = null;
      let condType: string | null = null; // TIL or WILE
      let condExprStart = -1;

      let ti = 4;
      if (ti < t.length && (t[ti] === 'UPPIN' || t[ti] === 'NERFIN')) {
        opType = t[ti];
        ti++;
        if (ti < t.length && t[ti] === 'YR') ti++;
        if (ti < t.length) { loopVar = t[ti]; ti++; }
        if (ti < t.length && (t[ti] === 'TIL' || t[ti] === 'WILE')) {
          condType = t[ti];
          condExprStart = ti + 1;
        }
      }

      // Execute loop body (ip+1 to endLine)
      while (true) {
        if (steps++ >= maxSteps) {
          return `Execution limit reached (${maxSteps} steps)`;
        }

        // Check condition before body (if condition exists)
        if (condType && condExprStart >= 0) {
          const condVal = evalExprNoIT(t, condExprStart);
          const condTrue = isTruthy(condVal);
          if (condType === 'TIL' && condTrue) break;
          if (condType === 'WILE' && !condTrue) break;
        }

        const err = execRange(ip + 1, endLine);
        if (err === 'GTFO') break;
        if (err) return err;

        // Apply loop operation
        if (opType && loopVar) {
          const current = vars.get(loopVar) || mkNumbr(0);
          if (opType === 'UPPIN') {
            vars.set(loopVar, mkNumbr(toNumbr(current) + 1));
          } else if (opType === 'NERFIN') {
            vars.set(loopVar, mkNumbr(toNumbr(current) - 1));
          }
        }
      }

      ip = endLine; // will be incremented
      return undefined;
    }

    // IM OUTTA YR — should only be reached as loop end marker, skip
    if (t[0] === 'IM' && t[1] === 'OUTTA' && t[2] === 'YR') {
      return undefined;
    }

    // Bare expression — evaluate and store in IT
    if (t.length > 0) {
      evalExpr(t, 0);
    }

    return undefined;
  }

  // Main execution
  const err = execRange(1, programEnd);
  if (err && err !== 'GTFO') {
    return { output, error: err };
  }

  return { output };
}

// ---------------------------------------------------------------------------
// Operation class
// ---------------------------------------------------------------------------

class LolcodeInterpreter extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Interprets LOLCODE 1.2 — the internet cat programming language. Supports variables, math, strings, conditionals, loops, and casting.';
    this.infoURL = 'https://esolangs.org/wiki/LOLCODE';
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

    const result = executeLolcode(program, stdin, maxSteps);
    let out = stripNulls ? result.output.replace(/\x00/g, '') : result.output;
    if (result.error) return `${out}\n[Error: ${result.error}]`;
    return out;
  }
}

registerCustomOp(LolcodeInterpreter, {
  name: NAME,
  module: 'Custom',
  description: 'Interprets LOLCODE (HAI...KTHXBYE internet cat language).',
  infoURL: 'https://esolangs.org/wiki/LOLCODE',
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

export default LolcodeInterpreter;
