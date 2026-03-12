'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
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
  const [error, setError] = useState(false);
  const [practicePattern, setPracticePattern] = useState('');
  const [lastTappedPattern, setLastTappedPattern] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProgress = async () => {
    setError(false);
    setLoading(true);
    try {
      const res = await fetch('/api/progress');
      if (!res.ok) throw new Error('Failed to load');
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
    } catch (err) {
      console.error('Failed to load practice data:', err);
      setError(true);
      toast.error('Failed to load practice data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const pickRandom = useCallback(() => {
    const symbols = Array.from(selectedSymbols);
    if (symbols.length === 0) return;
    const next = symbols[Math.floor(Math.random() * symbols.length)];
    setCurrentSymbol(next);
    setFeedback(null);
    setSelectedOption(null);
    setLastTappedPattern('');

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
      setLastTappedPattern(practicePattern);
      setStats((prev) => ({
        correct: prev.correct + (correct ? 1 : 0),
        total: prev.total + 1,
      }));
      setPracticePattern('');
    },
    [currentSymbol, practicePattern]
  );

  const handleIdentifyAnswer = useCallback(
    (symbol: string) => {
      if (!currentSymbol) return;
      setSelectedOption(symbol);
      const correct = symbol === currentSymbol;
      setFeedback(correct ? 'correct' : 'wrong');
      setStats((prev) => ({
        correct: prev.correct + (correct ? 1 : 0),
        total: prev.total + 1,
      }));
    },
    [currentSymbol]
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
        <div className="h-8 animate-pulse rounded bg-(--border)" />
        <div className="h-40 animate-pulse rounded-xl bg-(--border)" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="mb-4 text-(--text-muted)">Something went wrong loading practice data.</p>
        <button
          type="button"
          onClick={loadProgress}
          className="cursor-pointer rounded-xl bg-(--primary) px-6 py-3 font-medium text-white transition-colors hover:bg-(--primary-hover) active:scale-95"
        >
          Try Again
        </button>
      </div>
    );
  }

  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const allNumbers = '0123456789'.split('');
  const allPunctuation = ['.', ',', '?', '!', '/', '(', ')', '&', ':', ';', '=', '+', '-', '_', '"', '$', '@'];

  if (!isActive) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-(--text-primary)">
          Free Practice
        </h1>
        <p className="text-sm text-(--text-muted)">
          Select letters to drill. No lives, no XP — just practice.
        </p>

        {/* Mode selector */}
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-(--text-muted)">Mode</p>
          <div className="flex gap-2">
            {[
              { value: 'tap' as PracticeMode, label: 'Tap' },
              { value: 'listen' as PracticeMode, label: 'Listen' },
              { value: 'identify' as PracticeMode, label: 'Identify' },
            ].map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`flex-1 cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors active:scale-95 ${
                  mode === m.value
                    ? 'bg-(--primary) text-white'
                    : 'bg-(--surface) text-(--text-muted) ring-1 ring-(--border)'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category tabs */}
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-(--text-muted)">Category</p>
          <div className="flex gap-2">
            {([
              { value: 'letters' as SymbolCategory, label: 'Letters' },
              { value: 'numbers' as SymbolCategory, label: 'Numbers' },
              { value: 'punctuation' as SymbolCategory, label: 'Punctuation' },
            ]).map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`flex-1 cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors active:scale-95 ${
                  category === c.value
                    ? 'text-(--primary) ring-2 ring-(--primary) bg-transparent'
                    : 'bg-(--surface) text-(--text-muted) ring-1 ring-(--border)'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Symbol selector */}
        <div className="rounded-xl bg-(--surface) p-4 ring-1 ring-(--border)">
          {(() => {
            const symbols = category === 'letters' ? allLetters : category === 'numbers' ? allNumbers : allPunctuation;
            const allSelected = symbols.every((s) => selectedSymbols.has(s));
            return (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-(--text-primary)">
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
                    className="cursor-pointer text-xs font-medium text-(--primary) transition-colors active:scale-95"
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
                        className={`flex aspect-square cursor-pointer items-center justify-center rounded-lg text-sm font-bold transition-all active:scale-90 ${
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
          className="w-full cursor-pointer rounded-xl bg-(--primary) px-6 py-4 font-medium text-white transition-colors hover:bg-(--primary-hover) active:scale-95 disabled:opacity-50"
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
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-(--background)">
      {/* Top bar — matches lesson layout */}
      <div className="shrink-0 px-4 pt-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsActive(false)}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-(--text-muted) transition-colors hover:bg-(--surface) hover:text-(--text-primary) active:scale-90"
            title="End practice"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: stats.total > 0 ? `${(stats.correct / stats.total) * 100}%` : '0%',
                backgroundColor: 'var(--primary)',
              }}
            />
          </div>
          <div className="shrink-0 text-sm font-medium text-(--text-muted)">
            {stats.correct}/{stats.total}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-4">
        {currentSymbol && (
          <div className="w-full max-w-lg mx-auto rounded-2xl p-6" style={{ backgroundColor: 'var(--surface)' }}>
            {/* Feedback — fixed height to prevent layout jump */}
            <div className="mb-4 text-center h-7">
              {feedback && (
                <p className="text-lg font-bold" style={{ color: feedback === 'correct' ? 'var(--success)' : 'var(--error)' }}>
                  {feedback === 'correct' ? 'Correct!' : 'Incorrect'}
                </p>
              )}
            </div>

            {/* Tap mode */}
            {mode === 'tap' && (
              <div className="flex flex-col items-center gap-6">
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  Tap the Morse code for:
                </p>
                <div className="text-4xl font-bold sm:text-5xl" style={{ color: 'var(--text-primary)' }}>
                  {currentSymbol}
                </div>
                <MorseInput
                  onChange={setPracticePattern}
                  disabled={!!feedback}
                  feedback={feedback === 'correct' ? 'correct' : feedback === 'wrong' ? 'incorrect' : null}
                  frozenPattern={lastTappedPattern}
                  correctPattern={feedback === 'wrong' && currentSymbol ? MORSE_MAP[currentSymbol] : undefined}
                />
              </div>
            )}

            {/* Listen mode */}
            {mode === 'listen' && (
              <div className="flex flex-col items-center gap-6">
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  Listen and tap the pattern:
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => playMorse(MORSE_MAP[currentSymbol])}
                    className="flex h-12 w-12 items-center justify-center rounded-full transition-colors cursor-pointer active:scale-95"
                    style={{ backgroundColor: 'var(--primary)', color: '#FFFFFF' }}
                    title="Play"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.49 4.49 0 002.5-3.5zM14 3.23v2.06a6.51 6.51 0 010 13.42v2.06A8.51 8.51 0 0014 3.23z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => playMorse(MORSE_MAP[currentSymbol], 0.5)}
                    className="flex h-12 items-center gap-1 px-3 rounded-full transition-colors cursor-pointer active:scale-95"
                    style={{ backgroundColor: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--text-muted)' }}
                    title="Play slow"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 9v6h4l5 5V4L7 9H3z" />
                    </svg>
                    <span className="text-xs font-bold">&frac12;</span>
                  </button>
                </div>
                <MorseInput
                  onChange={setPracticePattern}
                  disabled={!!feedback}
                  feedback={feedback === 'correct' ? 'correct' : feedback === 'wrong' ? 'incorrect' : null}
                  frozenPattern={lastTappedPattern}
                  correctPattern={feedback === 'wrong' && currentSymbol ? MORSE_MAP[currentSymbol] : undefined}
                />
              </div>
            )}

            {/* Identify mode */}
            {mode === 'identify' && (
              <div className="flex flex-col items-center gap-6">
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  Listen and identify the letter:
                </p>
                <MorseDisplay pattern={MORSE_MAP[currentSymbol]} size="lg" />
                <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                  {options.map((symbol) => {
                    const isCorrectOption = symbol === currentSymbol;
                    const isSelected = symbol === selectedOption;
                    const answered = feedback !== null;

                    let optionBg = 'var(--surface)';
                    let optionBorder = 'var(--border)';
                    let optionColor = 'var(--text-primary)';

                    if (answered) {
                      if (isCorrectOption) {
                        optionBg = '#dcfce7';
                        optionBorder = '#4ade80';
                        optionColor = '#166534';
                      } else if (isSelected) {
                        optionBg = '#fee2e2';
                        optionBorder = '#f87171';
                        optionColor = '#991b1b';
                      }
                    }

                    return (
                      <button
                        key={symbol}
                        type="button"
                        onClick={() => handleIdentifyAnswer(symbol)}
                        disabled={!!feedback}
                        className="h-20 sm:h-16 rounded-xl text-2xl font-bold transition-colors cursor-pointer disabled:opacity-100"
                        style={{
                          backgroundColor: optionBg,
                          border: `2px solid ${optionBorder}`,
                          color: optionColor,
                        }}
                        onMouseEnter={(e) => {
                          if (!feedback) {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.color = 'var(--primary)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!feedback) {
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                          }
                        }}
                      >
                        {symbol}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom button bar — matches lesson layout */}
      <div
        className="shrink-0 border-t border-(--border) bg-(--background) px-4 py-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {mode === 'identify' ? (
          feedback && (
            <button
              type="button"
              onClick={pickRandom}
              className="w-full h-14 rounded-xl font-semibold text-white text-lg transition-colors cursor-pointer active:scale-95"
              style={{ backgroundColor: feedback === 'correct' ? 'var(--success)' : 'var(--primary)' }}
            >
              {feedback === 'correct' ? 'Continue' : 'Got It'}
            </button>
          )
        ) : !feedback ? (
          <button
            type="button"
            onClick={handleTapCheck}
            disabled={!practicePattern}
            className="w-full h-14 rounded-xl font-semibold text-white text-lg transition-colors cursor-pointer disabled:opacity-40 active:scale-95"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Check
          </button>
        ) : (
          <button
            type="button"
            onClick={pickRandom}
            className="w-full h-14 rounded-xl font-semibold text-white text-lg transition-colors cursor-pointer active:scale-95"
            style={{ backgroundColor: feedback === 'correct' ? 'var(--success)' : 'var(--primary)' }}
          >
            {feedback === 'correct' ? 'Continue' : 'Got It'}
          </button>
        )}
      </div>
    </div>
  );
}
