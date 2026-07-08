'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { generatePracticeSession, calculatePracticeXP } from '@/lib/morse/engine';
import type { Exercise } from '@/lib/morse/engine';
import { getProgress } from '@/lib/storage/dataLayer';
import { useExerciseRunner, persistExerciseResults } from '@/lib/hooks/useExerciseRunner';
import type { LetterProgress } from '@/types';
import ExerciseCard from '@/components/lesson/ExerciseCard';
import ProgressBar from '@/components/lesson/ProgressBar';
import GameOverScreen from '@/components/lesson/GameOverScreen';
import CompletionScreen from '@/components/lesson/CompletionScreen';
import type { MnemonicGuideType } from '@/lib/morse/mnemonics';

type SymbolCategory = 'letters' | 'numbers' | 'punctuation';

export default function PracticePage() {
  const router = useRouter();
  const [letterProgress, setLetterProgress] = useState<LetterProgress[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<Set<string>>(new Set());
  const [isActive, setIsActive] = useState(false);
  const [category, setCategory] = useState<SymbolCategory>('letters');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mnemonicGuide, setMnemonicGuide] = useState<MnemonicGuideType>('dashdot');

  // Lesson-like session state, shared with the lesson page. Practice records
  // each exercise's single symbol and seeds mastery from the current progress.
  const getSymbols = useCallback((exercise: Exercise) => [exercise.symbol], []);
  const getSeedMastery = useCallback(
    (sym: string) => letterProgress.find((lp) => lp.symbol === sym)?.mastery_level ?? 0,
    [letterProgress]
  );

  const {
    exercises,
    currentIndex,
    lives,
    correctCount,
    totalAnswered,
    isComplete,
    isGameOver,
    xpEarned,
    streakInfo,
    showExitModal,
    symbolResults,
    handleAnswer,
    reset,
    setShowExitModal,
    setIsGameOver,
    setXpEarned,
    setStreakInfo,
  } = useExerciseRunner({ getSymbols, getSeedMastery });

  const loadProgress = async () => {
    setError(false);
    setLoading(true);
    try {
      const data = await getProgress();
      setLetterProgress(data.letterProgress);

      // Auto-select letters that are learning or mastered
      const autoSelected = new Set<string>();
      for (const lp of data.letterProgress) {
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

  const startPractice = () => {
    const currentCategorySymbols = category === 'letters'
      ? allLetters
      : category === 'numbers'
        ? allNumbers
        : allPunctuation;
    const symbols = currentCategorySymbols.filter((s) => selectedSymbols.has(s));
    if (symbols.length < 2) return;

    const generatedExercises = generatePracticeSession(symbols, letterProgress);
    reset(generatedExercises);
    setIsActive(true);

    // Load mnemonic guide preference
    try {
      const localSettings = localStorage.getItem('dashdot-settings');
      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        if (parsed.mnemonicGuide === 'hello-morse') {
          setMnemonicGuide('hello-morse');
        }
      }
    } catch {}
  };

  // Save results when practice completes
  useEffect(() => {
    if (!isComplete) return;

    let cancelled = false;
    persistExerciseResults({
      correctCount,
      totalAnswered,
      computeXP: calculatePracticeXP,
      buildPayload: ({ xp, accuracy }) => ({
        chapterId: 'practice',
        lessonId: `practice-${Date.now()}`,
        xpEarned: xp,
        accuracy,
        symbolResults: Array.from(symbolResults.values()),
        timezoneOffset: new Date().getTimezoneOffset(),
      }),
      onError: (err) => {
        console.error('Failed to save practice progress:', err);
        toast.error('Failed to save practice progress');
      },
      setXpEarned,
      setStreakInfo,
      isCancelled: () => cancelled,
    });
    return () => { cancelled = true; };
  }, [isComplete, correctCount, totalAnswered, symbolResults]);

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
  const learnedSymbols = new Set(letterProgress.filter((lp) => lp.mastery_level >= 1).map((lp) => lp.symbol));
  const allPunctuation = ['.', ',', '?', '!', '/', '(', ')', '&', ':', ';', '=', '+', '-', '_', '"', '$', '@'].filter((s) => learnedSymbols.has(s));

  if (!isActive) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-(--text-primary)">
          Practice
        </h1>
        <p className="text-sm text-(--text-muted)">
          Select symbols to drill. Earn XP and keep your streak going!
        </p>

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
          disabled={selectedSymbols.size < 2}
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

  // Game over screen
  if (isGameOver) {
    return (
      <GameOverScreen
        zClassName="z-[60]"
        onBack={() => {
          setIsActive(false);
          setIsGameOver(false);
        }}
        onRetry={() => startPractice()}
      />
    );
  }

  // Completion screen
  if (isComplete) {
    const practicedSymbols = Array.from(symbolResults.keys());
    return (
      <CompletionScreen
        zClassName="z-[60]"
        title="Practice Complete!"
        xpEarned={xpEarned}
        correctCount={correctCount}
        totalAnswered={totalAnswered}
        streakInfo={streakInfo}
        onContinue={() => router.push('/dashboard')}
      >
        {practicedSymbols.length > 0 && (
          <div className="mb-6 text-sm text-(--text-muted)">
            Symbols practiced:{' '}
            <span className="font-medium text-(--text-primary)">
              {practicedSymbols.join(', ')}
            </span>
          </div>
        )}
      </CompletionScreen>
    );
  }

  // Active practice session — same layout as lessons
  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-(--background)">
      <div className="flex-shrink-0 px-4 pt-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg text-(--text-muted) transition-colors hover:bg-(--surface) hover:text-(--text-primary) active:scale-90"
            title="Exit practice"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="flex-1">
            <ProgressBar
              current={currentIndex}
              total={exercises.length}
              lives={lives}
            />
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
        {exercises[currentIndex] && (
          <ExerciseCard
            key={currentIndex}
            exercise={exercises[currentIndex]}
            exerciseNumber={currentIndex + 1}
            totalExercises={exercises.length}
            onAnswer={handleAnswer}
            mnemonicGuide={mnemonicGuide}
          />
        )}
      </div>

      {showExitModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-(--background) p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-(--text-primary)">Quit Practice?</h3>
            <p className="mb-6 text-sm text-(--text-muted)">
              Your progress in this session won&apos;t be saved and no XP will be earned.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="flex-1 cursor-pointer rounded-xl bg-(--primary) px-4 py-3 text-sm font-medium text-white transition-colors active:scale-95"
              >
                Keep Going
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsActive(false);
                  setShowExitModal(false);
                }}
                className="flex-1 cursor-pointer rounded-xl bg-(--surface) px-4 py-3 text-sm font-medium text-(--error) ring-1 ring-(--border) transition-colors active:scale-95"
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
