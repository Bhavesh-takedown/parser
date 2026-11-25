import React, { useEffect, useRef } from 'react';

export default function StepLog({ steps, currentStep, onJump }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      const active = listRef.current.querySelector('.log-entry.active');
      if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentStep]);

  if (!steps || steps.length === 0) {
    return (
      <div className="step-log empty">
        <div className="empty-msg">Step log will appear here after parsing</div>
      </div>
    );
  }

  return (
    <div className="step-log">
      <div className="log-header">
        <span className="icon">📋</span> Step Log
      </div>
      <ul className="log-list" ref={listRef}>
        {steps.map((step, i) => (
          <li
            key={i}
            className={`log-entry ${i === currentStep ? 'active' : ''} ${step.error ? 'error' : ''}`}
            onClick={() => onJump(i)}
          >
            <span className="log-index">{i + 1}</span>
            <span className="log-action">{step.action}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
