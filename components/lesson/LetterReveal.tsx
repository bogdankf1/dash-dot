'use client';

import { useState, useEffect } from 'react';
import MorseDisplay from '@/components/lesson/MorseDisplay';
import MnemonicIllustration from '@/components/lesson/MnemonicIllustration';
import { playMorse } from '@/lib/morse/audio';
import { getMnemonics, type MnemonicGuideType } from '@/lib/morse/mnemonics';

interface LetterRevealProps {
  symbol: string;
  pattern: string;
  mnemonicGuide?: MnemonicGuideType;
}

export default function LetterReveal({
  symbol,
  pattern,
  mnemonicGuide = 'dashdot',
}: LetterRevealProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  // For Koch/Alphabetical, hide mnemonics by default (sound-first approach)
  const [showMnemonic, setShowMnemonic] = useState(mnemonicGuide === 'hello-morse');

  useEffect(() => {
    try {
      const settings = localStorage.getItem('dashdot-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        if (parsed.audioEnabled === false) setAudioEnabled(false);
      }
    } catch {}
  }, []);

  const handlePlaySound = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      await playMorse(pattern);
    } finally {
      setIsPlaying(false);
    }
  };

  const handlePlaySlow = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      await playMorse(pattern, 0.5);
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
        showMnemonic ? (
          <MnemonicIllustration letter={symbol} guide={mnemonicGuide} />
        ) : (
          <button
            type="button"
            onClick={() => setShowMnemonic(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
            </svg>
            Show Mnemonic
          </button>
        )
      )}

      <MorseDisplay pattern={pattern} size="lg" animated />

      {audioEnabled && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePlaySound}
            disabled={isPlaying}
            className="flex h-12 w-12 items-center justify-center rounded-full transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: 'var(--primary)', color: '#FFFFFF' }}
            title="Play"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.49 4.49 0 002.5-3.5zM14 3.23v2.06a6.51 6.51 0 010 13.42v2.06A8.51 8.51 0 0014 3.23z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handlePlaySlow}
            disabled={isPlaying}
            className="flex h-12 items-center gap-1 px-3 rounded-full transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--text-muted)' }}
            title="Play slow"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3z" />
            </svg>
            <span className="text-xs font-bold">&frac12;</span>
          </button>
        </div>
      )}

    </div>
  );
}
