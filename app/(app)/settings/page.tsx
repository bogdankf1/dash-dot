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

      {/* Input Mode */}
      <div className="rounded-xl bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]">
        <label className="mb-3 block text-sm font-semibold text-[var(--text-primary)]">
          Input Mode
        </label>
        <div className="space-y-2">
          {[
            { value: 'single' as const, label: 'Single Key', desc: 'Tap/hold spacebar or tap area' },
            { value: 'buttons' as const, label: 'Two Buttons', desc: 'Separate dot and dash buttons' },
            { value: 'both' as const, label: 'Both', desc: 'Tap area + buttons (Recommended)' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setInputMode(option.value)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                inputMode === option.value
                  ? 'bg-indigo-50 ring-1 ring-[var(--primary)]'
                  : 'hover:bg-[var(--background)]'
              }`}
            >
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  inputMode === option.value
                    ? 'border-[var(--primary)]'
                    : 'border-[var(--border)]'
                }`}
              >
                {inputMode === option.value && (
                  <div className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {option.label}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {option.desc}
                </div>
              </div>
            </button>
          ))}
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
    </div>
  );
}
