'use client';

import { MORSE_MAP } from '@/lib/morse/codes';
import type { LetterProgress, MasteryLevel } from '@/types';

interface AlphabetGridProps {
  letterProgress: LetterProgress[];
  onSymbolClick?: (symbol: string) => void;
  symbols?: string[];
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DIGITS = '0123456789'.split('');

const masteryStyles: Record<MasteryLevel, string> = {
  0: 'bg-gray-100 text-gray-400 border-gray-200',
  1: 'bg-blue-50 text-blue-600 border-blue-200',
  2: 'bg-amber-50 text-amber-600 border-amber-200',
  3: 'bg-green-50 text-green-600 border-green-200',
};

export default function AlphabetGrid({ letterProgress, onSymbolClick, symbols }: AlphabetGridProps) {
  const progressMap = new Map<string, MasteryLevel>();
  for (const lp of letterProgress) {
    progressMap.set(lp.symbol.toUpperCase(), lp.mastery_level);
  }

  function getMastery(symbol: string): MasteryLevel {
    return progressMap.get(symbol.toUpperCase()) ?? 0;
  }

  function renderCell(symbol: string) {
    const mastery = getMastery(symbol);
    const morse = MORSE_MAP[symbol] ?? '';
    const clickable = !!onSymbolClick;

    return (
      <button
        key={symbol}
        type="button"
        onClick={() => onSymbolClick?.(symbol)}
        disabled={!clickable}
        className={`flex flex-col items-center justify-center rounded-lg border p-2 transition-colors ${masteryStyles[mastery]} ${clickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
      >
        <span className="text-sm font-bold">{symbol}</span>
        <span className="text-xs text-[var(--text-muted)]">{morse}</span>
      </button>
    );
  }

  if (symbols) {
    return (
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {symbols.map(renderCell)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Letters
        </h3>
        <div className="grid grid-cols-6 gap-2 md:grid-cols-8">
          {LETTERS.map(renderCell)}
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Numbers
        </h3>
        <div className="grid grid-cols-6 gap-2 md:grid-cols-8">
          {DIGITS.map(renderCell)}
        </div>
      </div>
    </div>
  );
}
