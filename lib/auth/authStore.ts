'use client';

import { useSyncExternalStore } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { runSignInMerge } from '@/lib/storage/signInMerge';

export type AuthStatus = 'loading' | 'guest' | 'authed';

type Listener = () => void;

const listeners = new Set<Listener>();
let user: User | null = null;
let status: AuthStatus = 'loading';
let initStarted = false;
let readyPromise: Promise<void> | null = null;
let readyResolve: (() => void) | null = null;

function notify() {
  listeners.forEach((fn) => fn());
}

function setStatus(next: AuthStatus, nextUser: User | null) {
  const wasAuthed = status === 'authed';
  const willBeAuthed = next === 'authed';
  status = next;
  user = nextUser;

  if (!wasAuthed && willBeAuthed) {
    // Guest → authed transition. Fire merge async; UI updates after refresh.
    void runSignInMerge();
  }

  notify();
}

function ensureInit() {
  if (initStarted || typeof window === 'undefined') return;
  initStarted = true;

  readyPromise = new Promise<void>((resolve) => {
    readyResolve = resolve;
  });

  const supabase = createClient();

  supabase.auth.getUser().then(({ data }) => {
    if (data.user) {
      setStatus('authed', data.user);
    } else {
      setStatus('guest', null);
    }
    readyResolve?.();
  }).catch(() => {
    setStatus('guest', null);
    readyResolve?.();
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      setStatus('authed', session.user);
    } else {
      setStatus('guest', null);
    }
  });
}

export const authStore = {
  getUser(): User | null {
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
};

function getSnapshot(): { user: User | null; status: AuthStatus } {
  return { user: authStore.getUser(), status: authStore.getStatus() };
}

let cachedSnapshot: { user: User | null; status: AuthStatus } = { user: null, status: 'loading' };

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
