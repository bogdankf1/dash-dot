'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface LeaderboardEntry {
  id: string;
  username: string | null;
  avatar_url: string | null;
  xp: number;
  streak: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard');
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setEntries(data.leaderboard ?? []);
        setCurrentUserId(data.currentUserId ?? null);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        toast.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-[var(--border)]" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--border)]" />
        ))}
      </div>
    );
  }

  const currentUserRank = entries.findIndex((e) => e.id === currentUserId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Leaderboard</h1>

      {/* Podium — top 3 */}
      {entries.length >= 3 && (
        <div className="flex items-end justify-center gap-3">
          <PodiumCard entry={entries[1]} rank={2} onNavigate={() => router.push(`/profile/${entries[1].id}`)} />
          <PodiumCard entry={entries[0]} rank={1} onNavigate={() => router.push(`/profile/${entries[0].id}`)} />
          <PodiumCard entry={entries[2]} rank={3} onNavigate={() => router.push(`/profile/${entries[2].id}`)} />
        </div>
      )}

      {/* Current user rank card */}
      {currentUserRank >= 0 && (
        <div className="rounded-xl bg-indigo-50 p-3 ring-1 ring-indigo-200">
          <p className="text-center text-sm font-medium text-[var(--primary)]">
            You are #{currentUserRank + 1} with {entries[currentUserRank].xp} XP
          </p>
        </div>
      )}

      {/* Full list */}
      <div className="rounded-xl bg-[var(--surface)] ring-1 ring-[var(--border)] overflow-hidden">
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            onClick={() => router.push(entry.id === currentUserId ? '/profile' : `/profile/${entry.id}`)}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--background)] ${
              i !== entries.length - 1 ? 'border-b border-[var(--border)]' : ''
            } ${entry.id === currentUserId ? 'bg-indigo-50/50' : ''}`}
          >
            {/* Rank */}
            <div className="w-8 text-center">
              {i < 3 ? (
                <span className="text-lg">{['🥇', '🥈', '🥉'][i]}</span>
              ) : (
                <span className="text-sm font-semibold text-[var(--text-muted)]">{i + 1}</span>
              )}
            </div>

            {/* Avatar */}
            <Avatar username={entry.username} avatarUrl={entry.avatar_url} />

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${
                entry.id === currentUserId ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'
              }`}>
                {entry.username || 'Anonymous'}
                {entry.id === currentUserId && (
                  <span className="ml-1.5 text-xs font-normal text-[var(--text-muted)]">(you)</span>
                )}
              </p>
            </div>

            {/* Streak */}
            {entry.streak > 0 && (
              <div className="flex items-center gap-0.5 text-xs text-amber-600">
                <span>🔥</span>
                <span className="font-semibold">{entry.streak}</span>
              </div>
            )}

            {/* XP */}
            <div className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">
              <span>⚡</span>
              {entry.xp}
            </div>
          </div>
        ))}

        {entries.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
            No users yet. Be the first to earn XP!
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar({ username, avatarUrl }: { username: string | null; avatarUrl: string | null }) {
  const initials = username ? username.slice(0, 2).toUpperCase() : '?';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username || 'User'}
        className="h-9 w-9 rounded-full object-cover ring-1 ring-[var(--border)]"
      />
    );
  }

  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{ backgroundColor: 'var(--primary)' }}
    >
      {initials}
    </div>
  );
}

function PodiumCard({ entry, rank, onNavigate }: { entry: LeaderboardEntry; rank: 1 | 2 | 3; onNavigate: () => void }) {
  const heights = { 1: 'h-28', 2: 'h-22', 3: 'h-18' };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const sizes = { 1: 'w-14 h-14 text-base', 2: 'w-11 h-11 text-sm', 3: 'w-11 h-11 text-sm' };
  const initials = entry.username ? entry.username.slice(0, 2).toUpperCase() : '?';

  return (
    <div onClick={onNavigate} className={`flex flex-col items-center gap-1.5 cursor-pointer ${rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3'}`}>
      <div className="relative">
        {entry.avatar_url ? (
          <img
            src={entry.avatar_url}
            alt={entry.username || 'User'}
            className={`rounded-full object-cover ring-2 ring-[var(--border)] ${sizes[rank]}`}
          />
        ) : (
          <div
            className={`flex items-center justify-center rounded-full font-bold text-white ring-2 ring-[var(--border)] ${sizes[rank]}`}
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {initials}
          </div>
        )}
        <span className="absolute -bottom-1 -right-1 text-base">{medals[rank]}</span>
      </div>
      <p className="text-xs font-medium text-[var(--text-primary)] max-w-[5rem] truncate text-center">
        {entry.username || 'Anonymous'}
      </p>
      <div className="flex items-center gap-0.5 text-xs font-semibold text-[var(--primary)]">
        <span>⚡</span>
        {entry.xp}
      </div>
      <div
        className={`w-20 ${heights[rank]} rounded-t-xl bg-[var(--surface)] ring-1 ring-[var(--border)] flex items-center justify-center`}
      >
        <span className="text-2xl font-bold text-[var(--text-muted)] opacity-30">{rank}</span>
      </div>
    </div>
  );
}
