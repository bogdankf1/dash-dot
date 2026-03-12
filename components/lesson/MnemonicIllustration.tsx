'use client';

import { getMnemonics, type MnemonicGuideType } from '@/lib/morse/mnemonics';
import {
  BowArrow,
  Guitar,
  Candy,
  Dog,
  Eye,
  Siren,
  Globe,
  Hammer,
  Bug,
  Plane,
  Key,
  FlaskConical,
  Magnet,
  Compass,
  Music,
  Pizza,
  Target,
  Bot,
  Ship,
  CassetteTape,
  Sparkles,
  Trophy,
  WandSparkles,
  Skull,
  Fence,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface MnemonicIllustrationProps {
  letter: string;
  guide?: MnemonicGuideType;
}

const HELLO_MORSE_ICONS: Record<string, LucideIcon> = {
  A: BowArrow,
  B: Guitar,
  C: Candy,
  D: Dog,
  E: Eye,
  F: Siren,
  G: Globe,
  H: Hammer,
  I: Bug,
  J: Plane,
  K: Key,
  L: FlaskConical,
  M: Magnet,
  N: Compass,
  O: Music,
  P: Pizza,
  Q: Target,
  R: Bot,
  S: Ship,
  T: CassetteTape,
  U: Sparkles,
  V: Trophy,
  W: WandSparkles,
  X: Skull,
  Y: Fence,
  Z: Zap,
};

export default function MnemonicIllustration({ letter, guide = 'dashdot' }: MnemonicIllustrationProps) {
  const upperLetter = letter.toUpperCase();
  const mnemonics = getMnemonics(guide);
  const mnemonic = mnemonics[upperLetter];

  if (!mnemonic) return null;

  const Icon = guide === 'hello-morse' ? HELLO_MORSE_ICONS[upperLetter] : undefined;

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-xs mx-auto">
      <div
        className="w-28 h-24 flex items-center justify-center"
        style={{ color: 'var(--primary)' }}
      >
        {Icon ? (
          <Icon size={56} strokeWidth={1.5} />
        ) : (
          <div className="text-5xl">{mnemonic.emoji}</div>
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {mnemonic.word}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {mnemonic.description}
        </p>
      </div>
    </div>
  );
}
