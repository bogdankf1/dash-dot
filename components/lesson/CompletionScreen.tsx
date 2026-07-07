'use client';

import type { ReactNode } from 'react';

interface CompletionScreenProps {
  zClassName: string;
  title: string;
  xpEarned: number;
  correctCount: number;
  totalAnswered: number;
  streakInfo: { continued: boolean; newStreak: number } | null;
  children?: ReactNode;
  onContinue: () => void;
}

export default function CompletionScreen({
  zClassName,
  title,
  xpEarned,
  correctCount,
  totalAnswered,
  streakInfo,
  children,
  onContinue,
}: CompletionScreenProps) {
  const accuracy = totalAnswered > 0 ? correctCount / totalAnswered : 0;
  return (
    <div className={`fixed inset-0 ${zClassName} flex flex-col items-center justify-center bg-(--background) px-4`}>
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 text-6xl">🎉</div>
        <h2 className="mb-2 text-2xl font-bold text-(--text-primary)">
          {title}
        </h2>

        <div className="mb-8 mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-(--surface) p-4 ring-1 ring-(--border)">
            <div className="text-2xl font-bold text-(--primary)">
              +{xpEarned}
            </div>
            <div className="text-xs text-(--text-muted)">XP</div>
          </div>
          <div className="rounded-xl bg-(--surface) p-4 ring-1 ring-(--border)">
            <div className="text-2xl font-bold text-(--success)">
              {Math.round(accuracy * 100)}%
            </div>
            <div className="text-xs text-(--text-muted)">Accuracy</div>
          </div>
          <div className="rounded-xl bg-(--surface) p-4 ring-1 ring-(--border)">
            <div className="text-2xl font-bold text-(--text-primary)">
              {correctCount}/{totalAnswered}
            </div>
            <div className="text-xs text-(--text-muted)">Correct</div>
          </div>
        </div>

        {streakInfo?.continued && (
          <div className="mb-6 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
            <div className="text-3xl mb-1">🔥</div>
            <p className="text-sm font-bold text-amber-700">
              {streakInfo.newStreak}-day streak!
            </p>
            <p className="text-xs text-amber-600">
              Keep it up — come back tomorrow!
            </p>
          </div>
        )}

        {children}

        <button
          onClick={onContinue}
          className="w-full cursor-pointer rounded-xl bg-(--primary) px-6 py-4 font-medium text-white transition-colors hover:bg-(--primary-hover) active:scale-95"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
