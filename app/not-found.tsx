import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h2 className="mb-2 text-2xl font-bold text-(--text-primary)">
        Page not found
      </h2>
      <p className="mb-6 text-(--text-muted)">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/dashboard"
        className="rounded-xl bg-(--primary) px-6 py-3 font-medium text-white transition-colors hover:bg-(--primary-hover)"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
