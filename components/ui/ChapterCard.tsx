'use client';

import type { Chapter } from '@/types';

interface ChapterCardProps {
  chapter: Chapter;
  completion: { total: number; completed: number; unlocked: boolean };
  onClick: () => void;
}

export default function ChapterCard({ chapter, completion, onClick }: ChapterCardProps) {
  const { total, completed, unlocked } = completion;
  const isComplete = completed === total && total > 0;
  const inProgress = completed > 0 && completed < total;
  const progressPct = total > 0 ? (completed / total) * 100 : 0;

  const symbolsDisplay = chapter.symbols.join(', ');
  const truncatedSymbols =
    symbolsDisplay.length > 40 ? symbolsDisplay.slice(0, 37) + '...' : symbolsDisplay;

  if (!unlocked) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 opacity-60 shadow-sm">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-400">{chapter.title}</h3>
          <p className="truncate text-sm text-gray-400">{truncatedSymbols}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-gray-200">
              <div className="h-1.5 rounded-full bg-gray-300" style={{ width: '0%' }} />
            </div>
            <span className="text-xs text-gray-400">{completed}/{total} lessons</span>
          </div>
        </div>
      </div>
    );
  }

  const borderColor = isComplete
    ? 'border-green-200'
    : inProgress
      ? 'border-[var(--primary)]'
      : 'border-[var(--border)]';

  const accentBg = isComplete
    ? 'bg-green-50 text-[var(--success)]'
    : inProgress
      ? 'bg-indigo-50 text-[var(--primary)]'
      : 'bg-gray-100 text-[var(--text-muted)]';

  const barColor = isComplete ? 'bg-[var(--success)]' : 'bg-[var(--primary)]';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-xl border ${borderColor} bg-[var(--surface)] p-4 text-left shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]`}
    >
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${accentBg}`}>
        {isComplete ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <span className="text-sm font-bold">{chapter.index + 1}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-[var(--text-primary)]">{chapter.title}</h3>
        <p className="truncate text-sm text-[var(--text-muted)]">{truncatedSymbols}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-gray-200">
            <div className={`h-1.5 rounded-full ${barColor} transition-all`} style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-xs text-[var(--text-muted)]">{completed}/{total} lessons</span>
        </div>
      </div>
    </button>
  );
}
