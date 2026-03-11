'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const HOLD_THRESHOLD = 200;

export function useMorseInput(onSymbol?: (symbol: '.' | '-') => void) {
  const [currentPattern, setCurrentPattern] = useState('');
  const holdStartRef = useRef<number>(0);
  const patternRef = useRef('');
  const onSymbolRef = useRef(onSymbol);
  onSymbolRef.current = onSymbol;

  const appendSymbol = useCallback((symbol: '.' | '-') => {
    patternRef.current += symbol;
    setCurrentPattern(patternRef.current);
    onSymbolRef.current?.(symbol);
  }, []);

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
    };
  }, [handleKeyDown, handleKeyUp]);

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

  const dotButtonProps = {
    onClick: () => appendSymbol('.'),
  };

  const dashButtonProps = {
    onClick: () => appendSymbol('-'),
  };

  const reset = useCallback(() => {
    patternRef.current = '';
    setCurrentPattern('');
  }, []);

  const isBuilding = currentPattern.length > 0;

  return {
    currentPattern,
    isBuilding,
    dotButtonProps,
    dashButtonProps,
    tapAreaProps,
    reset,
  };
}
