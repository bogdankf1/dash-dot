'use client';

import { useEffect } from 'react';
import { unlockAudio } from '@/lib/morse/audio';

export default function AudioUnlock() {
  useEffect(() => {
    const handler = () => {
      unlockAudio();
      // Only need to unlock once
      window.removeEventListener('touchstart', handler);
      window.removeEventListener('click', handler);
    };
    window.addEventListener('touchstart', handler, { once: true });
    window.addEventListener('click', handler, { once: true });
    return () => {
      window.removeEventListener('touchstart', handler);
      window.removeEventListener('click', handler);
    };
  }, []);

  return null;
}
