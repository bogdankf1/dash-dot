'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import type { UserProfile, LessonHistory, LetterProgress } from '@/types';

type BadgeCheck = (h: LessonHistory[], s: number, xp: number, lp: LetterProgress[]) => boolean;

const BADGES: { id: string; label: string; icon: string; check: BadgeCheck }[] = [
  { id: 'first-lesson', label: 'First Lesson', icon: '🎓', check: (h) => h.length >= 1 },
  { id: 'five-lessons', label: '5 Lessons', icon: '📚', check: (h) => h.length >= 5 },
  { id: 'ten-lessons', label: '10 Lessons', icon: '🏆', check: (h) => h.length >= 10 },
  { id: 'twenty-lessons', label: '20 Lessons', icon: '📖', check: (h) => h.length >= 20 },
  { id: 'fifty-lessons', label: '50 Lessons', icon: '🎖️', check: (h) => h.length >= 50 },
  { id: 'streak-3', label: '3-Day Streak', icon: '🔥', check: (_h, s) => s >= 3 },
  { id: 'streak-7', label: '7-Day Streak', icon: '💪', check: (_h, s) => s >= 7 },
  { id: 'streak-14', label: '14-Day Streak', icon: '⚡', check: (_h, s) => s >= 14 },
  { id: 'streak-30', label: '30-Day Streak', icon: '🌟', check: (_h, s) => s >= 30 },
  { id: 'xp-500', label: '500 XP', icon: '✨', check: (_h, _s, xp) => xp >= 500 },
  { id: 'xp-1000', label: '1000 XP', icon: '💎', check: (_h, _s, xp) => xp >= 1000 },
  { id: 'xp-2500', label: '2500 XP', icon: '👑', check: (_h, _s, xp) => xp >= 2500 },
  { id: 'xp-5000', label: '5000 XP', icon: '🏅', check: (_h, _s, xp) => xp >= 5000 },
  { id: 'perfect', label: 'Perfect Lesson', icon: '💯', check: (h) => h.some((l) => l.accuracy >= 1) },
  { id: 'triple-perfect', label: '3 Perfect Lessons', icon: '🎯', check: (h) => h.filter((l) => l.accuracy >= 1).length >= 3 },
  { id: 'all-letters', label: 'All Letters Mastered', icon: '🔤', check: (_h, _s, _xp, lp) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    return letters.every((l) => lp.some((p) => p.symbol === l && p.mastery_level >= 3));
  }},
  { id: 'all-numbers', label: 'All Numbers Mastered', icon: '🔢', check: (_h, _s, _xp, lp) => {
    const numbers = '0123456789'.split('');
    return numbers.every((n) => lp.some((p) => p.symbol === n && p.mastery_level >= 3));
  }},
];

function ActivityHeatmap({ last30Days }: { last30Days: { date: string; count: number; xp: number }[] }) {
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => setActiveDay(null), []);

  useEffect(() => {
    if (activeDay === null) return;
    const handler = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        dismiss();
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [activeDay, dismiss]);

  return (
    <div className="rounded-xl bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]">
      <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
        Activity (Last 30 Days)
      </h3>
      <div ref={containerRef} className="grid grid-cols-10 gap-1">
        {last30Days.map((day, i) => (
          <div
            key={day.date}
            className="relative aspect-square rounded-sm cursor-pointer"
            style={{
              backgroundColor:
                day.count === 0
                  ? 'var(--border)'
                  : day.count === 1
                    ? '#bbf7d0'
                    : day.count <= 3
                      ? '#4ade80'
                      : '#16a34a',
            }}
            onPointerEnter={() => setActiveDay(i)}
            onPointerLeave={() => setActiveDay(null)}
            onClick={() => setActiveDay(activeDay === i ? null : i)}
          >
            {activeDay === i && (
              <div className="absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[var(--text-primary)] px-2.5 py-1.5 text-xs text-[var(--background)] shadow-lg">
                <div className="font-medium">{day.date}</div>
                <div>{day.count} lesson{day.count !== 1 ? 's' : ''} &middot; {day.xp} XP</div>
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[var(--text-primary)]" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<LessonHistory[]>([]);
  const [letterProgress, setLetterProgress] = useState<LetterProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = async () => {
    setError(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/user?timezoneOffset=${new Date().getTimezoneOffset()}`);
      if (!res.ok) throw new Error('Failed to load');
      const userData = await res.json();
      if (!userData.profile) {
        router.push('/login');
        return;
      }
      setProfile(userData.profile);

      const progressRes = await fetch('/api/progress');
      if (!progressRes.ok) throw new Error('Failed to load progress');
      const progressData = await progressRes.json();
      setHistory(progressData.lessonHistory || []);
      setLetterProgress(progressData.letterProgress || []);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(true);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-xl bg-[var(--border)]" />
        <div className="h-40 animate-pulse rounded-xl bg-[var(--border)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="mb-4 text-[var(--text-muted)]">Something went wrong loading your profile.</p>
        <button
          type="button"
          onClick={loadData}
          className="cursor-pointer rounded-xl bg-[var(--primary)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--primary-hover)] active:scale-95"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!profile) return null;

  const earnedBadges = BADGES.filter((b) =>
    b.check(history, profile.streak, profile.xp, letterProgress)
  );

  // Build activity heatmap for last 30 days
  const activityMap = new Map<string, { count: number; xp: number }>();
  for (const lesson of history) {
    const date = new Date(lesson.completed_at).toLocaleDateString('sv-SE');
    const existing = activityMap.get(date) || { count: 0, xp: 0 };
    existing.count += 1;
    existing.xp += lesson.xp_earned;
    activityMap.set(date, existing);
  }

  const last30Days: { date: string; count: number; xp: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('sv-SE');
    const activity = activityMap.get(dateStr);
    last30Days.push({ date: dateStr, count: activity?.count || 0, xp: activity?.xp || 0 });
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-center gap-4 rounded-xl bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Avatar"
            className="h-16 w-16 rounded-full"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)] text-2xl font-bold text-white">
            {(profile.username || '?')[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {profile.username || 'Learner'}
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Joined {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>
        <Link
          href="/settings"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--background)] hover:text-[var(--text-primary)]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-[var(--surface)] p-4 text-center ring-1 ring-[var(--border)]">
          <div className="text-2xl font-bold text-[var(--primary)]">
            {profile.xp}
          </div>
          <div className="text-xs text-[var(--text-muted)]">Total XP</div>
        </div>
        <div className="rounded-xl bg-[var(--surface)] p-4 text-center ring-1 ring-[var(--border)]">
          <div className="text-2xl font-bold text-amber-500">
            {profile.streak}
          </div>
          <div className="text-xs text-[var(--text-muted)]">Day Streak</div>
        </div>
        <div className="rounded-xl bg-[var(--surface)] p-4 text-center ring-1 ring-[var(--border)]">
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {history.length}
          </div>
          <div className="text-xs text-[var(--text-muted)]">Lessons</div>
        </div>
      </div>

      {/* Activity (last 30 days) */}
      <ActivityHeatmap last30Days={last30Days} />

      {/* Badges */}
      <div className="rounded-xl bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]">
        <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          Badges
        </h3>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {BADGES.map((badge) => {
            const earned = earnedBadges.includes(badge);
            return (
              <div
                key={badge.id}
                className={`flex flex-col items-center gap-1 rounded-lg p-2 text-center ${
                  earned ? '' : 'opacity-30 grayscale'
                }`}
              >
                <span className="text-2xl">{badge.icon}</span>
                <span className="text-xs leading-tight text-[var(--text-muted)]">
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
