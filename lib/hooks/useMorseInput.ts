'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const HOLD_THRESHOLD = 200;
const COMPLETION_DELAY = 600;

export function useMorseInput(onComplete: (pattern: string) => void) {
  const [currentPattern, setCurrentPattern] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const holdStartRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const patternRef = useRef('');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (patternRef.current) {
        onCompleteRef.current(patternRef.current);
        patternRef.current = '';
        setCurrentPattern('');
        setIsBuilding(false);
      }
    }, COMPLETION_DELAY);
  }, []);

  const appendSymbol = useCallback(
    (symbol: '.' | '-') => {
      patternRef.current += symbol;
      setCurrentPattern(patternRef.current);
      setIsBuilding(true);
      resetTimeout();
    },
    [resetTimeout]
  );

  // Mode A: single key/tap — hold duration determines dot vs dash
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        holdStartRef.current = Date.now();
      }
    },
    []
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        const duration = Date.now() - holdStartRef.current;
        appendSymbol(duration < HOLD_THRESHOLD ? '.' : '-');
      }
    },
    [appendSymbol]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Mode A: touch events for tap area
  const tapAreaProps = {
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      holdStartRef.current = Date.now();
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      const duration = Date.now() - holdStartRef.current;
      appendSymbol(duration < HOLD_THRESHOLD ? '.' : '-');
    },
    onMouseDown: () => {
      holdStartRef.current = Date.now();
    },
    onMouseUp: () => {
      const duration = Date.now() - holdStartRef.current;
      appendSymbol(duration < HOLD_THRESHOLD ? '.' : '-');
    },
  };

  // Mode B: explicit dot/dash buttons
  const dotButtonProps = {
    onClick: () => appendSymbol('.'),
  };

  const dashButtonProps = {
    onClick: () => appendSymbol('-'),
  };

  const reset = useCallback(() => {
    patternRef.current = '';
    setCurrentPattern('');
    setIsBuilding(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return {
    currentPattern,
    isBuilding,
    dotButtonProps,
    dashButtonProps,
    tapAreaProps,
    reset,
  };
}
