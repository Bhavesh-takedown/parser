/**
 * first-follow.js
 * Computes FIRST and FOLLOW sets for a given grammar.
 */

import { EPSILON, END_MARKER } from '../grammar.js';

/**
 * Compute FIRST sets for all symbols in the grammar.
 * Returns a Map<symbol, Set<terminal>>
 */
export function computeFirst(grammar) {
  const { rules, terminals, nonTerminals } = grammar;
  const first = new Map();

  // Initialize
  for (const t of terminals) first.set(t, new Set([t]));
  for (const nt of nonTerminals) first.set(nt, new Set());

  let changed = true;
  while (changed) {
    changed = false;
    for (const { lhs, rhs } of rules) {
      const before = first.get(lhs).size;
      const result = firstOfSequence(rhs, first);
      for (const s of result) {
        first.get(lhs).add(s);
      }
      if (first.get(lhs).size > before) changed = true;
    }
  }

  return first;
}

/**
 * FIRST of a sequence of symbols (e.g., right-hand side of a production)
 */
export function firstOfSequence(symbols, firstMap) {
  const result = new Set();
  if (symbols.length === 0 || symbols[0] === EPSILON) {
    result.add(EPSILON);
    return result;
  }

  for (const sym of symbols) {
    const f = firstMap.get(sym) ?? new Set([sym]);
    for (const s of f) {
      if (s !== EPSILON) result.add(s);
    }
    if (!f.has(EPSILON)) break;
    // If we've reached the last symbol and it can derive epsilon
    if (sym === symbols[symbols.length - 1]) result.add(EPSILON);
  }

  return result;
}

/**
 * Compute FOLLOW sets for all non-terminals.
 * Returns a Map<nonTerminal, Set<terminal>>
 */
export function computeFollow(grammar, first) {
  const { rules, nonTerminals, start } = grammar;
  const follow = new Map();

  for (const nt of nonTerminals) follow.set(nt, new Set());
  follow.get(start).add(END_MARKER);

  let changed = true;
  while (changed) {
    changed = false;
    for (const { lhs, rhs } of rules) {
      for (let i = 0; i < rhs.length; i++) {
        const B = rhs[i];
        if (!nonTerminals.has(B)) continue;

        const before = follow.get(B).size;
        const beta = rhs.slice(i + 1);
        const firstBeta = firstOfSequence(beta.length ? beta : [EPSILON], first);

        for (const s of firstBeta) {
          if (s !== EPSILON) follow.get(B).add(s);
        }

        if (firstBeta.has(EPSILON) || beta.length === 0) {
          for (const s of follow.get(lhs)) {
            follow.get(B).add(s);
          }
        }

        if (follow.get(B).size > before) changed = true;
      }
    }
  }

  return follow;
}
