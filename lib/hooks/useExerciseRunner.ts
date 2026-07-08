'use client';

import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { updateMastery } from '@/lib/morse/engine';
import type { Exercise } from '@/lib/morse/engine';
import { getUserAndProfile, saveLessonProgress } from '@/lib/storage/dataLayer';
import type { LessonResultInput } from '@/lib/storage/localProgress';

export interface SymbolResult {
  symbol: string;
  correct: number;
  attempts: number;
  masteryLevel: number;
}

type StreakInfo = { continued: boolean; newStreak: number };

export interface ExerciseRunnerConfig {
  // Which symbols an exercise contributes to. Lesson fans a word exercise out
  // to each unique letter; practice records the single symbol.
  getSymbols: (exercise: Exercise) => string[];
  // Seed mastery for a symbol seen for the first time this session, so a
  // strong-existing-mastery symbol isn't demoted by updateMastery's "0 → 1"
  // promotion branch. Lesson seeds from an initialMastery snapshot; practice
  // seeds from the current letterProgress.
  getSeedMastery: (symbol: string) => number;
}

export interface ExerciseRunner {
  exercises: Exercise[];
  currentIndex: number;
  lives: number;
  correctCount: number;
  totalAnswered: number;
  isComplete: boolean;
  isGameOver: boolean;
  xpEarned: number;
  streakInfo: StreakInfo | null;
  showExitModal: boolean;
  symbolResults: Map<string, SymbolResult>;
  handleAnswer: (correct: boolean) => void;
  reset: (exercises: Exercise[]) => void;
  setExercises: Dispatch<SetStateAction<Exercise[]>>;
  setShowExitModal: Dispatch<SetStateAction<boolean>>;
  setIsGameOver: Dispatch<SetStateAction<boolean>>;
  setXpEarned: Dispatch<SetStateAction<number>>;
  setStreakInfo: Dispatch<SetStateAction<StreakInfo | null>>;
}

/**
 * Shared game-loop state machine for the lesson and practice pages. Owns the
 * common state (lives / counters / completion / game-over / streak / exit
 * modal / per-symbol results) and the answer transition. The genuine
 * divergences — how an exercise maps to symbols and how first-seen mastery is
 * seeded — are parameterized via `config`. Data loading, XP calculation, and
 * the completion-save effect stay at the call sites (see `persistExerciseResults`).
 */
export function useExerciseRunner({
  getSymbols,
  getSeedMastery,
}: ExerciseRunnerConfig): ExerciseRunner {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [symbolResults, setSymbolResults] = useState<Map<string, SymbolResult>>(
    new Map()
  );

  const handleAnswer = useCallback(
    (correct: boolean) => {
      const exercise = exercises[currentIndex];
      setTotalAnswered((prev) => prev + 1);

      if (correct) {
        setCorrectCount((prev) => prev + 1);
      } else {
        setLives((prev) => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setIsGameOver(true);
          }
          return newLives;
        });
      }

      // Track per-symbol results — the symbol mapping and mastery seed differ
      // per page, everything else is shared.
      setSymbolResults((prev) => {
        const updated = new Map(prev);
        for (const sym of getSymbols(exercise)) {
          const existing = updated.get(sym) || {
            symbol: sym,
            correct: 0,
            attempts: 0,
            masteryLevel: getSeedMastery(sym),
          };
          existing.attempts += 1;
          if (correct) existing.correct += 1;
          existing.masteryLevel = updateMastery(
            existing.masteryLevel as 0 | 1 | 2 | 3,
            existing.correct,
            existing.attempts
          );
          updated.set(sym, existing);
        }
        return updated;
      });

      // Move to next exercise
      if (currentIndex + 1 >= exercises.length) {
        setIsComplete(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [currentIndex, exercises, getSymbols, getSeedMastery]
  );

  // Start a fresh run from a new set of exercises (used when a session can be
  // (re)started in place, e.g. practice).
  const reset = useCallback((next: Exercise[]) => {
    setExercises(next);
    setCurrentIndex(0);
    setLives(3);
    setCorrectCount(0);
    setTotalAnswered(0);
    setIsComplete(false);
    setIsGameOver(false);
    setXpEarned(0);
    setStreakInfo(null);
    setSymbolResults(new Map());
  }, []);

  return {
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
    setExercises,
    setShowExitModal,
    setIsGameOver,
    setXpEarned,
    setStreakInfo,
  };
}

export interface PersistResultsConfig {
  correctCount: number;
  totalAnswered: number;
  computeXP: (correct: number, total: number, streak: number) => number;
  buildPayload: (args: { xp: number; accuracy: number }) => LessonResultInput;
  onError: (err: unknown) => void;
  setXpEarned: (xp: number) => void;
  setStreakInfo: (info: StreakInfo) => void;
  isCancelled: () => boolean;
}

/**
 * Shared completion-save body for the lesson and practice pages. The effect
 * wrapper (guard + dependency array) stays at each call site because the guards
 * and deps genuinely diverge (lesson gates on `lessonMeta`); this captures the
 * identical streak/XP/save logic in between. `computeXP` and `buildPayload`
 * parameterize the only per-page differences.
 */
export async function persistExerciseResults({
  correctCount,
  totalAnswered,
  computeXP,
  buildPayload,
  onError,
  setXpEarned,
  setStreakInfo,
  isCancelled,
}: PersistResultsConfig): Promise<void> {
  const { profile } = await getUserAndProfile(new Date().getTimezoneOffset());
  if (isCancelled()) return;

  const streak = profile?.streak || 0;
  const lastActivity = profile?.last_activity_date;
  const accuracy = totalAnswered > 0 ? correctCount / totalAnswered : 0;
  const xp = computeXP(correctCount, totalAnswered, streak);
  if (!isCancelled()) setXpEarned(xp);

  // Check if streak will be continued (new day, last activity was yesterday)
  const today = new Date();
  const localDateStr = today.toLocaleDateString('sv-SE');
  if (!isCancelled() && lastActivity && lastActivity !== localDateStr) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('sv-SE');
    if (lastActivity === yesterdayStr) {
      setStreakInfo({ continued: true, newStreak: streak + 1 });
    }
  }

  try {
    await saveLessonProgress(buildPayload({ xp, accuracy }));
  } catch (err) {
    onError(err);
  }
}
