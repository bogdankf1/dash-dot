'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { generateLesson, generateWordLesson, calculateXP, updateMastery } from '@/lib/morse/engine';
import type { Exercise } from '@/lib/morse/engine';
import { getChapters, getLessonsForChapter } from '@/lib/morse/chapters';
import type { LetterProgress, GuideType } from '@/types';
import ExerciseCard from '@/components/lesson/ExerciseCard';
import ProgressBar from '@/components/lesson/ProgressBar';
import type { MnemonicGuideType } from '@/lib/morse/mnemonics';

interface SymbolResult {
  symbol: string;
  correct: number;
  attempts: number;
  masteryLevel: number;
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [skipAudio, setSkipAudio] = useState(false);
  const [mnemonicGuide, setMnemonicGuide] = useState<MnemonicGuideType>('dashdot');
  const [lessonMeta, setLessonMeta] = useState<{
    chapterId: string;
    newSymbols: string[];
    isWordLesson?: boolean;
  } | null>(null);

  // Track per-symbol results
  const [symbolResults, setSymbolResults] = useState<Map<string, SymbolResult>>(
    new Map()
  );

  useEffect(() => {
    async function loadLesson() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_guide')
        .eq('id', user.id)
        .single();

      const guide = (profile?.selected_guide || 'google') as GuideType;
      const chapters = getChapters(guide);

      const { data: progressData } = await supabase
        .from('letter_progress')
        .select('*')
        .eq('user_id', user.id);

      const letterProgress: LetterProgress[] = progressData || [];

      // Find the lesson config
      let foundLesson = null;
      for (const chapter of chapters) {
        const previousSymbols = chapters
          .filter((c) => c.index < chapter.index)
          .flatMap((c) => c.symbols);
        const lessons = getLessonsForChapter(chapter, previousSymbols);
        const match = lessons.find((l) => l.id === lessonId);
        if (match) {
          foundLesson = match;
          break;
        }
      }

      if (!foundLesson) {
        router.push('/dashboard');
        return;
      }

      setLessonMeta({
        chapterId: foundLesson.chapterId,
        newSymbols: foundLesson.newSymbols,
        isWordLesson: foundLesson.isWordLesson,
      });

      const generatedExercises = foundLesson.isWordLesson
        ? generateWordLesson(foundLesson.learnedLetters || [], letterProgress)
        : generateLesson(
            foundLesson.newSymbols,
            foundLesson.reviewSymbols,
            letterProgress
          );

      setExercises(generatedExercises);

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

      setLoading(false);
    }

    loadLesson();
  }, [lessonId, router]);

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

      // Track symbol result — for word exercises, fan out to each letter
      setSymbolResults((prev) => {
        const updated = new Map(prev);
        const symbols = exercise.word
          ? Array.from(new Set(exercise.word.toUpperCase().split('')))
          : [exercise.symbol];

        for (const sym of symbols) {
          const existing = updated.get(sym) || {
            symbol: sym,
            correct: 0,
            attempts: 0,
            masteryLevel: 1,
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
    [currentIndex, exercises]
  );

  // Auto-skip audio exercises when skipAudio is enabled
  useEffect(() => {
    if (!skipAudio || exercises.length === 0 || isComplete || isGameOver) return;
    const exercise = exercises[currentIndex];
    if (exercise && (exercise.type === 'word-listen' || exercise.type === 'identify')) {
      handleAnswer(true);
    }
  }, [skipAudio, currentIndex, exercises, isComplete, isGameOver, handleAnswer]);

  // Save results when lesson completes
  useEffect(() => {
    if (!isComplete || !lessonMeta) return;

    const meta = lessonMeta;
    let cancelled = false;
    async function saveResults() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('streak')
        .eq('id', user.id)
        .single();

      const streak = profile?.streak || 0;
      const accuracy = totalAnswered > 0 ? correctCount / totalAnswered : 0;
      const xp = calculateXP(correctCount, totalAnswered, streak);
      if (!cancelled) setXpEarned(xp);

      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chapterId: meta.chapterId,
            lessonId,
            xpEarned: xp,
            accuracy,
            symbolResults: Array.from(symbolResults.values()),
          }),
        });
      } catch (err) {
        console.error('Failed to save lesson progress:', err);
      }
    }

    saveResults();
    return () => { cancelled = true; };
  }, [isComplete, lessonMeta, correctCount, totalAnswered, lessonId, symbolResults]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading lesson...</div>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--background)] px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-6xl">💔</div>
          <h2 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">
            Out of Lives
          </h2>
          <p className="mb-8 text-[var(--text-muted)]">
            Don&apos;t worry, practice makes perfect!
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 rounded-xl bg-[var(--surface)] px-6 py-3 font-medium text-[var(--text-primary)] ring-1 ring-[var(--border)]"
            >
              Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 rounded-xl bg-[var(--primary)] px-6 py-3 font-medium text-white"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const accuracy = totalAnswered > 0 ? correctCount / totalAnswered : 0;
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--background)] px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-6xl">🎉</div>
          <h2 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">
            Lesson Complete!
          </h2>

          <div className="mb-8 mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]">
              <div className="text-2xl font-bold text-[var(--primary)]">
                +{xpEarned}
              </div>
              <div className="text-xs text-[var(--text-muted)]">XP</div>
            </div>
            <div className="rounded-xl bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]">
              <div className="text-2xl font-bold text-[var(--success)]">
                {Math.round(accuracy * 100)}%
              </div>
              <div className="text-xs text-[var(--text-muted)]">Accuracy</div>
            </div>
            <div className="rounded-xl bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]">
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {correctCount}/{totalAnswered}
              </div>
              <div className="text-xs text-[var(--text-muted)]">Correct</div>
            </div>
          </div>

          {lessonMeta && (
            <div className="mb-6 text-sm text-[var(--text-muted)]">
              {lessonMeta.isWordLesson ? 'Words practiced' : 'Letters practiced'}:{' '}
              <span className="font-medium text-[var(--text-primary)]">
                {lessonMeta.isWordLesson
                  ? Array.from(symbolResults.keys()).join(', ')
                  : lessonMeta.newSymbols.join(', ')}
              </span>
            </div>
          )}

          <button
            onClick={() => router.push(lessonMeta?.chapterId ? `/learn/${lessonMeta.chapterId}` : '/dashboard')}
            className="w-full rounded-xl bg-[var(--primary)] px-6 py-4 font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[var(--background)]">
      <div className="flex-shrink-0 px-4 pt-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(lessonMeta?.chapterId ? `/learn/${lessonMeta.chapterId}` : '/dashboard')}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
            title="Exit lesson"
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
        {!skipAudio && (
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={() => setSkipAudio(true)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] ring-1 ring-[var(--border)] transition-colors"
            >
              Can&apos;t listen now? Skip audio
            </button>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-4">
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
    </div>
  );
}
