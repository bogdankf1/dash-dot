'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/authStore';
import AuthButton from '@/components/auth/AuthButton';

export default function TopBar() {
  const pathname = usePathname();
  const { status } = useAuth();

  // Hide on lesson/practice immersive screens.
  if (pathname.startsWith('/lesson/')) return null;

  // Only render when there's something to show (guests get the sign-in button).
  if (status !== 'guest') return null;

  return (
    <div className="mx-auto flex max-w-lg items-center justify-end px-4 pt-3">
      <AuthButton />
    </div>
  );
}
