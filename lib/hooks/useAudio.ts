'use client';

import { useCallback, useRef, useState } from 'react';
import { playMorse, playBeep } from '@/lib/morse/audio';

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [enabled, setEnabled] = useState(true);
  const abortRef = useRef(false);

  const play = useCallback(
    async (pattern: string) => {
      if (!enabled || isPlaying) return;
      abortRef.current = false;
      setIsPlaying(true);
      try {
        await playMorse(pattern, speed);
      } finally {
        setIsPlaying(false);
      }
    },
    [enabled, isPlaying, speed]
  );

  const beep = useCallback(
    async (duration: number) => {
      if (!enabled) return;
      await playBeep(duration);
    },
    [enabled]
  );

  return { play, beep, isPlaying, speed, setSpeed, enabled, setEnabled };
}
