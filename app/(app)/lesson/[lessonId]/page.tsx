'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { generateLesson, generateWordLesson, generateDailyReviewLesson, calculateXP, updateMastery } from '@/lib/morse/engine';
import type { Exercise } from '@/lib/morse/engine';
import { getChapters, getLessonsForChapter, getDailyReviewLessons } from '@/lib/morse/chapters';
import { getUserAndProfile, getProgress, saveLessonProgress } from '@/lib/storage/dataLayer';
import type { GuideType, LetterProgress } from '@/types';
import ExerciseCard from '@/components/lesson/ExerciseCard';
import ProgressBar from '@/components/lesson/ProgressBar';
import GameOverScreen from '@/components/lesson/GameOverScreen';
import CompletionScreen from '@/components/lesson/CompletionScreen';
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

  // Snapshot of each symbol's current DB mastery level. We seed per-symbol
  // result rows from this so a strong-existing-mastery symbol isn't demoted
  // back to 1 by updateMastery's "0 → 1" promotion branch.
  const [initialMastery, setInitialMastery] = useState<Map<string, number>>(new Map());

  // Track per-symbol results
  const [symbolResults, setSymbolResults] = useState<Map<string, SymbolResult>>(
    new Map()
  );

  const loadLesson = useCallback(async () => {
    setError(false);
    setLoading(true);
    try {
      const [userData, progressData] = await Promise.all([
        getUserAndProfile(new Date().getTimezoneOffset()),
        getProgress(),
      ]);

      const guide = (userData.profile?.selected_guide || 'google') as GuideType;
      const chapters = getChapters(guide);

      const letterProgress: LetterProgress[] = progressData.letterProgress;
      setInitialMastery(new Map(letterProgress.map((lp) => [lp.symbol, lp.mastery_level])));
      const completedLessonIds = new Set(progressData.lessonHistory.map((h) => h.lesson_id));

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
            masteryLevel: initialMastery.get(sym) ?? 0,
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
    [currentIndex, exercises, initialMastery]
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
      const { profile } = await getUserAndProfile(new Date().getTimezoneOffset());
      if (cancelled) return;

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
        await saveLessonProgress({
          chapterId: meta.chapterId,
          lessonId,
          xpEarned: xp,
          accuracy,
          symbolResults: Array.from(symbolResults.values()),
          timezoneOffset: new Date().getTimezoneOffset(),
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
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-(--border) border-t-(--primary)" />
          <span className="text-sm text-(--text-muted)">Preparing lesson</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-(--background) px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-6xl">:(</div>
          <h2 className="mb-2 text-2xl font-bold text-(--text-primary)">
            Something Went Wrong
          </h2>
          <p className="mb-8 text-(--text-muted)">
            Failed to load this lesson. Please try again.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 cursor-pointer rounded-xl bg-(--surface) px-6 py-3 font-medium text-(--text-primary) ring-1 ring-(--border) transition-colors active:scale-95"
            >
              Back
            </button>
            <button
              onClick={loadLesson}
              className="flex-1 cursor-pointer rounded-xl bg-(--primary) px-6 py-3 font-medium text-white transition-colors active:scale-95"
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
      <GameOverScreen
        zClassName="z-50"
        onBack={() => router.push('/dashboard')}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (isComplete) {
    return (
      <CompletionScreen
        zClassName="z-50"
        title={lessonId.startsWith('daily-review-') ? 'Review Complete!' : 'Lesson Complete!'}
        xpEarned={xpEarned}
        correctCount={correctCount}
        totalAnswered={totalAnswered}
        streakInfo={streakInfo}
        onContinue={() => router.push(
          lessonMeta?.hasMoreLessons ? `/learn/${lessonMeta.chapterId}` : '/dashboard'
        )}
      >
        {lessonMeta && (
          <div className="mb-6 text-sm text-(--text-muted)">
            {lessonMeta.isWordLesson ? 'Words practiced' : 'Letters practiced'}:{' '}
            <span className="font-medium text-(--text-primary)">
              {lessonMeta.isWordLesson
                ? Array.from(symbolResults.keys()).join(', ')
                : lessonId.startsWith('daily-review-')
                  ? Array.from(symbolResults.keys()).join(', ')
                  : lessonMeta.newSymbols.join(', ')}
            </span>
          </div>
        )}
      </CompletionScreen>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-(--background)">
      <div className="flex-shrink-0 px-4 pt-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg text-(--text-muted) transition-colors hover:bg-(--surface) hover:text-(--text-primary) active:scale-90"
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
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-(--text-muted) ring-1 ring-(--border) transition-colors active:scale-95"
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
          <div className="w-full max-w-sm rounded-2xl bg-(--background) p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-(--text-primary)">Quit Lesson?</h3>
            <p className="mb-6 text-sm text-(--text-muted)">
              Your progress in this lesson won&apos;t be saved and no XP will be earned.
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
                onClick={() => router.push(lessonMeta?.chapterId ? `/learn/${lessonMeta.chapterId}` : '/dashboard')}
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
