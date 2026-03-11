'use client';

import { useState } from 'react';
import MorseDisplay from '@/components/lesson/MorseDisplay';
import MnemonicIllustration from '@/components/lesson/MnemonicIllustration';
import { playMorse } from '@/lib/morse/audio';
import { getMnemonics, type MnemonicGuideType } from '@/lib/morse/mnemonics';

interface LetterRevealProps {
  symbol: string;
  pattern: string;
  mnemonicGuide?: MnemonicGuideType;
}

function patternToReadable(pattern: string): string {
  return pattern
    .split('')
    .map((c) => (c === '.' ? '\u00B7' : '\u2014'))
    .join(' ');
}

export default function LetterReveal({
  symbol,
  pattern,
  mnemonicGuide = 'dashdot',
}: LetterRevealProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlaySound = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      await playMorse(pattern);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div
        className="text-6xl font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        {symbol}
      </div>

      {getMnemonics(mnemonicGuide)[symbol.toUpperCase()] && (
        <MnemonicIllustration letter={symbol} guide={mnemonicGuide} />
      )}

      <MorseDisplay pattern={pattern} size="lg" animated />

      <p
        className="text-2xl font-mono tracking-widest"
        style={{ color: 'var(--text-muted)' }}
      >
        {patternToReadable(pattern)}
      </p>

      <button
        type="button"
        onClick={handlePlaySound}
        disabled={isPlaying}
        className="px-6 py-3 rounded-xl font-medium transition-colors cursor-pointer disabled:opacity-50"
        style={{
          backgroundColor: 'var(--surface)',
          border: '2px solid var(--primary)',
          color: 'var(--primary)',
        }}
      >
        {isPlaying ? 'Playing...' : 'Play Sound'}
      </button>

    </div>
  );
}
