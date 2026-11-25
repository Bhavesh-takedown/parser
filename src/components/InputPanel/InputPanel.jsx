import React from 'react';
import _Editor from 'react-simple-code-editor';
// CJS interop: Vite may wrap the module, so grab .default if needed
const Editor = _Editor?.default ?? _Editor;


const DEFAULT_LL1_GRAMMAR = `E -> E_prime T
E_prime -> + T E_prime | eps
T -> F T_prime
T_prime -> * F T_prime | eps
F -> ( E ) | id`;

const DEFAULT_LR0_GRAMMAR = `E -> E + T | T
T -> T * F | F
F -> ( E ) | id`;

const DEFAULT_INPUT = `id + id * id`;

// Simple keyword-based highlighter (no prismjs dependency to avoid crashes)
function highlightGrammar(code) {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(->|→)/g, '<span style="color:#a78bfa;font-weight:700">$1</span>')
    .replace(/\|/g, '<span style="color:#f59e0b">|</span>')
    .replace(/\beps\b|ε/g, '<span style="color:#64748b;font-style:italic">$&</span>');
}

export default function InputPanel({ mode, onModeChange, onParse }) {
  const [grammar, setGrammar] = React.useState(
    mode === 'll1' ? DEFAULT_LL1_GRAMMAR : DEFAULT_LR0_GRAMMAR
  );
  const [inputStr, setInputStr] = React.useState(DEFAULT_INPUT);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    setGrammar(mode === 'll1' ? DEFAULT_LL1_GRAMMAR : DEFAULT_LR0_GRAMMAR);
    setError('');
  }, [mode]);

  const handleParse = () => {
    setError('');
    try {
      onParse(grammar, inputStr);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="input-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span className="icon">&#9881;</span> Parser Config
        </h2>
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'll1' ? 'active' : ''}`}
            onClick={() => onModeChange('ll1')}
          >
            LL(1)
          </button>
          <button
            className={`mode-btn ${mode === 'lr0' ? 'active' : ''}`}
            onClick={() => onModeChange('lr0')}
          >
            SLR(1)
          </button>
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">Grammar</label>
        <div className="code-editor-wrap">
          <Editor
            value={grammar}
            onValueChange={setGrammar}
            highlight={highlightGrammar}
            padding={12}
            style={{
              fontFamily: '"Fira Code", "JetBrains Mono", monospace',
              fontSize: 13,
              minHeight: 160,
              background: 'transparent',
              color: '#e2e8f0',
              lineHeight: 1.6,
            }}
          />
        </div>
        <p className="field-hint">
          Use <code>-&gt;</code> for arrows &middot; <code>|</code> for alternatives &middot; <code>eps</code> for epsilon
        </p>
      </div>

      <div className="field-group">
        <label className="field-label">Input String</label>
        <input
          type="text"
          className="input-string"
          value={inputStr}
          onChange={e => setInputStr(e.target.value)}
          placeholder="e.g. id + id * id"
          spellCheck={false}
        />
        <p className="field-hint">Separate tokens with spaces</p>
      </div>

      {error && <div className="error-box">&#9888; {error}</div>}

      <button className="parse-btn" onClick={handleParse}>
        <span>Parse</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
