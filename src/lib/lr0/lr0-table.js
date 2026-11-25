/**
 * lr0-table.js
 * Builds the LR(0) ACTION/GOTO table.
 * Uses SLR(1) lookaheads (FOLLOW sets) to resolve reduce conflicts.
 */

import { END_MARKER } from '../grammar.js';
import { buildItemSets } from './lr0-items.js';
import { computeFirst, computeFollow } from '../ll1/first-follow.js';

/**
 * Build SLR(1) ACTION/GOTO table.
 * Returns { action, goto, states, transitions, augGrammar, conflicts }
 *
 * action[state][terminal] = { type: 'shift'|'reduce'|'accept', state?, rule? }
 * goto[state][nonTerminal] = nextState
 */
export function buildLRTable(grammar) {
  const { states, transitions, augGrammar } = buildItemSets(grammar);
  const first = computeFirst(augGrammar);
  const follow = computeFollow(augGrammar, first);

  const action = states.map(() => new Map());
  const gotoTable = states.map(() => new Map());
  const conflicts = [];

  const augStartRule = augGrammar.rules[0]; // S' → S

  for (let i = 0; i < states.length; i++) {
    const state = states[i];

    for (const [sym, j] of transitions[i]) {
      if (augGrammar.terminals.has(sym)) {
        // Shift action
        action[i].set(sym, { type: 'shift', state: j });
      } else if (augGrammar.nonTerminals.has(sym)) {
        gotoTable[i].set(sym, j);
      }
    }

    for (const item of state) {
      // Reduce item: dot is at the end
      if (item.dot === item.rhs.length) {
        if (item.lhs === augStartRule.lhs) {
          // Accept
          action[i].set(END_MARKER, { type: 'accept' });
        } else {
          // Find the original rule in grammar (not augmented)
          const rule = grammar.rules.find(
            r => r.lhs === item.lhs && r.rhs.join(' ') === item.rhs.join(' ')
          ) ?? { lhs: item.lhs, rhs: item.rhs };

          // SLR(1): only reduce on tokens in FOLLOW(lhs)
          const followSet = follow.get(item.lhs) ?? new Set();
          for (const terminal of followSet) {
            if (action[i].has(terminal)) {
              conflicts.push({ state: i, terminal, existing: action[i].get(terminal), reduce: rule });
            }
            action[i].set(terminal, { type: 'reduce', rule });
          }
        }
      }
    }
  }

  return { action, goto: gotoTable, states, transitions, augGrammar, conflicts };
}
