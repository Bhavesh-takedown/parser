import React from 'react';

export default function StepControls({
  currentStep,
  totalSteps,
  playing,
  speed,
  setSpeed,
  onPrev,
  onNext,
  onPlay,
  onPause,
}) {
  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  return (
    <div className="step-controls">
      <div className="controls-row">
        <button
          className="ctrl-btn"
          onClick={onPrev}
          disabled={currentStep === 0}
          title="Previous step"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
          </svg>
        </button>

        <button
          className={`ctrl-btn play-btn ${playing ? 'playing' : ''}`}
          onClick={playing ? onPause : onPlay}
          disabled={totalSteps === 0}
          title={playing ? 'Pause' : 'Auto-play'}
        >
          {playing ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          className="ctrl-btn"
          onClick={onNext}
          disabled={currentStep >= totalSteps - 1}
          title="Next step"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 3.92V8.08L8.5 12zM16 6h2v12h-2z" />
          </svg>
        </button>

        <div className="step-counter">
          {totalSteps > 0
            ? `Step ${currentStep + 1} / ${totalSteps}`
            : 'No steps'}
        </div>

        <div className="speed-control">
          <label>Speed</label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
          />
          <span>{speed}×</span>
        </div>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
