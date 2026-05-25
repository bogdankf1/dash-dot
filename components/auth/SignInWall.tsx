'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SignInWall({ title, description }: { title: string; description: string }) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-2xl">
        🔒
      </div>
      <h2 className="mb-2 text-xl font-bold text-[var(--text-primary)]">{title}</h2>
      <p className="mb-6 max-w-xs text-sm text-[var(--text-muted)]">{description}</p>
      <button
        type="button"
        onClick={handleSignIn}
        disabled={loading}
        className="cursor-pointer rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)] active:scale-95 disabled:opacity-60"
      >
        {loading ? 'Signing in…' : 'Sign in to continue'}
      </button>
    </div>
  );
}
