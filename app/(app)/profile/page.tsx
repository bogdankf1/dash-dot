'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile, LessonHistory } from '@/types';

const BADGES = [
  { id: 'first-lesson', label: 'First Lesson', icon: '🎓', check: (h: LessonHistory[]) => h.length >= 1 },
  { id: 'five-lessons', label: '5 Lessons', icon: '📚', check: (h: LessonHistory[]) => h.length >= 5 },
  { id: 'ten-lessons', label: '10 Lessons', icon: '🏆', check: (h: LessonHistory[]) => h.length >= 10 },
  { id: 'streak-3', label: '3-Day Streak', icon: '🔥', check: (_h: LessonHistory[], s: number) => s >= 3 },
  { id: 'streak-7', label: '7-Day Streak', icon: '💪', check: (_h: LessonHistory[], s: number) => s >= 7 },
  { id: 'xp-500', label: '500 XP', icon: '⚡', check: (_h: LessonHistory[], _s: number, xp: number) => xp >= 500 },
  { id: 'xp-1000', label: '1000 XP', icon: '💎', check: (_h: LessonHistory[], _s: number, xp: number) => xp >= 1000 },
  { id: 'perfect', label: 'Perfect Lesson', icon: '💯', check: (h: LessonHistory[]) => h.some((l) => l.accuracy >= 1) },
];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<LessonHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const res = await fetch('/api/user');
      const userData = await res.json();
      if (!userData.profile) {
        router.push('/login');
        return;
      }
      setProfile(userData.profile);

      const progressRes = await fetch('/api/progress');
      const progressData = await progressRes.json();
      setHistory(progressData.lessonHistory || []);
      setLoading(false);
    }
    loadData();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-xl bg-[var(--border)]" />
        <div className="h-40 animate-pulse rounded-xl bg-[var(--border)]" />
      </div>
    );
  }

  if (!profile) return null;

  const earnedBadges = BADGES.filter((b) =>
    b.check(history, profile.streak, profile.xp)
  );

  // Build activity heatmap for last 30 days
  const activityMap = new Map<string, number>();
  for (const lesson of history) {
    const date = lesson.completed_at.split('T')[0];
    activityMap.set(date, (activityMap.get(date) || 0) + 1);
  }

  const last30Days: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    last30Days.push({ date: dateStr, count: activityMap.get(dateStr) || 0 });
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
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {profile.username || 'Learner'}
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Joined {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>
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
      <div className="rounded-xl bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]">
        <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          Activity (Last 30 Days)
        </h3>
        <div className="grid grid-cols-10 gap-1">
          {last30Days.map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.count} lesson${day.count !== 1 ? 's' : ''}`}
              className="aspect-square rounded-sm"
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
            />
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="rounded-xl bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]">
        <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          Badges
        </h3>
        <div className="grid grid-cols-4 gap-3">
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
                <span className="text-[10px] leading-tight text-[var(--text-muted)]">
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full rounded-xl bg-[var(--surface)] px-6 py-3 text-sm font-medium text-[var(--error)] ring-1 ring-[var(--border)]"
      >
        Sign Out
      </button>
    </div>
  );
}
