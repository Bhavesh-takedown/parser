import React, { useState, useCallback } from 'react';
import InputPanel from './components/InputPanel/InputPanel';
import StackView from './components/StackView/StackView';
import ParseTreeView from './components/ParseTreeView/ParseTreeView';
import StepControls from './components/StepControls/StepControls';
import StepLog from './components/StepLog/StepLog';
import { useParserSteps } from './hooks/useParserSteps';
import { parseGrammar } from './lib/grammar';
import { runLL1 } from './lib/ll1/ll1-parser';
import { runLR0 } from './lib/lr0/lr0-parser';
import './index.css';

export default function App() {
  const [mode, setMode] = useState('lr0');
  const [steps, setSteps] = useState([]);
  const [parseError, setParseError] = useState('');
  const [conflicts, setConflicts] = useState([]);
  const [hasParsed, setHasParsed] = useState(false);

  const {
    currentStep,
    totalSteps,
    playing,
    speed,
    setSpeed,
    prev,
    next,
    jumpTo,
    startPlayback,
    stopPlayback,
  } = useParserSteps(steps);

  const handleParse = useCallback((grammarStr, inputStr) => {
    setParseError('');
    setConflicts([]);

    let grammar;
    try {
      grammar = parseGrammar(grammarStr);
    } catch (e) {
      setParseError(`Grammar parse error: ${e.message}`);
      setSteps([]);
      return;
    }

    try {
      let result;
      if (mode === 'll1') {
        result = runLL1(grammar, inputStr);
      } else {
        result = runLR0(grammar, inputStr);
      }

      if (result.error && typeof result.error === 'string') {
        setParseError(result.error);
        setSteps([]);
        return;
      }

      if (result.conflicts?.length > 0) {
        setConflicts(result.conflicts);
      }

      setSteps(result.steps);
      setHasParsed(true);
    } catch (e) {
      setParseError(`Parser error: ${e.message}`);
      setSteps([]);
    }
  }, [mode]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setSteps([]);
    setParseError('');
    setConflicts([]);
    setHasParsed(false);
  };

  const currentStepData = steps[currentStep] ?? null;

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">⟨/⟩</span>
            <div>
              <h1 className="app-title">Parser Visualizer</h1>
              <p className="app-subtitle">Interactive LL(1) & SLR(1) parsing visualization</p>
            </div>
          </div>
          <div className="header-badges">
            <span className="badge">D3.js</span>
            <span className="badge">React</span>
            <span className="badge active-badge">{mode === 'll1' ? 'LL(1)' : 'SLR(1)'}</span>
          </div>
        </div>
      </header>

      {/* Conflict warning */}
      {conflicts.length > 0 && (
        <div className="conflict-banner">
          ⚠ {conflicts.length} SLR conflict(s) detected — results may be approximate
        </div>
      )}

      {parseError && (
        <div className="error-banner">✗ {parseError}</div>
      )}

      <main className="app-main">
        {/* Left column: InputPanel + StepLog */}
        <aside className="left-col">
          <InputPanel
            mode={mode}
            onModeChange={handleModeChange}
            onParse={handleParse}
          />
          <StepLog
            steps={steps}
            currentStep={currentStep}
            onJump={jumpTo}
          />
        </aside>

        {/* Center: Parse Tree */}
        <section className="center-col">
          <div className="panel glass-panel">
            <div className="panel-header">
              <h2 className="panel-title"><span className="icon">🌳</span> Parse Tree</h2>
              {hasParsed && (
                <span className="step-badge">
                  Step {currentStep + 1} / {totalSteps}
                </span>
              )}
            </div>
            <div className="tree-container">
              <ParseTreeView step={currentStepData} mode={mode} />
            </div>
          </div>

          {/* Step Controls */}
          <div className="panel glass-panel controls-panel">
            <div className="action-display">
              {currentStepData ? (
                <span className={`action-text ${currentStepData.error ? 'error' : ''}`}>
                  {currentStepData.action}
                </span>
              ) : (
                <span className="action-text muted">Press Parse to begin</span>
              )}
            </div>
            <StepControls
              currentStep={currentStep}
              totalSteps={totalSteps}
              playing={playing}
              speed={speed}
              setSpeed={setSpeed}
              onPrev={prev}
              onNext={next}
              onPlay={startPlayback}
              onPause={stopPlayback}
            />
          </div>
        </section>

        {/* Right column: Stack View */}
        <aside className="right-col">
          <div className="panel glass-panel stack-panel">
            <div className="panel-header">
              <h2 className="panel-title"><span className="icon">📚</span> Stack View</h2>
            </div>
            <StackView step={currentStepData} mode={mode} />
          </div>
        </aside>
      </main>
    </div>
  );
}
