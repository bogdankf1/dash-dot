'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AlphabetGrid from '@/components/ui/AlphabetGrid';
import type { LetterProgress, LessonHistory } from '@/types';

export default function ProgressPage() {
  const [letterProgress, setLetterProgress] = useState<LetterProgress[]>([]);
  const [lessonHistory, setLessonHistory] = useState<LessonHistory[]>([]);
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchProgress = async () => {
    setError(false);
    setLoading(true);
    try {
      const res = await fetch('/api/progress');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setLetterProgress(data.letterProgress ?? []);
      setLessonHistory(data.lessonHistory ?? []);
      setXp(data.xp ?? 0);
    } catch (err) {
      console.error('Failed to fetch progress:', err);
      setError(true);
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const lettersMastered = letterProgress.filter((lp) => lp.mastery_level === 3).length;
  const lessonsCompleted = lessonHistory.length;

  const overallAccuracy = (() => {
    const withAttempts = letterProgress.filter((lp) => lp.attempt_count > 0);
    if (withAttempts.length === 0) return 0;
    const totalCorrect = withAttempts.reduce((sum, lp) => sum + lp.correct_count, 0);
    const totalAttempts = withAttempts.reduce((sum, lp) => sum + lp.attempt_count, 0);
    return totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  })();

  const totalXp = xp || lessonHistory.reduce((sum, lh) => sum + lh.xp_earned, 0);

  if (loading) {
    return (
      <div>
        <div className="mb-6 h-8 w-40 animate-pulse rounded bg-gray-200" />
        <div className="mb-8 grid grid-cols-6 gap-2 md:grid-cols-8">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="mb-4 text-[var(--text-muted)]">Something went wrong loading your progress.</p>
        <button
          type="button"
          onClick={fetchProgress}
          className="cursor-pointer rounded-xl bg-[var(--primary)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--primary-hover)] active:scale-95"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[var(--text-primary)]">Your Progress</h1>

      <div className="mb-8">
        <AlphabetGrid letterProgress={letterProgress} />
      </div>

      <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">Stats</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="text-sm text-[var(--text-muted)]">Total XP</p>
          <p className="mt-1 text-2xl font-bold text-[var(--primary)]">{totalXp}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="text-sm text-[var(--text-muted)]">Letters Mastered</p>
          <p className="mt-1 text-2xl font-bold text-[var(--success)]">{lettersMastered}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="text-sm text-[var(--text-muted)]">Overall Accuracy</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{overallAccuracy}%</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="text-sm text-[var(--text-muted)]">Lessons Completed</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{lessonsCompleted}</p>
        </div>
      </div>
    </div>
  );
}
