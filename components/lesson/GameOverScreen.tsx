'use client';

interface GameOverScreenProps {
  zClassName: string;
  onBack: () => void;
  onRetry: () => void;
}

export default function GameOverScreen({ zClassName, onBack, onRetry }: GameOverScreenProps) {
  return (
    <div className={`fixed inset-0 ${zClassName} flex flex-col items-center justify-center bg-(--background) px-4`}>
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 text-6xl">💔</div>
        <h2 className="mb-2 text-2xl font-bold text-(--text-primary)">
          Out of Lives
        </h2>
        <p className="mb-8 text-(--text-muted)">
          Don&apos;t worry, practice makes perfect!
        </p>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 cursor-pointer rounded-xl bg-(--surface) px-6 py-3 font-medium text-(--text-primary) ring-1 ring-(--border) transition-colors active:scale-95"
          >
            Back
          </button>
          <button
            onClick={onRetry}
            className="flex-1 cursor-pointer rounded-xl bg-(--primary) px-6 py-3 font-medium text-white transition-colors active:scale-95"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
