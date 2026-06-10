'use client';

import { useSyncExternalStore } from 'react';
import { runSignInMerge } from '@/lib/storage/signInMerge';
import { resetAll as resetGuestData } from '@/lib/storage/localProgress';
import { emitDataChanged } from '@/lib/storage/dataLayer';

export type AuthStatus = 'loading' | 'guest' | 'authed';

// Minimal user shape exposed to client components. No page reads these fields
// today (they all branch on `status`), but we mirror the Auth.js session user.
export type AuthUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type Listener = () => void;

const listeners = new Set<Listener>();
let user: AuthUser | null = null;
let status: AuthStatus = 'loading';
let initStarted = false;
let readyPromise: Promise<void> | null = null;
let readyResolve: (() => void) | null = null;

function notify() {
  listeners.forEach((fn) => fn());
}

function setStatus(next: AuthStatus, nextUser: AuthUser | null) {
  const wasAuthed = status === 'authed';
  const willBeAuthed = next === 'authed';
  status = next;
  user = nextUser;

  if (!wasAuthed && willBeAuthed) {
    // Guest → authed transition. Fire merge async; UI updates after refresh.
    void runSignInMerge();
  }

  // Authed → guest (sign-out): clear any local guest data so the *next* sign-in
  // (potentially a different user on the same browser) can't accidentally
  // inherit this account's progress through the merge path.
  if (wasAuthed && !willBeAuthed) {
    resetGuestData();
    emitDataChanged();
  }

  notify();
}

async function fetchSessionUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.user ? (data.user as AuthUser) : null;
  } catch {
    return null;
  }
}

async function loadAndSet() {
  const sessionUser = await fetchSessionUser();
  if (sessionUser) {
    setStatus('authed', sessionUser);
  } else {
    setStatus('guest', null);
  }
}

function ensureInit() {
  if (initStarted || typeof window === 'undefined') return;
  initStarted = true;

  readyPromise = new Promise<void>((resolve) => {
    readyResolve = resolve;
  });

  loadAndSet().finally(() => readyResolve?.());
}

export const authStore = {
  getUser(): AuthUser | null {
    ensureInit();
    return user;
  },
  getStatus(): AuthStatus {
    ensureInit();
    return status;
  },
  subscribe(cb: Listener): () => void {
    ensureInit();
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  async ready(): Promise<void> {
    ensureInit();
    if (status !== 'loading') return;
    if (readyPromise) await readyPromise;
  },
  // Re-read the session after a client-side auth change (e.g. sign-out without a
  // full reload). Drives the authed → guest cleanup in setStatus.
  async refresh(): Promise<void> {
    ensureInit();
    await loadAndSet();
  },
};

function getSnapshot(): { user: AuthUser | null; status: AuthStatus } {
  return { user: authStore.getUser(), status: authStore.getStatus() };
}

let cachedSnapshot: { user: AuthUser | null; status: AuthStatus } = { user: null, status: 'loading' };

function getCachedSnapshot() {
  const next = getSnapshot();
  if (next.user !== cachedSnapshot.user || next.status !== cachedSnapshot.status) {
    cachedSnapshot = next;
  }
  return cachedSnapshot;
}

const serverSnapshot = { user: null, status: 'loading' as AuthStatus };

export function useAuth() {
  return useSyncExternalStore(
    authStore.subscribe,
    getCachedSnapshot,
    () => serverSnapshot
  );
}
