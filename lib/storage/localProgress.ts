'use client';

import type { GuideType, LetterProgress, LessonHistory, MasteryLevel } from '@/types';

const KEY_PROFILE = 'dashdot:guest:v1:profile';
const KEY_LETTERS = 'dashdot:guest:v1:letter_progress';
const KEY_HISTORY = 'dashdot:guest:v1:lesson_history';
const KEY_CREATED = 'dashdot:guest:v1:created_at';

export interface LocalProfile {
  xp: number;
  streak: number;
  last_activity_date: string | null;
  selected_guide: GuideType;
}

export interface GuestSnapshot {
  profile: LocalProfile;
  letterProgress: Omit<LetterProgress, 'id' | 'user_id'>[];
  lessonHistory: Omit<LessonHistory, 'id' | 'user_id'>[];
}

const DEFAULT_PROFILE: LocalProfile = {
  xp: 0,
  streak: 0,
  last_activity_date: null,
  selected_guide: 'google',
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function ensureCreatedAt(): string {
  if (typeof window === 'undefined') return new Date(0).toISOString();
  const existing = localStorage.getItem(KEY_CREATED);
  if (existing) return existing;
  const now = new Date().toISOString();
  localStorage.setItem(KEY_CREATED, now);
  return now;
}

export function loadProfile(): LocalProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  const stored = safeParse<Partial<LocalProfile> | null>(localStorage.getItem(KEY_PROFILE), null);
  return { ...DEFAULT_PROFILE, ...(stored ?? {}) };
}

export function saveProfile(patch: Partial<LocalProfile>): LocalProfile {
  const next = { ...loadProfile(), ...patch };
  localStorage.setItem(KEY_PROFILE, JSON.stringify(next));
  ensureCreatedAt();
  return next;
}

export function loadLetterProgress(): LetterProgress[] {
  if (typeof window === 'undefined') return [];
  const raw = safeParse<Omit<LetterProgress, 'id' | 'user_id'>[]>(
    localStorage.getItem(KEY_LETTERS),
    []
  );
  return raw.map((lp, i) => ({
    id: `guest-${i}-${lp.symbol}`,
    user_id: 'guest',
    ...lp,
  }));
}

export function loadLessonHistory(): LessonHistory[] {
  if (typeof window === 'undefined') return [];
  const raw = safeParse<Omit<LessonHistory, 'id' | 'user_id'>[]>(
    localStorage.getItem(KEY_HISTORY),
    []
  );
  return raw.map((lh, i) => ({
    id: `guest-${i}`,
    user_id: 'guest',
    ...lh,
  }));
}

function persistLetterProgress(rows: LetterProgress[]) {
  const stripped = rows.map(({ id: _id, user_id: _u, ...rest }) => rest);
  localStorage.setItem(KEY_LETTERS, JSON.stringify(stripped));
}

function persistLessonHistory(rows: LessonHistory[]) {
  const stripped = rows.map(({ id: _id, user_id: _u, ...rest }) => rest);
  localStorage.setItem(KEY_HISTORY, JSON.stringify(stripped));
}

export interface LessonResultInput {
  chapterId: string;
  lessonId: string;
  xpEarned: number;
  accuracy: number;
  symbolResults: { symbol: string; correct: number; attempts: number; masteryLevel: number }[];
  timezoneOffset: number;
}

function localDateFromOffset(offsetMinutes: number): string {
  const now = new Date();
  const local = new Date(now.getTime() - offsetMinutes * 60_000);
  return local.toISOString().split('T')[0];
}

export function applyLessonResult(input: LessonResultInput): void {
  ensureCreatedAt();

  const history = loadLessonHistory();
  history.push({
    id: `guest-${history.length}`,
    user_id: 'guest',
    chapter_id: input.chapterId,
    lesson_id: input.lessonId,
    xp_earned: input.xpEarned,
    accuracy: input.accuracy,
    completed_at: new Date().toISOString(),
  });
  persistLessonHistory(history);

  const letters = loadLetterProgress();
  const bySymbol = new Map(letters.map((l) => [l.symbol, l]));
  const nowIso = new Date().toISOString();
  for (const result of input.symbolResults) {
    const existing = bySymbol.get(result.symbol);
    if (existing) {
      existing.mastery_level = result.masteryLevel as MasteryLevel;
      existing.correct_count += result.correct;
      existing.attempt_count += result.attempts;
      existing.last_seen = nowIso;
    } else {
      bySymbol.set(result.symbol, {
        id: `guest-${letters.length + bySymbol.size}-${result.symbol}`,
        user_id: 'guest',
        symbol: result.symbol,
        mastery_level: result.masteryLevel as MasteryLevel,
        correct_count: result.correct,
        attempt_count: result.attempts,
        last_seen: nowIso,
      });
    }
  }
  persistLetterProgress(Array.from(bySymbol.values()));

  const profile = loadProfile();
  const localDate = localDateFromOffset(input.timezoneOffset);

  let newStreak = profile.streak;
  if (profile.last_activity_date === localDate) {
    // same day, no change
  } else if (
    profile.last_activity_date &&
    yesterdayOf(localDate) === profile.last_activity_date
  ) {
    newStreak = profile.streak + 1;
  } else {
    newStreak = 1;
  }

  saveProfile({
    xp: profile.xp + input.xpEarned,
    streak: newStreak,
    last_activity_date: localDate,
  });
}

function yesterdayOf(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}

export function hasAnyData(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    localStorage.getItem(KEY_PROFILE) !== null ||
    localStorage.getItem(KEY_LETTERS) !== null ||
    localStorage.getItem(KEY_HISTORY) !== null
  );
}

export function resetAll(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY_PROFILE);
  localStorage.removeItem(KEY_LETTERS);
  localStorage.removeItem(KEY_HISTORY);
  localStorage.removeItem(KEY_CREATED);
}

export function getCreatedAt(): string {
  return ensureCreatedAt();
}

export function exportSnapshot(): GuestSnapshot {
  const profile = loadProfile();
  const letterProgress = loadLetterProgress().map(({ id: _id, user_id: _u, ...rest }) => rest);
  const lessonHistory = loadLessonHistory().map(({ id: _id, user_id: _u, ...rest }) => rest);
  return { profile, letterProgress, lessonHistory };
}
