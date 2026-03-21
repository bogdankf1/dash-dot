'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications } from '@/lib/hooks/useNotifications';

const STORAGE_KEY = 'dashdot-notification-prompted';

export default function NotificationBanner({ lessonCount }: { lessonCount: number }) {
  const [visible, setVisible] = useState(false);
  const { supported, isSubscribed, loading, subscribe } = useNotifications();
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!supported || isSubscribed) return;
    if (lessonCount < 2) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    setVisible(true);
  }, [supported, isSubscribed, loading, lessonCount]);

  const handleEnable = async () => {
    setEnabling(true);
    const ok = await subscribe();
    if (ok) {
      toast.success('Notifications enabled!');
      setVisible(false);
    } else {
      toast.error('Could not enable notifications');
    }
    setEnabling(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (!visible) return null;

  return (
    <div className="mb-4 rounded-xl bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10">
          <Bell size={18} className="text-[var(--primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Never miss a streak!</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Get daily reminders to keep your progress going.</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleEnable}
              disabled={enabling}
              className="cursor-pointer rounded-lg bg-[var(--primary)] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--primary-hover)] active:scale-95 disabled:opacity-50"
            >
              {enabling ? 'Enabling...' : 'Enable'}
            </button>
            <button
              onClick={handleDismiss}
              className="cursor-pointer rounded-lg px-4 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--border)] active:scale-95"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--border)] cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
