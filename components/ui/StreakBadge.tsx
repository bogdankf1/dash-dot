'use client';

interface StreakBadgeProps {
  streak: number;
}

export default function StreakBadge({ streak }: StreakBadgeProps) {
  const isActive = streak > 0;

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${
        isActive
          ? 'bg-amber-50 text-amber-600'
          : 'bg-gray-100 text-gray-400'
      }`}
    >
      <span className="text-base">{isActive ? '\uD83D\uDD25' : '\uD83D\uDD25'}</span>
      <span>{streak}</span>
    </div>
  );
}
