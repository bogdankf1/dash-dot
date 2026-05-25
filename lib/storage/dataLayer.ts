'use client';

import type { User } from '@supabase/supabase-js';
import type { LetterProgress, LessonHistory, UserProfile, GuideType } from '@/types';
import { authStore } from '@/lib/auth/authStore';
import {
  loadProfile,
  loadLetterProgress,
  loadLessonHistory,
  saveProfile,
  applyLessonResult,
  resetAll,
  getCreatedAt,
  type LessonResultInput,
} from '@/lib/storage/localProgress';

const DATA_CHANGED_EVENT = 'dashdot:datachanged';

export function emitDataChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
}

export function subscribeToDataChanges(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(DATA_CHANGED_EVENT, cb);
  return () => window.removeEventListener(DATA_CHANGED_EVENT, cb);
}

function synthesizeGuestProfile(): UserProfile {
  const local = loadProfile();
  return {
    id: 'guest',
    username: null,
    avatar_url: null,
    xp: local.xp,
    streak: local.streak,
    last_activity_date: local.last_activity_date,
    selected_guide: local.selected_guide,
    is_alpha_tester: false,
    is_loyal_fan: false,
    created_at: getCreatedAt(),
  };
}

export async function getUserAndProfile(timezoneOffset: number): Promise<{
  user: User | null;
  profile: UserProfile | null;
}> {
  await authStore.ready();
  if (authStore.getStatus() === 'authed') {
    const res = await fetch(`/api/user?timezoneOffset=${timezoneOffset}`);
    if (!res.ok) throw new Error('Failed to load user');
    return res.json();
  }
  return { user: null, profile: synthesizeGuestProfile() };
}

export async function getProgress(): Promise<{
  letterProgress: LetterProgress[];
  lessonHistory: LessonHistory[];
  xp: number;
}> {
  await authStore.ready();
  if (authStore.getStatus() === 'authed') {
    const res = await fetch('/api/progress');
    if (!res.ok) throw new Error('Failed to load progress');
    const data = await res.json();
    return {
      letterProgress: data.letterProgress ?? [],
      lessonHistory: data.lessonHistory ?? [],
      xp: data.xp ?? 0,
    };
  }
  const profile = loadProfile();
  return {
    letterProgress: loadLetterProgress(),
    lessonHistory: loadLessonHistory(),
    xp: profile.xp,
  };
}

export async function saveLessonProgress(input: LessonResultInput): Promise<void> {
  await authStore.ready();
  if (authStore.getStatus() === 'authed') {
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error('Failed to save lesson progress');
    return;
  }
  applyLessonResult(input);
  emitDataChanged();
}

export async function updateProfile(patch: { selected_guide?: GuideType; username?: string }): Promise<void> {
  await authStore.ready();
  if (authStore.getStatus() === 'authed') {
    const res = await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return;
  }
  // For guests, only selected_guide is meaningful.
  if (patch.selected_guide) {
    saveProfile({ selected_guide: patch.selected_guide });
    emitDataChanged();
  }
}

export async function resetProgress(): Promise<void> {
  await authStore.ready();
  if (authStore.getStatus() === 'authed') {
    const res = await fetch('/api/progress', { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to reset progress');
    return;
  }
  resetAll();
  emitDataChanged();
}
