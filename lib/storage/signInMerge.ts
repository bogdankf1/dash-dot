'use client';

import { hasAnyData, exportSnapshot, resetAll } from '@/lib/storage/localProgress';
import { emitDataChanged } from '@/lib/storage/dataLayer';

let inFlight: Promise<void> | null = null;

export async function runSignInMerge(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (inFlight) return inFlight;
  if (!hasAnyData()) return;

  const snapshot = exportSnapshot();

  inFlight = (async () => {
    try {
      const res = await fetch('/api/progress/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
      });
      if (!res.ok) {
        console.error('Sign-in merge failed:', await res.text());
        return;
      }
      resetAll();
      emitDataChanged();
    } catch (err) {
      console.error('Sign-in merge errored:', err);
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
