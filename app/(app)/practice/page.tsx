'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { MORSE_MAP } from '@/lib/morse/codes';
import { playMorse } from '@/lib/morse/audio';
import { shuffle } from '@/lib/morse/engine';
import type { LetterProgress } from '@/types';
import MorseDisplay from '@/components/lesson/MorseDisplay';
import MorseInput from '@/components/lesson/MorseInput';

type PracticeMode = 'tap' | 'listen' | 'identify';
type SymbolCategory = 'letters' | 'numbers' | 'punctuation';

export default function PracticePage() {
  const [letterProgress, setLetterProgress] = useState<LetterProgress[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<Set<string>>(new Set());
  const [isActive, setIsActive] = useState(false);
  const [currentSymbol, setCurrentSymbol] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [mode, setMode] = useState<PracticeMode>('tap');
  const [category, setCategory] = useState<SymbolCategory>('letters');
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [practicePattern, setPracticePattern] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function loadProgress() {
      const res = await fetch('/api/progress');
      const data = await res.json();
      setLetterProgress(data.letterProgress || []);

      // Auto-select letters that are learning or mastered
      const autoSelected = new Set<string>();
      for (const lp of data.letterProgress || []) {
        if (lp.mastery_level >= 1) {
          autoSelected.add(lp.symbol);
        }
      }
      // If none, select E and T as defaults
      if (autoSelected.size === 0) {
        autoSelected.add('E');
        autoSelected.add('T');
      }
      setSelectedSymbols(autoSelected);
      setLoading(false);
    }
    loadProgress();
  }, []);

  const pickRandom = useCallback(() => {
    const symbols = Array.from(selectedSymbols);
    if (symbols.length === 0) return;
    const next = symbols[Math.floor(Math.random() * symbols.length)];
    setCurrentSymbol(next);
    setFeedback(null);

    if (mode === 'listen') {
      playMorse(MORSE_MAP[next]);
    }
  }, [selectedSymbols, mode]);

  const minSymbols = mode === 'identify' ? 4 : 2;
  const startPractice = () => {
    if (selectedSymbols.size < minSymbols) return;
    setIsActive(true);
    setStats({ correct: 0, total: 0 });
    pickRandom();
  };

  const handleTapCheck = useCallback(() => {
      if (!currentSymbol) return;
      const correct = practicePattern === MORSE_MAP[currentSymbol];
      setFeedback(correct ? 'correct' : 'wrong');
      setStats((prev) => ({
        correct: prev.correct + (correct ? 1 : 0),
        total: prev.total + 1,
      }));
      setPracticePattern('');
      timerRef.current = setTimeout(() => pickRandom(), 1000);
    },
    [currentSymbol, practicePattern, pickRandom]
  );

  const handleIdentifyAnswer = useCallback(
    (symbol: string) => {
      if (!currentSymbol) return;
      const correct = symbol === currentSymbol;
      setFeedback(correct ? 'correct' : 'wrong');
      setStats((prev) => ({
        correct: prev.correct + (correct ? 1 : 0),
        total: prev.total + 1,
      }));
      timerRef.current = setTimeout(() => pickRandom(), 1000);
    },
    [currentSymbol, pickRandom]
  );

  // Cleanup timer on unmount or when leaving practice
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const toggleSymbol = (symbol: string) => {
    setSelectedSymbols((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 animate-pulse rounded bg-[var(--border)]" />
        <div className="h-40 animate-pulse rounded-xl bg-[var(--border)]" />
      </div>
    );
  }

  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const allNumbers = '0123456789'.split('');
  const allPunctuation = ['.', ',', '?', '!', '/', '(', ')', '&', ':', ';', '=', '+', '-', '_', '"', '$', '@'];

  if (!isActive) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Free Practice
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Select letters to drill. No lives, no XP — just practice.
        </p>

        {/* Mode selector */}
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Mode</p>
          <div className="flex gap-2">
            {[
              { value: 'tap' as PracticeMode, label: 'Tap' },
              { value: 'listen' as PracticeMode, label: 'Listen' },
              { value: 'identify' as PracticeMode, label: 'Identify' },
            ].map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  mode === m.value
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--surface)] text-[var(--text-muted)] ring-1 ring-[var(--border)]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category tabs */}
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Category</p>
          <div className="flex gap-2">
            {([
              { value: 'letters' as SymbolCategory, label: 'Letters' },
              { value: 'numbers' as SymbolCategory, label: 'Numbers' },
              { value: 'punctuation' as SymbolCategory, label: 'Punctuation' },
            ]).map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  category === c.value
                    ? 'text-[var(--primary)] ring-2 ring-[var(--primary)] bg-transparent'
                    : 'bg-[var(--surface)] text-[var(--text-muted)] ring-1 ring-[var(--border)]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Symbol selector */}
        <div className="rounded-xl bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]">
          {(() => {
            const symbols = category === 'letters' ? allLetters : category === 'numbers' ? allNumbers : allPunctuation;
            const allSelected = symbols.every((s) => selectedSymbols.has(s));
            return (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    {category === 'letters' ? 'Letters' : category === 'numbers' ? 'Numbers' : 'Punctuation'}
                  </h3>
                  <button
                    onClick={() => {
                      if (allSelected) {
                        setSelectedSymbols((prev) => {
                          const next = new Set(prev);
                          symbols.forEach((s) => next.delete(s));
                          return next;
                        });
                      } else {
                        setSelectedSymbols((prev) => {
                          const next = new Set(prev);
                          symbols.forEach((s) => next.add(s));
                          return next;
                        });
                      }
                    }}
                    className="text-xs font-medium text-[var(--primary)]"
                  >
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
                  {symbols.map((sym) => {
                    const progress = letterProgress.find((lp) => lp.symbol === sym);
                    const mastery = progress?.mastery_level || 0;
                    const selected = selectedSymbols.has(sym);
                    return (
                      <button
                        key={sym}
                        onClick={() => toggleSymbol(sym)}
                        className={`flex aspect-square items-center justify-center rounded-lg text-sm font-bold transition-all ${
                          selected
                            ? mastery >= 3
                              ? 'bg-green-100 text-green-700 ring-2 ring-green-400'
                              : mastery >= 2
                                ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400'
                                : 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {sym}
                      </button>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>

        <button
          onClick={startPractice}
          disabled={selectedSymbols.size < minSymbols}
          className="w-full rounded-xl bg-[var(--primary)] px-6 py-4 font-medium text-white transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50"
        >
          Start Practice ({(() => {
            const currentSymbols = category === 'letters' ? allLetters : category === 'numbers' ? allNumbers : allPunctuation;
            return currentSymbols.filter((s) => selectedSymbols.has(s)).length;
          })()} {category})
        </button>
      </div>
    );
  }

  // Active practice session
  const options = currentSymbol
    ? (() => {
        const syms = Array.from(selectedSymbols).filter((s) => s !== currentSymbol);
        const wrong = shuffle(syms).slice(0, 3);
        return shuffle([currentSymbol, ...wrong]);
      })()
    : [];

  return (
    <div className="flex min-h-[70vh] flex-col">
      {/* Stats bar */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setIsActive(false)}
          className="text-sm font-medium text-[var(--text-muted)]"
        >
          ← End Practice
        </button>
        <div className="text-sm text-[var(--text-muted)]">
          {stats.correct}/{stats.total} correct
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        {currentSymbol && (
          <>
            {/* Show letter for tap mode */}
            {mode === 'tap' && (
              <div className="mb-8 text-center">
                <div className="text-5xl font-bold text-[var(--text-primary)] sm:text-6xl">
                  {currentSymbol}
                </div>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Tap the morse code for this letter
                </p>
              </div>
            )}

            {/* Show pattern for listen mode */}
            {mode === 'listen' && (
              <div className="mb-8 text-center">
                <button
                  onClick={() => playMorse(MORSE_MAP[currentSymbol])}
                  className="mb-4 rounded-full bg-[var(--primary)] p-6 text-white transition-transform active:scale-95"
                >
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <p className="text-sm text-[var(--text-muted)]">
                  Listen and tap the pattern
                </p>
              </div>
            )}

            {/* Identify mode: show pattern, pick the letter */}
            {mode === 'identify' && (
              <div className="mb-8 text-center">
                <MorseDisplay pattern={MORSE_MAP[currentSymbol]} size="lg" />
                <p className="mt-4 text-lg font-mono text-[var(--text-muted)]">
                  {MORSE_MAP[currentSymbol]}
                </p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Which letter is this?
                </p>
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div
                className={`mb-4 rounded-lg px-6 py-2 text-sm font-medium ${
                  feedback === 'correct'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {feedback === 'correct' ? 'Correct!' : `Wrong — it was ${MORSE_MAP[currentSymbol]}`}
              </div>
            )}

            {/* Input area */}
            {(mode === 'tap' || mode === 'listen') && !feedback && (
              <div className="w-full max-w-sm flex flex-col items-center gap-4">
                <MorseInput onChange={setPracticePattern} />
                <button
                  type="button"
                  onClick={handleTapCheck}
                  disabled={!practicePattern}
                  className="w-full max-w-xs h-12 rounded-xl font-semibold text-white transition-colors cursor-pointer disabled:opacity-40"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  Check
                </button>
              </div>
            )}

            {mode === 'identify' && (
              <div className="grid w-full max-w-sm grid-cols-2 gap-3">
                {options.map((symbol) => (
                  <button
                    key={symbol}
                    onClick={() => handleIdentifyAnswer(symbol)}
                    disabled={!!feedback}
                    className="rounded-xl bg-[var(--surface)] px-6 py-4 text-2xl font-bold text-[var(--text-primary)] ring-1 ring-[var(--border)] transition-all hover:ring-[var(--primary)] active:scale-95 disabled:opacity-50"
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
