/**
 * lr0-items.js
 * LR(0) Item set construction — closure and goto operations.
 *
 * An LR(0) item is a rule with a dot position:
 *   { lhs: 'E', rhs: ['E', '+', 'T'], dot: 1 }  =>  E → E • + T
 */

/**
 * Augment grammar: add S' → S rule
 */
export function augmentGrammar(grammar) {
  const augStart = grammar.start + "'";
  const augRule = { lhs: augStart, rhs: [grammar.start] };
  return {
    ...grammar,
    rules: [augRule, ...grammar.rules],
    start: augStart,
    nonTerminals: new Set([augStart, ...grammar.nonTerminals]),
  };
}

function itemKey(item) {
  return `${item.lhs} → ${item.rhs.slice(0, item.dot).join(' ')} • ${item.rhs.slice(item.dot).join(' ')}`;
}

function itemsEqual(a, b) {
  return itemKey(a) === itemKey(b);
}

function setKey(itemSet) {
  return [...itemSet].map(itemKey).sort().join(' | ');
}

/**
 * Closure of a set of LR(0) items
 */
export function closure(items, grammar) {
  const result = [...items];
  const seen = new Set(result.map(itemKey));

  let i = 0;
  while (i < result.length) {
    const item = result[i++];
    const dotSymbol = item.rhs[item.dot];
    if (!dotSymbol || !grammar.nonTerminals.has(dotSymbol)) continue;

    for (const rule of grammar.rules) {
      if (rule.lhs !== dotSymbol) continue;
      const newItem = { lhs: rule.lhs, rhs: rule.rhs, dot: 0 };
      const key = itemKey(newItem);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(newItem);
      }
    }
  }
  return result;
}

/**
 * GOTO(I, X) — move dot past symbol X
 */
export function goto(items, symbol, grammar) {
  const moved = items
    .filter(item => item.rhs[item.dot] === symbol)
    .map(item => ({ ...item, dot: item.dot + 1 }));
  if (moved.length === 0) return [];
  return closure(moved, grammar);
}

/**
 * Build canonical collection of LR(0) item sets.
 * Returns { states, transitions }
 * states: Array<Array<Item>>
 * transitions: Map<stateIndex, Map<symbol, stateIndex>>
 */
export function buildItemSets(grammar) {
  const augGrammar = augmentGrammar(grammar);
  const initial = closure([{ lhs: augGrammar.start, rhs: augGrammar.rules[0].rhs, dot: 0 }], augGrammar);

  const states = [initial];
  const stateKeys = [setKey(initial)];
  const transitions = [new Map()]; // transitions[i] = Map<symbol, stateIndex>

  const allSymbols = [...augGrammar.terminals, ...augGrammar.nonTerminals];

  let i = 0;
  while (i < states.length) {
    const state = states[i];
    for (const sym of allSymbols) {
      const g = goto(state, sym, augGrammar);
      if (g.length === 0) continue;

      const key = setKey(g);
      let idx = stateKeys.indexOf(key);
      if (idx === -1) {
        idx = states.length;
        states.push(g);
        stateKeys.push(key);
        transitions.push(new Map());
      }
      transitions[i].set(sym, idx);
    }
    i++;
  }

  return { states, transitions, augGrammar };
}
