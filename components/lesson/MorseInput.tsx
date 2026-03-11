'use client';

import { useState, useEffect } from 'react';
import { useMorseInput } from '@/lib/hooks/useMorseInput';
import MorseDisplay from '@/components/lesson/MorseDisplay';

interface MorseInputProps {
  onChange: (pattern: string) => void;
  mode?: 'single' | 'buttons' | 'both';
}

export default function MorseInput({
  onChange,
  mode = 'both',
}: MorseInputProps) {
  const [pulsing, setPulsing] = useState(false);

  const { currentPattern, isBuilding, tapAreaProps, dotButtonProps, dashButtonProps, reset } =
    useMorseInput();

  // Notify parent whenever pattern changes
  useEffect(() => {
    onChange(currentPattern);
  }, [currentPattern, onChange]);

  const triggerPulse = () => {
    setPulsing(true);
    setTimeout(() => setPulsing(false), 300);
  };

  const wrappedTapAreaProps = {
    onTouchStart: (e: React.TouchEvent) => {
      triggerPulse();
      tapAreaProps.onTouchStart(e);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      tapAreaProps.onTouchEnd(e);
    },
    onMouseDown: () => {
      triggerPulse();
      tapAreaProps.onMouseDown();
    },
    onMouseUp: () => {
      tapAreaProps.onMouseUp();
    },
  };

  const handleClear = () => {
    reset();
    onChange('');
  };

  const showSingle = mode === 'single' || mode === 'both';
  const showButtons = mode === 'buttons' || mode === 'both';

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="min-h-[3.5rem] flex flex-col items-center justify-center">
        {currentPattern && (
          <div className="mb-2 flex items-center gap-2">
            <MorseDisplay pattern={currentPattern} size="sm" />
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-medium px-2 py-1 rounded-lg transition-colors cursor-pointer"
              style={{
                color: 'var(--text-muted)',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
              }}
            >
              Clear
            </button>
          </div>
        )}

        {isBuilding && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Building...
          </p>
        )}
      </div>

      {showSingle && (
        <div
          {...wrappedTapAreaProps}
          className={`hidden lg:flex w-full h-32 rounded-2xl items-center justify-center cursor-pointer select-none ${pulsing ? 'animate-pulse-dot' : ''}`}
          style={{
            backgroundColor: 'var(--surface)',
            border: '2px dashed var(--border)',
          }}
        >
          <p
            className="text-lg font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            Hold spacebar for dash, tap for dot
          </p>
        </div>
      )}

      {showButtons && (
        <div className="flex gap-4 w-full">
          <button
            type="button"
            onClick={() => {
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
