'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h2 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">
        Something went wrong
      </h2>
      <p className="mb-6 text-[var(--text-muted)]">
        An unexpected error occurred. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-[var(--primary)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
      >
        Try again
      </button>
    </div>
  );
}
