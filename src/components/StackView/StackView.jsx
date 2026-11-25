import React, { useEffect, useRef } from 'react';

/**
 * StackView — animated visualization of the parse stack.
 * For LL(1): shows a single symbol stack.
 * For LR(0): shows state stack and symbol stack side by side.
 */
export default function StackView({ step, mode }) {
  if (!step) {
    return (
      <div className="stack-view empty-state">
        <div className="empty-msg">Parse to see the stack</div>
      </div>
    );
  }

  const isLR = mode === 'lr0';

  if (isLR) {
    const stateStack = step.stateStack ?? [];
    const symbolStack = step.symbolStack ?? [];
    return (
      <div className="stack-view lr-stack">
        <div className="stack-col">
          <div className="stack-col-label">State Stack</div>
          <StackColumn items={stateStack.map(String)} color="state" />
        </div>
        <div className="stack-col">
          <div className="stack-col-label">Symbol Stack</div>
          <StackColumn items={symbolStack} color="symbol" />
        </div>
        <div className="stack-col">
          <div className="stack-col-label">Input</div>
          <InputTokens tokens={step.input ?? []} />
        </div>
      </div>
    );
  }

  // LL(1)
  const stack = step.stack ?? [];
  return (
    <div className="stack-view ll-stack">
      <div className="stack-col">
        <div className="stack-col-label">Stack (top →)</div>
        <StackColumn items={[...stack].reverse()} color="symbol" />
      </div>
      <div className="stack-col">
        <div className="stack-col-label">Input</div>
        <InputTokens tokens={step.input ?? []} />
      </div>
    </div>
  );
}

function StackColumn({ items, color }) {
  return (
    <div className={`stack-column color-${color}`}>
      {items.length === 0 && <div className="stack-cell empty">—</div>}
      {items.map((item, i) => (
        <StackCell key={`${item}-${i}`} label={item} isTop={i === 0} color={color} />
      ))}
    </div>
  );
}

function StackCell({ label, isTop, color }) {
  const ref = useRef(null);
  useEffect(() => {
    if (isTop && ref.current) {
      ref.current.classList.remove('pop-in');
      void ref.current.offsetWidth; // reflow
      ref.current.classList.add('pop-in');
    }
  }, [label, isTop]);

  return (
    <div
      ref={ref}
      className={`stack-cell ${isTop ? 'top' : ''} cell-${color}`}
    >
      {label}
    </div>
  );
}

function InputTokens({ tokens }) {
  return (
    <div className="input-tokens">
      {tokens.map((t, i) => (
        <span
          key={i}
          className={`input-token ${i === 0 ? 'current' : ''}`}
        >
          {t}
        </span>
      ))}
    </div>
  );
}
