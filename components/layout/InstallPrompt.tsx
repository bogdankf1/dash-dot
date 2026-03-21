'use client';

import { useEffect, useState } from 'react';
import { X, Share, MoreVertical, Plus, Download } from 'lucide-react';

type Platform = 'ios-safari' | 'ios-chrome' | 'android' | 'desktop';

function getPlatform(): Platform | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) {
    return /CriOS/.test(ua) ? 'ios-chrome' : 'ios-safari';
  }
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /FBAN|FBAV|Instagram|Twitter|Line|Snapchat/.test(navigator.userAgent);
}

declare global {
  interface Window {
    __deferredInstallPrompt: BeforeInstallPromptEvent | null;
  }
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [hasNativePrompt, setHasNativePrompt] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (isInAppBrowser()) return;
    if (localStorage.getItem('dashdot-install-dismissed')) return;
    if (sessionStorage.getItem('dashdot-install-closed')) return;

    const detected = getPlatform();
    setPlatform(detected);

    // Check if we captured beforeinstallprompt
    if (window.__deferredInstallPrompt) {
      setHasNativePrompt(true);
    }

    // Listen for it in case it fires later
    const handler = (e: Event) => {
      e.preventDefault();
      window.__deferredInstallPrompt = e as BeforeInstallPromptEvent;
      setHasNativePrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Show after a short delay
    const timer = setTimeout(() => setVisible(true), 3000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem('dashdot-install-closed', 'true');
  };

  const handleDontShowAgain = () => {
    setVisible(false);
    localStorage.setItem('dashdot-install-dismissed', 'true');
  };

  const handleNativeInstall = async () => {
    const prompt = window.__deferredInstallPrompt;
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
      localStorage.setItem('dashdot-install-dismissed', 'true');
    }
    window.__deferredInstallPrompt = null;
    setHasNativePrompt(false);
  };

  if (!visible || !platform) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--background)] p-6 shadow-xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src="/icon-192x192.png" alt="Dash Dot" className="h-12 w-12 rounded-xl" />
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Install Dash Dot</h3>
              <p className="text-xs text-[var(--text-muted)]">Add to your home screen</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface)] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Benefits */}
        <div className="mb-5 rounded-xl bg-[var(--surface)] p-3 ring-1 ring-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Get the full app experience — faster loading, offline access, and push notifications for streak reminders.
          </p>
        </div>

        {/* Platform-specific instructions */}
        {hasNativePrompt ? (
          <button
            onClick={handleNativeInstall}
            className="mb-4 w-full cursor-pointer rounded-xl bg-[var(--primary)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--primary-hover)] active:scale-95 flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Install App
          </button>
        ) : (
          <div className="mb-4 space-y-3">
            {platform === 'ios-safari' && <IOSSteps />}
            {platform === 'ios-chrome' && <IOSChromeSteps />}
            {platform === 'android' && <AndroidSteps />}
            {platform === 'desktop' && <DesktopSteps />}
          </div>
        )}

        {/* Don't show again */}
        <button
          onClick={handleDontShowAgain}
          className="w-full text-center text-xs text-[var(--text-muted)] cursor-pointer hover:underline"
        >
          Don&apos;t show again
        </button>
      </div>
    </div>
  );
}

function Step({ num, icon, text }: { num: number; icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
        {num}
      </div>
      <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
        {icon}
        <span>{text}</span>
      </div>
    </div>
  );
}

function IOSSteps() {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">In Safari</p>
      <Step
        num={1}
        icon={<Share size={16} className="text-[var(--primary)]" />}
        text="Tap the Share button"
      />
      <Step
        num={2}
        icon={<Plus size={16} className="text-[var(--primary)]" />}
        text='Tap "Add to Home Screen"'
      />
      <Step
        num={3}
        icon={null}
        text='Tap "Add" to confirm'
      />
    </div>
  );
}

function IOSChromeSteps() {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">In Chrome</p>
      <Step
        num={1}
        icon={<Share size={16} className="text-[var(--primary)]" />}
        text="Tap the Share button"
      />
      <Step
        num={2}
        icon={<Plus size={16} className="text-[var(--primary)]" />}
        text='Tap "Add to Home Screen"'
      />
      <Step
        num={3}
        icon={null}
        text='Tap "Add" to confirm'
      />
    </div>
  );
}

function AndroidSteps() {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">In Chrome</p>
      <Step
        num={1}
        icon={<MoreVertical size={16} className="text-[var(--primary)]" />}
        text="Tap the menu (three dots)"
      />
      <Step
        num={2}
        icon={<Plus size={16} className="text-[var(--primary)]" />}
        text='Tap "Add to Home Screen"'
      />
      <Step
        num={3}
        icon={null}
        text='Tap "Install" to confirm'
      />
    </div>
  );
}

function DesktopSteps() {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">In Chrome or Edge</p>
      <Step
        num={1}
        icon={<Download size={16} className="text-[var(--primary)]" />}
        text="Click the install icon in the address bar"
      />
      <Step
        num={2}
        icon={null}
        text='Click "Install" to confirm'
      />
    </div>
  );
}
