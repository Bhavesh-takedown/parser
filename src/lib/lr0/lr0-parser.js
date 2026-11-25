/**
 * lr0-parser.js
 * Simulates SLR(1) parsing and generates an array of steps for visualization.
 *
 * Each step: {
 *   stateStack: number[],   // LR state stack
 *   symbolStack: string[],  // symbol stack
 *   input: string[],        // remaining input
 *   action: string,         // human-readable action
 *   tree: object | null,    // parse tree snapshot
 *   error: boolean,
 * }
 */

import { END_MARKER } from '../grammar.js';
import { buildLRTable } from './lr0-table.js';
import { tokenize } from '../ll1/ll1-parser.js';

let _nodeCounter = 0;
function newNode(label) {
  return { id: _nodeCounter++, label, children: [] };
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
 * Run SLR(1) parser and return array of steps.
 */
export function runLR0(grammar, inputStr) {
  _nodeCounter = 0;
  const tableResult = buildLRTable(grammar);
  const { action, goto, conflicts } = tableResult;

  if (conflicts.length > 0) {
    // Report conflicts but still attempt to parse (using last-set wins)
    console.warn('SLR conflicts:', conflicts);
  }

  const tokens = tokenize(inputStr);
  const input = [...tokens, END_MARKER];

  const stateStack = [0];
  const symbolStack = [];       // symbols on stack
  const nodeStack = [];         // parse tree nodes corresponding to symbols

  let ip = 0;
  const steps = [];

  const snapshot = () => ({
    stateStack: [...stateStack],
    symbolStack: [...symbolStack],
    input: input.slice(ip),
    // Top-level "forest" of trees — we'll combine on accept
    treeRoots: nodeStack.map(n => cloneTree(n)),
  });

  steps.push({
    ...snapshot(),
    action: 'Start: state stack = [0], empty symbol stack',
    error: false,
  });

  let iterations = 0;
  const MAX_ITER = 1000;

  while (iterations++ < MAX_ITER) {
    const state = stateStack[stateStack.length - 1];
    const lookahead = input[ip];
    const act = action[state]?.get(lookahead);

    if (!act) {
      const validTokens = [...(action[state]?.keys() ?? [])].join(', ');
      steps.push({
        ...snapshot(),
        action: `✗ Error — no action for state ${state} with '${lookahead}'. Expected: ${validTokens || 'nothing'}`,
        error: true,
      });
      break;
    }

    if (act.type === 'shift') {
      const node = newNode(lookahead);
      symbolStack.push(lookahead);
      nodeStack.push(node);
      stateStack.push(act.state);
      ip++;
      steps.push({
        ...snapshot(),
        action: `Shift '${lookahead}' → state ${act.state}`,
        error: false,
      });
    } else if (act.type === 'reduce') {
      const { lhs, rhs } = act.rule;
      const rhsLen = rhs[0] === 'ε' ? 0 : rhs.length;

      // Create parent node
      const parentNode = newNode(lhs);
      const children = nodeStack.splice(nodeStack.length - rhsLen, rhsLen);
      symbolStack.splice(symbolStack.length - rhsLen, rhsLen);
      stateStack.splice(stateStack.length - rhsLen, rhsLen);
      parentNode.children = children;
      nodeStack.push(parentNode);

      symbolStack.push(lhs);

      const topState = stateStack[stateStack.length - 1];
      const nextState = goto[topState]?.get(lhs);
      if (nextState === undefined) {
        steps.push({
          ...snapshot(),
          action: `✗ Error — GOTO missing for state ${topState} on '${lhs}'`,
          error: true,
        });
        break;
      }
      stateStack.push(nextState);

      steps.push({
        ...snapshot(),
        action: `Reduce by ${lhs} → ${rhs.join(' ')}  (goto state ${nextState})`,
        error: false,
      });
    } else if (act.type === 'accept') {
      // Build final tree: the grammar start node is on nodeStack
      const finalTree = nodeStack[nodeStack.length - 1] ? cloneTree(nodeStack[nodeStack.length - 1]) : null;
      steps.push({
        stateStack: [...stateStack],
        symbolStack: [...symbolStack],
        input: [END_MARKER],
        treeRoots: finalTree ? [finalTree] : [],
        action: '✓ Accept — parsing complete!',
        error: false,
      });
      break;
    }
  }

  if (iterations >= MAX_ITER) {
    steps.push({
      ...snapshot(),
      action: '✗ Error — maximum iterations exceeded (possible grammar loop)',
      error: true,
    });
  }

  return { steps, conflicts, tableInfo: tableResult };
}
