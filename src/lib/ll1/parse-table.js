/**
 * parse-table.js
 * Builds the LL(1) parse table from a grammar and its FIRST/FOLLOW sets.
 */

import { EPSILON, END_MARKER } from '../grammar.js';
import { computeFirst, computeFollow, firstOfSequence } from './first-follow.js';

/**
 * Build LL(1) parse table.
 * Returns { table, first, follow, conflicts }
 * table: Map<NT, Map<terminal, { lhs, rhs }>>
 */
export function buildLL1Table(grammar) {
  const first = computeFirst(grammar);
  const follow = computeFollow(grammar, first);
  const { rules, nonTerminals } = grammar;

  // table[NT][terminal] = rule
  const table = new Map();
  for (const nt of nonTerminals) table.set(nt, new Map());

  const conflicts = [];

  for (const rule of rules) {
    const { lhs, rhs } = rule;
    const firstAlpha = firstOfSequence(rhs, first);

    for (const a of firstAlpha) {
      if (a !== EPSILON) {
        if (table.get(lhs).has(a)) {
          conflicts.push({ nt: lhs, terminal: a, rule });
        }
        table.get(lhs).set(a, rule);
      }
    }

    if (firstAlpha.has(EPSILON)) {
      for (const b of follow.get(lhs)) {
        if (table.get(lhs).has(b)) {
          conflicts.push({ nt: lhs, terminal: b, rule });
        }
        table.get(lhs).set(b, rule);
      }
    }
  }

  return { table, first, follow, conflicts };
}
