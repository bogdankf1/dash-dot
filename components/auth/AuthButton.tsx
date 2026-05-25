'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/authStore';
import { createClient } from '@/lib/supabase/client';

export default function AuthButton() {
  const { status } = useAuth();
  const [loading, setLoading] = useState(false);

  if (status !== 'guest') return null;

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
    <button
      type="button"
      onClick={handleSignIn}
      disabled={loading}
      className="cursor-pointer rounded-full bg-[var(--primary)] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--primary-hover)] active:scale-95 disabled:opacity-60"
    >
      {loading ? 'Signing in…' : 'Sign in'}
    </button>
  );
}
