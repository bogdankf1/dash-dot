'use client';

interface XPBarProps {
  xp: number;
}

export default function XPBar({ xp }: XPBarProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-[var(--primary)]">
      <span className="text-base">⚡</span>
      <span>{xp} XP</span>
    </div>
  );
}
