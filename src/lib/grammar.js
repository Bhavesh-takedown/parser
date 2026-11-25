/**
 * grammar.js
 * Parses a BNF-like grammar string into a structured object.
 * Format:
 *   E → E + T | T
 *   T → T * F | F
 *   F → ( E ) | id
 * Epsilon can be written as 'ε', 'eps', or left empty.
 */

export const EPSILON = 'ε';
export const END_MARKER = '$';

/**
 * Parse a grammar string into { rules, terminals, nonTerminals, start }
 * rules: Array<{ lhs: string, rhs: string[] }> where rhs is array of symbols
 */
export function parseGrammar(grammarStr) {
  const lines = grammarStr
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('//'));

  if (lines.length === 0) throw new Error('Grammar is empty.');

  const rules = [];
  const nonTerminals = new Set();
  let start = null;

  for (const line of lines) {
    // Support → or -> or :=
    const match = line.match(/^(.+?)\s*(?:→|->|:=)\s*(.*)$/);
    if (!match) throw new Error(`Invalid production: "${line}"`);

    const lhs = match[1].trim();
    const rhsStr = match[2].trim();

    if (!start) start = lhs;
    nonTerminals.add(lhs);

    const alternatives = rhsStr.split('|').map(a => a.trim());
    for (const alt of alternatives) {
      if (alt === '' || alt === EPSILON || alt === 'eps' || alt === 'epsilon') {
        rules.push({ lhs, rhs: [EPSILON] });
      } else {
        // Split by whitespace to get individual symbols
        const symbols = alt.split(/\s+/).filter(s => s.length > 0);
        rules.push({ lhs, rhs: symbols });
      }
    }
  }

  // Compute terminals = all symbols that are not non-terminals
  const allSymbols = new Set();
  for (const rule of rules) {
    for (const sym of rule.rhs) {
      if (sym !== EPSILON) allSymbols.add(sym);
    }
  }
  const terminals = new Set([...allSymbols].filter(s => !nonTerminals.has(s)));
  terminals.add(END_MARKER);

  return {
    rules,
    terminals,
    nonTerminals,
    start,
  };
}

export function isTerminal(symbol, grammar) {
  return !grammar.nonTerminals.has(symbol);
}

export function isNonTerminal(symbol, grammar) {
  return grammar.nonTerminals.has(symbol);
}
