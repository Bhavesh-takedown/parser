/**
 * ll1-parser.js
 * Simulates LL(1) parsing and generates an array of steps for visualization.
 *
 * Each step: {
 *   stack: string[],         // parse stack (top is last element)
 *   input: string[],         // remaining input tokens
 *   action: string,          // human-readable action description
 *   tree: object | null,     // current parse tree snapshot (deep clone)
 *   nodeId: number,          // node that was just expanded/matched
 *   error: boolean,
 * }
 */

import { EPSILON, END_MARKER, isTerminal } from '../grammar.js';
import { buildLL1Table } from './parse-table.js';

let _nodeCounter = 0;
function newNode(label, parent = null) {
  return { id: _nodeCounter++, label, children: [], parent };
}

function cloneTree(node) {
  if (!node) return null;
  return {
    id: node.id,
    label: node.label,
    children: node.children.map(cloneTree),
  };
}

/**
 * Tokenize input string by whitespace or single character terminals.
 */
export function tokenize(inputStr) {
  return inputStr.trim().split(/\s+/).filter(Boolean);
}

/**
 * Run LL(1) parser and return array of steps.
 */
export function runLL1(grammar, inputStr) {
  _nodeCounter = 0;
  const { table, conflicts } = buildLL1Table(grammar);

  if (conflicts.length > 0) {
    return {
      steps: [],
      error: `Grammar is not LL(1). Conflicts found for: ${conflicts.map(c => `${c.nt}[${c.terminal}]`).join(', ')}`,
      tableInfo: { table, conflicts },
    };
  }

  const tokens = tokenize(inputStr);
  const input = [...tokens, END_MARKER];

  // Setup parse stack — stack contains { symbol, nodeRef }
  const rootNode = newNode(grammar.start);
  const stack = [
    { symbol: END_MARKER, nodeRef: null },
    { symbol: grammar.start, nodeRef: rootNode },
  ]; // top is last

  const steps = [];
  let ip = 0; // input pointer
  let error = false;

  const snapshot = () => ({
    stack: stack.map(s => s.symbol),
    input: input.slice(ip),
    tree: cloneTree(rootNode),
  });

  steps.push({
    ...snapshot(),
    action: `Start: push ${grammar.start} onto stack`,
    nodeId: rootNode.id,
    error: false,
  });

  while (stack.length > 0) {
    const top = stack[stack.length - 1];
    const current = input[ip];

    if (top.symbol === END_MARKER && current === END_MARKER) {
      steps.push({
        ...snapshot(),
        action: '✓ Accept — parsing complete!',
        nodeId: null,
        error: false,
      });
      break;
    }

    if (top.symbol === END_MARKER || current === undefined) {
      steps.push({
        ...snapshot(),
        action: `✗ Error — unexpected end of input`,
        nodeId: null,
        error: true,
      });
      error = true;
      break;
    }

    if (isTerminal(top.symbol, grammar) || top.symbol === END_MARKER) {
      if (top.symbol === current) {
        // Match
        stack.pop();
        ip++;
        steps.push({
          ...snapshot(),
          action: `Match terminal '${current}'`,
          nodeId: top.nodeRef?.id ?? null,
          error: false,
        });
      } else {
        steps.push({
          ...snapshot(),
          action: `✗ Error — expected '${top.symbol}', got '${current}'`,
          nodeId: null,
          error: true,
        });
        error = true;
        break;
      }
    } else {
      // Non-terminal
      const rule = table.get(top.symbol)?.get(current);
      if (!rule) {
        steps.push({
          ...snapshot(),
          action: `✗ Error — no rule for ${top.symbol} with '${current}'`,
          nodeId: null,
          error: true,
        });
        error = true;
        break;
      }

      // Expand
      const parentNode = top.nodeRef;
      stack.pop();

      const childNodes = [];
      if (rule.rhs[0] !== EPSILON) {
        for (const sym of rule.rhs) {
          const childNode = newNode(sym, parentNode);
          parentNode?.children.push(childNode);
          childNodes.push({ symbol: sym, nodeRef: childNode });
        }
        // Push in reverse so top of stack is leftmost
        for (let i = childNodes.length - 1; i >= 0; i--) {
          stack.push(childNodes[i]);
        }
      } else {
        // Epsilon production — add ε child
        const epsNode = newNode(EPSILON, parentNode);
        parentNode?.children.push(epsNode);
      }

      steps.push({
        ...snapshot(),
        action: `Expand: ${rule.lhs} → ${rule.rhs.join(' ')}`,
        nodeId: parentNode?.id ?? null,
        error: false,
      });
    }
  }

  return { steps, error, tableInfo: buildLL1Table(grammar) };
}
