'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AlphabetGrid from '@/components/ui/AlphabetGrid';
import { getChapters, getLessonsForChapter, getDailyReviewChapter, getDailyReviewLessons } from '@/lib/morse/chapters';
import type { UserProfile, LetterProgress, LessonHistory, Chapter, LessonConfig } from '@/types';

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();
  const chapterId = params.chapterId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [letterProgress, setLetterProgress] = useState<LetterProgress[]>([]);
  const [lessonHistory, setLessonHistory] = useState<LessonHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    setError(false);
    setLoading(true);
    try {
      const [userRes, progressRes] = await Promise.all([
        fetch(`/api/user?timezoneOffset=${new Date().getTimezoneOffset()}`),
        fetch('/api/progress'),
      ]);

      if (!userRes.ok || !progressRes.ok) throw new Error('Failed to load');

      const userData = await userRes.json();
      setProfile(userData.profile);

      const progressData = await progressRes.json();
      setLetterProgress(progressData.letterProgress ?? []);
      setLessonHistory(progressData.lessonHistory ?? []);
    } catch (err) {
      console.error('Failed to fetch chapter data:', err);
      setError(true);
      toast.error('Failed to load chapter data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isDailyReview = chapterId === 'daily-review';
  const chapters: Chapter[] = profile ? getChapters(profile.selected_guide) : [];
  const chapter = isDailyReview
    ? getDailyReviewChapter()
    : chapters.find((c) => c.id === chapterId) ?? null;

  const previousSymbols = chapter && !isDailyReview
    ? chapters.filter((c) => c.index < chapter.index).flatMap((c) => c.symbols)
    : [];

  const lessons: LessonConfig[] = isDailyReview
    ? getDailyReviewLessons()
    : chapter
      ? getLessonsForChapter(chapter, previousSymbols)
      : [];

  const completedLessonIds = new Set(lessonHistory.map((lh) => lh.lesson_id));

  function getLessonStatus(lesson: LessonConfig, index: number): 'completed' | 'available' | 'locked' {
    if (completedLessonIds.has(lesson.id)) return 'completed';
    if (isDailyReview) return 'available';
    if (index === 0) return 'available';
    const prevLesson = lessons[index - 1];
    if (completedLessonIds.has(prevLesson.id)) return 'available';
    return 'locked';
  }

  const chapterLetterProgress = letterProgress.filter((lp) =>
    chapter?.symbols.includes(lp.symbol.toUpperCase())
  );

  const nextAvailableLesson = lessons.find((lesson, index) => getLessonStatus(lesson, index) === 'available');

  if (loading) {
    return (
      <div>
        <div className="mb-4 h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mb-6 grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="mb-4 text-[var(--text-muted)]">Something went wrong loading this chapter.</p>
        <button
          type="button"
          onClick={fetchData}
          className="cursor-pointer rounded-xl bg-[var(--primary)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--primary-hover)] active:scale-95"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-[var(--text-muted)]">Chapter not found.</p>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="mt-4 cursor-pointer text-[var(--primary)] underline transition-colors active:scale-95"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        className="mb-4 flex cursor-pointer items-center gap-1 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] active:scale-95"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span className="font-medium text-[var(--text-primary)]">{chapter.title}</span>
      </button>
      <p className="mb-6 text-[var(--text-muted)]">
        {isDailyReview ? 'Review all letters with fresh lessons every day' : `Symbols: ${chapter.symbols.join(', ')}`}
      </p>

      <div className="mb-8">
        <AlphabetGrid letterProgress={chapterLetterProgress} symbols={chapter.symbols} />
      </div>

      {nextAvailableLesson && (
        <button
          type="button"
          onClick={() => router.push(`/lesson/${nextAvailableLesson.id}`)}
          className="mb-8 w-full cursor-pointer rounded-xl bg-[var(--primary)] px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-[var(--primary-hover)] active:scale-95"
        >
          Start Lesson
        </button>
      )}

      <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">Lessons</h2>
      <div className="space-y-3">
        {lessons.map((lesson, index) => {
          const status = getLessonStatus(lesson, index);
          const isCompleted = status === 'completed';
          const isAvailable = status === 'available';
          const isLocked = status === 'locked';

          return (
            <button
              key={lesson.id}
              type="button"
              disabled={isLocked}
              onClick={() => {
                if (isAvailable || isCompleted) {
                  router.push(`/lesson/${lesson.id}`);
                }
              }}
              className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                isCompleted
                  ? 'border-green-200 bg-green-50 cursor-pointer hover:shadow-md active:scale-[0.98]'
                  : isAvailable
                    ? 'border-[var(--primary)] bg-[var(--surface)] shadow-sm cursor-pointer hover:shadow-md active:scale-[0.98]'
                    : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                  isCompleted
                    ? 'bg-[var(--success)] text-white'
                    : isAvailable
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : isLocked ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3
                  className={`font-semibold ${
                    isLocked ? 'text-gray-400' : 'text-[var(--text-primary)]'
                  }`}
                >
                  {lesson.isWordLesson ? 'Word Practice' : isDailyReview ? `Review ${index + 1}` : `Lesson ${index + 1}`}
                </h3>
                <p className={`text-sm ${isLocked ? 'text-gray-400' : 'text-[var(--text-muted)]'}`}>
                  {lesson.isWordLesson ? (
                    'Practice real words with letters you\'ve learned'
                  ) : isDailyReview ? (
                    <>
                      {lesson.newSymbols.join(', ')}
                    </>
                  ) : (
                    <>
                      New: {lesson.newSymbols.join(', ')}
                      {lesson.reviewSymbols.length > 0 && (
                        <span> &middot; Review: {lesson.reviewSymbols.slice(0, 4).join(', ')}{lesson.reviewSymbols.length > 4 ? '...' : ''}</span>
                      )}
                    </>
                  )}
                </p>
              </div>
              {isCompleted && (
                <span className="text-xs font-medium text-[var(--success)]">Done</span>
              )}
              {isAvailable && (
                <span className="text-xs font-medium text-[var(--primary)]">Start</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
