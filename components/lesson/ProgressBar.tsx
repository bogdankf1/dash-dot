'use client';

interface ProgressBarProps {
  current: number;
  total: number;
  lives: number;
  maxLives?: number;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? 'var(--error)' : 'none'}
      stroke={filled ? 'var(--error)' : 'var(--border)'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function ProgressBar({
  current,
  total,
  lives,
  maxLives = 3,
}: ProgressBarProps) {
  const percent = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3 w-full">
      <div
        className="flex-1 h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percent}%`,
            backgroundColor: 'var(--primary)',
          }}
        />
      </div>
      <div className="flex gap-1">
        {Array.from({ length: maxLives }).map((_, i) => (
          <HeartIcon key={i} filled={i < lives} />
        ))}
      </div>
    </div>
  );
}
