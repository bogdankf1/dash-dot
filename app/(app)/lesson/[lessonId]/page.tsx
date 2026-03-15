'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { generateLesson, generateWordLesson, generateDailyReviewLesson, calculateXP, updateMastery } from '@/lib/morse/engine';
import type { Exercise } from '@/lib/morse/engine';
import { getChapters, getLessonsForChapter, getDailyReviewLessons } from '@/lib/morse/chapters';
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
  const [streakInfo, setStreakInfo] = useState<{ continued: boolean; newStreak: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [skipAudio, setSkipAudio] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [mnemonicGuide, setMnemonicGuide] = useState<MnemonicGuideType>('dashdot');
  const [showAudioTip, setShowAudioTip] = useState(false);
  const [lessonMeta, setLessonMeta] = useState<{
    chapterId: string;
    newSymbols: string[];
    isWordLesson?: boolean;
    hasMoreLessons: boolean;
  } | null>(null);

  // Track per-symbol results
  const [symbolResults, setSymbolResults] = useState<Map<string, SymbolResult>>(
    new Map()
  );

  const loadLesson = useCallback(async () => {
    setError(false);
    setLoading(true);
    try {
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

      const [{ data: progressData }, { data: historyData }] = await Promise.all([
        supabase.from('letter_progress').select('*').eq('user_id', user.id),
        supabase.from('lesson_history').select('lesson_id').eq('user_id', user.id),
      ]);

      const letterProgress: LetterProgress[] = progressData || [];
      const completedLessonIds = new Set((historyData || []).map((h: { lesson_id: string }) => h.lesson_id));

      // Find the lesson config
      let foundLesson = null;
      let chapterLessons: { id: string }[] = [];
      const isDailyReview = lessonId.startsWith('daily-review-');

      if (isDailyReview) {
        // Extract date from lesson ID: daily-review-YYYY-MM-DD-L1
        const dateMatch = lessonId.match(/^daily-review-(\d{4}-\d{2}-\d{2})-L\d+$/);
        if (dateMatch) {
          const dailyLessons = getDailyReviewLessons(dateMatch[1]);
          const match = dailyLessons.find((l) => l.id === lessonId);
          if (match) {
            foundLesson = match;
            chapterLessons = dailyLessons;
          }
        }
      } else {
        for (const chapter of chapters) {
          const previousSymbols = chapters
            .filter((c) => c.index < chapter.index)
            .flatMap((c) => c.symbols);
          const lessons = getLessonsForChapter(chapter, previousSymbols);
          const match = lessons.find((l) => l.id === lessonId);
          if (match) {
            foundLesson = match;
            chapterLessons = lessons;
            break;
          }
        }
      }

      if (!foundLesson) {
        router.push('/dashboard');
        return;
      }

      // Check if there are remaining incomplete lessons in this chapter (excluding current)
      const hasMoreLessons = chapterLessons.some(
        (l) => l.id !== lessonId && !completedLessonIds.has(l.id)
      );

      setLessonMeta({
        chapterId: foundLesson.chapterId,
        newSymbols: foundLesson.newSymbols,
        isWordLesson: foundLesson.isWordLesson,
        hasMoreLessons,
      });

      const generatedExercises = isDailyReview
        ? generateDailyReviewLesson(
            foundLesson.newSymbols,
            foundLesson.reviewSymbols,
            letterProgress
          )
        : foundLesson.isWordLesson
          ? generateWordLesson(foundLesson.learnedLetters || [], letterProgress)
          : generateLesson(
              foundLesson.newSymbols,
              foundLesson.reviewSymbols,
              letterProgress
            );

      setExercises(generatedExercises);

      // Load mnemonic guide preference and audio tip state
      try {
        const localSettings = localStorage.getItem('dashdot-settings');
        if (localSettings) {
          const parsed = JSON.parse(localSettings);
          if (parsed.mnemonicGuide === 'hello-morse') {
            setMnemonicGuide('hello-morse');
          }
          if (parsed.audioEnabled !== false && !parsed.audioTipDismissed) {
            setShowAudioTip(true);
          }
        } else {
          // No settings yet — show tip on first lesson
          setShowAudioTip(true);
        }
      } catch {}

      setLoading(false);
    } catch (err) {
      console.error('Failed to load lesson:', err);
      setError(true);
      toast.error('Failed to load lesson');
      setLoading(false);
    }
  }, [lessonId, router]);

  useEffect(() => {
    loadLesson();
  }, [loadLesson]);

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
        .select('streak, last_activity_date')
        .eq('id', user.id)
        .single();

      const streak = profile?.streak || 0;
      const lastActivity = profile?.last_activity_date;
      const accuracy = totalAnswered > 0 ? correctCount / totalAnswered : 0;
      const xp = calculateXP(correctCount, totalAnswered, streak);
      if (!cancelled) setXpEarned(xp);

      // Check if streak will be continued (new day, last activity was yesterday)
      const today = new Date();
      const localDateStr = today.toLocaleDateString('sv-SE');
      if (!cancelled && lastActivity && lastActivity !== localDateStr) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('sv-SE');
        if (lastActivity === yesterdayStr) {
          setStreakInfo({ continued: true, newStreak: streak + 1 });
        }
      }

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
            timezoneOffset: new Date().getTimezoneOffset(),
          }),
        });
      } catch (err) {
        console.error('Failed to save lesson progress:', err);
        toast.error('Failed to save lesson progress');
      }
    }

    saveResults();
    return () => { cancelled = true; };
  }, [isComplete, lessonMeta, correctCount, totalAnswered, lessonId, symbolResults]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[var(--border)] border-t-[var(--primary)]" />
          <span className="text-sm text-[var(--text-muted)]">Preparing lesson</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--background)] px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-6xl">:(</div>
          <h2 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">
            Something Went Wrong
          </h2>
          <p className="mb-8 text-[var(--text-muted)]">
            Failed to load this lesson. Please try again.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 cursor-pointer rounded-xl bg-[var(--surface)] px-6 py-3 font-medium text-[var(--text-primary)] ring-1 ring-[var(--border)] transition-colors active:scale-95"
            >
              Back
            </button>
            <button
              onClick={loadLesson}
              className="flex-1 cursor-pointer rounded-xl bg-[var(--primary)] px-6 py-3 font-medium text-white transition-colors active:scale-95"
            >
              Try Again
            </button>
          </div>
        </div>
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
              className="flex-1 cursor-pointer rounded-xl bg-[var(--surface)] px-6 py-3 font-medium text-[var(--text-primary)] ring-1 ring-[var(--border)] transition-colors active:scale-95"
            >
              Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 cursor-pointer rounded-xl bg-[var(--primary)] px-6 py-3 font-medium text-white transition-colors active:scale-95"
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
            {lessonId.startsWith('daily-review-') ? 'Review Complete!' : 'Lesson Complete!'}
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

          {streakInfo?.continued && (
            <div className="mb-6 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
              <div className="text-3xl mb-1">🔥</div>
              <p className="text-sm font-bold text-amber-700">
                {streakInfo.newStreak}-day streak!
              </p>
              <p className="text-xs text-amber-600">
                Keep it up — come back tomorrow!
              </p>
            </div>
          )}

          {lessonMeta && (
            <div className="mb-6 text-sm text-[var(--text-muted)]">
              {lessonMeta.isWordLesson ? 'Words practiced' : 'Letters practiced'}:{' '}
              <span className="font-medium text-[var(--text-primary)]">
                {lessonMeta.isWordLesson
                  ? Array.from(symbolResults.keys()).join(', ')
                  : lessonId.startsWith('daily-review-')
                    ? Array.from(symbolResults.keys()).join(', ')
                    : lessonMeta.newSymbols.join(', ')}
              </span>
            </div>
          )}

          <button
            onClick={() => router.push(
              lessonMeta?.hasMoreLessons ? `/learn/${lessonMeta.chapterId}` : '/dashboard'
            )}
            className="w-full cursor-pointer rounded-xl bg-[var(--primary)] px-6 py-4 font-medium text-white transition-colors hover:bg-[var(--primary-hover)] active:scale-95"
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
            onClick={() => setShowExitModal(true)}
            className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)] active:scale-90"
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
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] ring-1 ring-[var(--border)] transition-colors active:scale-95"
            >
              Can&apos;t listen now? Skip audio
            </button>
          </div>
        )}
        {showAudioTip && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-200">
            <p className="text-xs text-amber-700">
              🔊 For the best experience, make sure your phone isn&apos;t on silent
            </p>
            <button
              type="button"
              onClick={() => {
                setShowAudioTip(false);
                try {
                  const raw = localStorage.getItem('dashdot-settings');
                  const settings = raw ? JSON.parse(raw) : {};
                  settings.audioTipDismissed = true;
                  localStorage.setItem('dashdot-settings', JSON.stringify(settings));
                } catch {}
              }}
              className="flex-shrink-0 cursor-pointer text-amber-400 hover:text-amber-600"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--background)] p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)]">Quit Lesson?</h3>
            <p className="mb-6 text-sm text-[var(--text-muted)]">
              Your progress in this lesson won&apos;t be saved and no XP will be earned.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="flex-1 cursor-pointer rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white transition-colors active:scale-95"
              >
                Keep Going
              </button>
              <button
                type="button"
                onClick={() => router.push(lessonMeta?.chapterId ? `/learn/${lessonMeta.chapterId}` : '/dashboard')}
                className="flex-1 cursor-pointer rounded-xl bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--error)] ring-1 ring-[var(--border)] transition-colors active:scale-95"
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
