'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMorseInput } from '@/lib/hooks/useMorseInput';
import MorseDisplay from '@/components/lesson/MorseDisplay';

interface MorseInputProps {
  onComplete: (pattern: string) => void;
  mode?: 'single' | 'buttons' | 'both';
  disabled?: boolean;
}

export default function MorseInput({
  onComplete,
  mode = 'both',
  disabled = false,
}: MorseInputProps) {
  const [pulsing, setPulsing] = useState(false);

  const handleComplete = useCallback(
    (pattern: string) => {
      if (!disabled) {
        onComplete(pattern);
      }
    },
    [onComplete, disabled]
  );

  const { currentPattern, isBuilding, tapAreaProps, dotButtonProps, dashButtonProps } =
    useMorseInput(handleComplete);

  const triggerPulse = () => {
    setPulsing(true);
    setTimeout(() => setPulsing(false), 300);
  };

  const wrappedTapAreaProps = {
    onTouchStart: (e: React.TouchEvent) => {
      if (disabled) return;
      triggerPulse();
      tapAreaProps.onTouchStart(e);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (disabled) return;
      tapAreaProps.onTouchEnd(e);
    },
    onMouseDown: () => {
      if (disabled) return;
      triggerPulse();
      tapAreaProps.onMouseDown();
    },
    onMouseUp: () => {
      if (disabled) return;
      tapAreaProps.onMouseUp();
    },
  };

  const showSingle = mode === 'single' || mode === 'both';
  const showButtons = mode === 'buttons' || mode === 'both';

  return (
    <div
      className={`flex flex-col items-center gap-4 w-full ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
    >
      {currentPattern && (
        <div className="mb-2">
          <MorseDisplay pattern={currentPattern} size="sm" />
        </div>
      )}

      {isBuilding && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Listening...
        </p>
      )}

      {showSingle && (
        <div
          {...wrappedTapAreaProps}
          className={`w-full h-32 rounded-2xl flex items-center justify-center cursor-pointer select-none ${pulsing ? 'animate-pulse-dot' : ''}`}
          style={{
            backgroundColor: 'var(--surface)',
            border: '2px dashed var(--border)',
          }}
        >
          <p
            className="text-lg font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            Tap or hold spacebar
          </p>
        </div>
      )}

      {showButtons && (
        <div className="flex gap-4 w-full">
          <button
            type="button"
            onClick={() => {
              if (disabled) return;
              triggerPulse();
              dotButtonProps.onClick();
            }}
            className="flex-1 h-20 rounded-xl text-3xl font-bold cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--surface)',
              border: '2px solid var(--border)',
              color: 'var(--primary)',
            }}
          >
            &middot;
          </button>
          <button
            type="button"
            onClick={() => {
              if (disabled) return;
              triggerPulse();
              dashButtonProps.onClick();
            }}
            className="flex-1 h-20 rounded-xl text-3xl font-bold cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--surface)',
              border: '2px solid var(--border)',
              color: 'var(--primary)',
            }}
          >
            &mdash;
          </button>
        </div>
      )}
    </div>
  );
}
