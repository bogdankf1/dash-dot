'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { GuideType } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const [guide, setGuide] = useState<GuideType>('google');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [inputMode, setInputMode] = useState<'single' | 'buttons' | 'both'>('both');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const res = await fetch('/api/user');
      const data = await res.json();
      if (data.profile) {
        setGuide(data.profile.selected_guide || 'google');
      }
      // Load local settings
      const localSettings = localStorage.getItem('dashdot-settings');
      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        setAudioEnabled(parsed.audioEnabled ?? true);
        setInputMode(parsed.inputMode ?? 'both');
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);

    // Save guide to server
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selected_guide: guide }),
    });

    // Save local settings (derive mnemonic guide from learning guide)
    const mnemonicGuide = guide === 'google' ? 'hello-morse' : 'dashdot';
    localStorage.setItem(
      'dashdot-settings',
      JSON.stringify({ audioEnabled, inputMode, mnemonicGuide })
    );

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded-xl bg-[var(--border)]" />
        <div className="h-16 animate-pulse rounded-xl bg-[var(--border)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>

      {/* Learning Guide */}
      <div className="rounded-xl bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]">
        <label className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
          Learning Guide
        </label>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          Determines the order you learn letters and which mnemonics are used
        </p>
        <select
          value={guide}
          onChange={(e) => setGuide(e.target.value as GuideType)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)]"
        >
          <option value="google">Google Guide (Recommended)</option>
          <option value="koch">Koch Method</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>

      {/* Input Mode */}
      <div className="rounded-xl bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]">
        <label className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
          Input Mode
        </label>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          How you input dots and dashes during exercises
        </p>
        <select
          value={inputMode}
          onChange={(e) => setInputMode(e.target.value as 'single' | 'buttons' | 'both')}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)]"
        >
          <option value="both">Both — Tap area + buttons (Recommended)</option>
          <option value="buttons">Two Buttons — Separate dot and dash</option>
          <option value="single">Single Key — Tap/hold spacebar or tap area</option>
        </select>
      </div>

      {/* Audio */}
      <div className="rounded-xl bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              Audio
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              Play morse code sounds
            </div>
          </div>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              audioEnabled ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
            }`}
          >
            <div
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                audioEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={saveSettings}
        disabled={saving}
        className="w-full rounded-xl bg-[var(--primary)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>

      {/* Danger Zone */}
      <div className="rounded-xl bg-[var(--surface)] p-4 ring-1 ring-red-200">
        <h3 className="mb-1 text-sm font-semibold text-[var(--error)]">Danger Zone</h3>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          This will permanently delete all your progress, XP, and streak data.
        </p>
        <button
          onClick={() => setShowResetModal(true)}
          className="w-full rounded-xl bg-red-50 px-6 py-3 text-sm font-medium text-[var(--error)] ring-1 ring-red-200 transition-colors hover:bg-red-100"
        >
          Reset All Progress
        </button>
      </div>

      {/* Sign Out */}
      <button
        onClick={async () => {
          const supabase = createClient();
          await supabase.auth.signOut();
          router.push('/login');
        }}
        className="w-full rounded-xl bg-[var(--surface)] px-6 py-3 text-sm font-medium text-[var(--error)] ring-1 ring-[var(--border)]"
      >
        Sign Out
      </button>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--background)] p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)]">Reset All Progress?</h3>
            <p className="mb-6 text-sm text-[var(--text-muted)]">
              This will permanently delete all your lesson history, letter progress, XP, and streak. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                disabled={resetting}
                className="flex-1 rounded-xl bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] ring-1 ring-[var(--border)]"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setResetting(true);
                  await fetch('/api/progress', { method: 'DELETE' });
                  setShowResetModal(false);
                  setResetting(false);
                  router.push('/dashboard');
                }}
                disabled={resetting}
                className="flex-1 rounded-xl bg-[var(--error)] px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
