/**
 * useParserSteps.js
 * Manages current step index and auto-play playback state.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export function useParserSteps(steps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // steps per second
  const timerRef = useRef(null);

  const totalSteps = steps.length;

  const stopPlayback = useCallback(() => {
    setPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startPlayback = useCallback(() => {
    if (currentStep >= totalSteps - 1) setCurrentStep(0);
    setPlaying(true);
  }, [currentStep, totalSteps]);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= totalSteps - 1) {
            stopPlayback();
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, speed, totalSteps, stopPlayback]);

  // Reset when steps change
  useEffect(() => {
    stopPlayback();
    setCurrentStep(0);
  }, [steps]); // eslint-disable-line

  const prev = () => {
    stopPlayback();
    setCurrentStep(s => Math.max(0, s - 1));
  };

  const next = () => {
    stopPlayback();
    setCurrentStep(s => Math.min(totalSteps - 1, s + 1));
  };

  const jumpTo = (idx) => {
    stopPlayback();
    setCurrentStep(Math.max(0, Math.min(totalSteps - 1, idx)));
  };

  return {
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
  };
}
