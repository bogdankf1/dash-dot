'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import StreakBadge from '@/components/ui/StreakBadge';
import XPBar from '@/components/ui/XPBar';
import ChapterCard from '@/components/ui/ChapterCard';
import NotificationBanner from '@/components/ui/NotificationBanner';
import { getChapters, getChapterCompletionStatus, getDailyReviewChapter, getDailyReviewLessons } from '@/lib/morse/chapters';
import { getUserAndProfile, getProgress, subscribeToDataChanges } from '@/lib/storage/dataLayer';
import type { UserProfile, LetterProgress, LessonHistory, Chapter } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [_, setLetterProgress] = useState<LetterProgress[]>([]);
  const [lessonHistory, setLessonHistory] = useState<LessonHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    setError(false);
    setLoading(true);
    try {
      const [userData, progressData] = await Promise.all([
        getUserAndProfile(new Date().getTimezoneOffset()),
        getProgress(),
      ]);
      setProfile(userData.profile);
      setLetterProgress(progressData.letterProgress);
      setLessonHistory(progressData.lessonHistory);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(true);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    return subscribeToDataChanges(fetchData);
  }, [fetchData]);

  const chapters: Chapter[] = useMemo(
    () => (profile ? getChapters(profile.selected_guide) : []),
    [profile?.selected_guide]
  );

  const completedLessonIds = useMemo(
    () => lessonHistory.map((lh) => lh.lesson_id),
    [lessonHistory]
  );

  const completionStatus = useMemo(
    () =>
      chapters.length > 0
        ? getChapterCompletionStatus(chapters, completedLessonIds)
        : new Map<string, { total: number; completed: number; unlocked: boolean }>(),
    [chapters, completedLessonIds]
  );

  const allChaptersComplete = useMemo(
    () =>
      chapters.length > 0 &&
      chapters.every((ch) => {
        const status = completionStatus.get(ch.id);
        return status && status.completed >= status.total;
      }),
    [chapters, completionStatus]
  );

  // Daily review is deterministic per-day; recomputing it across renders inside
  // the same day yields identical output, but useMemo keeps the reference
  // stable so child equality checks (React.memo on ChapterCard) hold.
  const dailyReviewLessons = useMemo(() => getDailyReviewLessons(), []);
  const dailyReviewCompleted = useMemo(
    () => dailyReviewLessons.filter((l) => completedLessonIds.includes(l.id)).length,
    [dailyReviewLessons, completedLessonIds]
  );

  const handleContinueLearning = useCallback(() => {
    for (const chapter of chapters) {
      const status = completionStatus.get(chapter.id);
      if (status && status.unlocked && status.completed < status.total) {
        router.push(`/learn/${chapter.id}`);
        return;
      }
    }
    if (allChaptersComplete) {
      router.push('/learn/daily-review');
      return;
    }
    if (chapters.length > 0) {
      router.push(`/learn/${chapters[0].id}`);
    }
  }, [chapters, completionStatus, allChaptersComplete, router]);

  if (loading) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div className="h-8 w-20 animate-pulse rounded-full bg-gray-200" />
          <div className="h-8 w-24 animate-pulse rounded-full bg-gray-200" />
        </div>
        <div className="mb-8 h-12 w-full animate-pulse rounded-xl bg-gray-200" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="mb-4 text-(--text-muted)">Something went wrong loading your dashboard.</p>
        <button
          type="button"
          onClick={fetchData}
          className="cursor-pointer rounded-xl bg-(--primary) px-6 py-3 font-medium text-white transition-colors hover:bg-(--primary-hover) active:scale-95"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <StreakBadge streak={profile?.streak ?? 0} />
        <XPBar xp={profile?.xp ?? 0} />
      </div>

      <NotificationBanner lessonCount={lessonHistory.length} />

      <button
        type="button"
        onClick={handleContinueLearning}
        className="mb-8 w-full cursor-pointer rounded-xl bg-(--primary) px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-(--primary-hover) active:scale-95"
      >
        {allChaptersComplete ? 'Daily Review' : 'Continue Learning'}
      </button>

      <h2 className="mb-4 text-lg font-bold text-(--text-primary)">Chapters</h2>
      <div className="space-y-3">
        {chapters.map((chapter) => {
          const status = completionStatus.get(chapter.id) ?? {
            total: 0,
            completed: 0,
            unlocked: false,
          };
          return (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              completion={status}
              onClick={() => {
                if (status.unlocked) {
                  router.push(`/learn/${chapter.id}`);
                }
              }}
            />
          );
        })}

        {allChaptersComplete && (
          <ChapterCard
            chapter={getDailyReviewChapter()}
            completion={{
              total: dailyReviewLessons.length,
              completed: dailyReviewCompleted,
              unlocked: true,
            }}
            onClick={() => router.push('/learn/daily-review')}
          />
        )}
      </div>
    </div>
  );
}
