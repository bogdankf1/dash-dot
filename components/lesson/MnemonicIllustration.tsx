'use client';

import { getMnemonics, type MnemonicGuideType } from '@/lib/morse/mnemonics';

interface MnemonicIllustrationProps {
  letter: string;
  guide?: MnemonicGuideType;
}

// ── Shared SVG wrapper props ──
const SVG_PROPS = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

// ── Hello Morse / Google Guide — monochrome SVG illustrations ──
// All use currentColor for a single-color, consistent look.

function ArcherySvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <path d="M32,14 Q12,50 32,86" />
      <line x1="32" y1="14" x2="32" y2="86" strokeWidth={1.5} />
      <line x1="32" y1="50" x2="90" y2="50" />
      <path d="M84,43 L94,50 L84,57" fill="currentColor" stroke="none" />
      <line x1="28" y1="53" x2="24" y2="60" strokeWidth={1.5} />
      <line x1="28" y1="53" x2="32" y2="60" strokeWidth={1.5} />
    </svg>
  );
}

function BanjoSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <circle cx="60" cy="60" r="24" />
      <line x1="60" y1="36" x2="60" y2="8" />
      <line x1="54" y1="10" x2="66" y2="10" strokeWidth={2} />
      <line x1="54" y1="48" x2="54" y2="73" strokeWidth={1} opacity={0.4} />
      <line x1="60" y1="45" x2="60" y2="76" strokeWidth={1} opacity={0.4} />
      <line x1="66" y1="48" x2="66" y2="73" strokeWidth={1} opacity={0.4} />
      <circle cx="60" cy="60" r="4" fill="currentColor" opacity={0.15} stroke="none" />
    </svg>
  );
}

function CandySvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <ellipse cx="60" cy="50" rx="22" ry="16" />
      <path d="M38,42 L24,30" />
      <path d="M38,58 L24,70" />
      <path d="M82,42 L96,30" />
      <path d="M82,58 L96,70" />
      <line x1="50" y1="40" x2="50" y2="60" strokeWidth={1} opacity={0.3} />
      <line x1="60" y1="38" x2="60" y2="62" strokeWidth={1} opacity={0.3} />
      <line x1="70" y1="40" x2="70" y2="60" strokeWidth={1} opacity={0.3} />
    </svg>
  );
}

function DogSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <ellipse cx="52" cy="55" rx="26" ry="18" />
      <circle cx="84" cy="42" r="13" />
      <path d="M76,30 L72,18" />
      <path d="M92,30 L96,18" />
      <circle cx="88" cy="40" r="2" fill="currentColor" stroke="none" />
      <circle cx="95" cy="45" r="2.5" fill="currentColor" stroke="none" />
      <path d="M26,46 Q18,30 22,20" />
      <line x1="38" y1="70" x2="38" y2="84" />
      <line x1="66" y1="70" x2="66" y2="84" />
    </svg>
  );
}

function EyeSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <path d="M12,50 Q60,16 108,50 Q60,84 12,50 Z" />
      <circle cx="60" cy="50" r="16" />
      <circle cx="60" cy="50" r="8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FiretruckSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <rect x="14" y="38" width="56" height="26" rx="3" />
      <rect x="70" y="30" width="28" height="34" rx="3" />
      <line x1="20" y1="33" x2="64" y2="33" strokeWidth={1.5} />
      <line x1="20" y1="38" x2="64" y2="38" strokeWidth={0} />
      <line x1="30" y1="33" x2="30" y2="38" strokeWidth={1} />
      <line x1="42" y1="33" x2="42" y2="38" strokeWidth={1} />
      <line x1="54" y1="33" x2="54" y2="38" strokeWidth={1} />
      <circle cx="32" cy="70" r="7" />
      <circle cx="84" cy="70" r="7" />
      <rect x="80" y="22" width="8" height="8" rx="2" fill="currentColor" opacity={0.25} stroke="none" />
    </svg>
  );
}

function GiraffeSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <ellipse cx="55" cy="70" rx="22" ry="14" />
      <path d="M68,58 Q72,30 66,10" />
      <circle cx="64" cy="10" r="8" />
      <circle cx="67" cy="8" r="1.5" fill="currentColor" stroke="none" />
      <line x1="60" y1="4" x2="56" y2="-2" strokeWidth={1.5} />
      <line x1="68" y1="4" x2="72" y2="-2" strokeWidth={1.5} />
      <circle cx="62" cy="38" r="2" fill="currentColor" opacity={0.2} stroke="none" />
      <circle cx="68" cy="48" r="2.5" fill="currentColor" opacity={0.2} stroke="none" />
      <circle cx="64" cy="26" r="1.5" fill="currentColor" opacity={0.2} stroke="none" />
      <line x1="40" y1="82" x2="40" y2="94" />
      <line x1="70" y1="82" x2="70" y2="94" />
    </svg>
  );
}

function HippoSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <ellipse cx="55" cy="48" rx="30" ry="22" />
      <ellipse cx="90" cy="42" rx="16" ry="14" />
      <circle cx="82" cy="36" r="2" fill="currentColor" stroke="none" />
      <circle cx="96" cy="44" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="92" cy="44" r="1.5" fill="currentColor" stroke="none" />
      <path d="M80,30 Q78,24 82,24" strokeWidth={2} />
      <path d="M90,28 Q88,22 92,22" strokeWidth={2} />
      <line x1="35" y1="68" x2="35" y2="80" />
      <line x1="50" y1="68" x2="50" y2="80" />
      <line x1="60" y1="68" x2="60" y2="80" />
      <line x1="75" y1="66" x2="75" y2="78" />
    </svg>
  );
}

function InsectSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <ellipse cx="60" cy="56" rx="14" ry="18" />
      <circle cx="60" cy="34" r="10" />
      <circle cx="56" cy="32" r="2" fill="currentColor" stroke="none" />
      <circle cx="64" cy="32" r="2" fill="currentColor" stroke="none" />
      <line x1="55" y1="25" x2="48" y2="14" strokeWidth={2} />
      <line x1="65" y1="25" x2="72" y2="14" strokeWidth={2} />
      <circle cx="47" cy="12" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="73" cy="12" r="2.5" fill="currentColor" stroke="none" />
      <line x1="47" y1="50" x2="36" y2="44" strokeWidth={1.5} />
      <line x1="73" y1="50" x2="84" y2="44" strokeWidth={1.5} />
      <line x1="46" y1="60" x2="36" y2="64" strokeWidth={1.5} />
      <line x1="74" y1="60" x2="84" y2="64" strokeWidth={1.5} />
    </svg>
  );
}

function JetSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <path d="M95,50 L40,50 L25,30 L40,50 L25,70" fill="currentColor" opacity={0.1} stroke="none" />
      <path d="M95,50 L40,50 L25,30" />
      <path d="M40,50 L25,70" />
      <line x1="95" y1="50" x2="40" y2="50" />
      <path d="M95,44 L105,50 L95,56" fill="currentColor" stroke="none" />
      <path d="M55,50 L48,38" strokeWidth={1.5} />
      <path d="M55,50 L48,62" strokeWidth={1.5} />
    </svg>
  );
}

function KiteSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <polygon points="60,8 85,40 60,72 35,40" fill="currentColor" opacity={0.08} stroke="currentColor" />
      <line x1="60" y1="8" x2="60" y2="72" strokeWidth={1} opacity={0.4} />
      <line x1="35" y1="40" x2="85" y2="40" strokeWidth={1} opacity={0.4} />
      <path d="M60,72 Q65,82 58,88 Q55,92 62,96" />
      <path d="M54,80 L50,78" strokeWidth={1.5} />
      <path d="M58,90 L54,88" strokeWidth={1.5} />
    </svg>
  );
}

function LaboratorySvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <line x1="50" y1="10" x2="70" y2="10" />
      <line x1="52" y1="10" x2="52" y2="45" strokeWidth={2} />
      <line x1="68" y1="10" x2="68" y2="45" strokeWidth={2} />
      <path d="M52,45 L30,82 Q28,86 32,88 L88,88 Q92,86 90,82 L68,45" />
      <line x1="38" y1="72" x2="82" y2="72" strokeWidth={1} opacity={0.3} />
      <circle cx="50" cy="78" r="2.5" fill="currentColor" opacity={0.2} stroke="none" />
      <circle cx="62" cy="80" r="2" fill="currentColor" opacity={0.2} stroke="none" />
      <circle cx="72" cy="76" r="3" fill="currentColor" opacity={0.2} stroke="none" />
    </svg>
  );
}

function MustacheSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <path d="M18,52 Q32,30 60,46 Q88,30 102,52" />
      <path d="M18,52 Q28,64 42,52" fill="currentColor" opacity={0.1} stroke="currentColor" />
      <path d="M102,52 Q92,64 78,52" fill="currentColor" opacity={0.1} stroke="currentColor" />
      <circle cx="60" cy="44" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function NetSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <line x1="60" y1="8" x2="60" y2="50" />
      <path d="M34,50 Q60,82 86,50" />
      <line x1="34" y1="50" x2="86" y2="50" />
      <line x1="46" y1="52" x2="42" y2="68" strokeWidth={1} opacity={0.4} />
      <line x1="60" y1="52" x2="60" y2="74" strokeWidth={1} opacity={0.4} />
      <line x1="74" y1="52" x2="78" y2="68" strokeWidth={1} opacity={0.4} />
      <line x1="42" y1="60" x2="78" y2="60" strokeWidth={1} opacity={0.4} />
    </svg>
  );
}

function OrchestraSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <ellipse cx="30" cy="62" rx="8" ry="6" fill="currentColor" opacity={0.15} stroke="currentColor" strokeWidth={2} />
      <line x1="38" y1="62" x2="38" y2="20" />
      <path d="M38,20 Q46,22 46,30" strokeWidth={2} />
      <ellipse cx="60" cy="54" rx="8" ry="6" fill="currentColor" opacity={0.15} stroke="currentColor" strokeWidth={2} />
      <line x1="68" y1="54" x2="68" y2="12" />
      <path d="M68,12 Q76,14 76,22" strokeWidth={2} />
      <ellipse cx="90" cy="62" rx="8" ry="6" fill="currentColor" opacity={0.15} stroke="currentColor" strokeWidth={2} />
      <line x1="98" y1="62" x2="98" y2="20" />
      <path d="M98,20 Q106,22 106,30" strokeWidth={2} />
    </svg>
  );
}

function PaddlesSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <circle cx="44" cy="38" r="18" />
      <line x1="44" y1="56" x2="44" y2="88" />
      <circle cx="76" cy="38" r="18" />
      <line x1="76" y1="56" x2="76" y2="88" />
      <circle cx="60" cy="38" r="4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function QuarterbackSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <ellipse cx="60" cy="50" rx="32" ry="18" />
      <line x1="55" y1="40" x2="55" y2="60" strokeWidth={1.5} opacity={0.4} />
      <line x1="60" y1="38" x2="60" y2="62" strokeWidth={1.5} opacity={0.4} />
      <line x1="65" y1="40" x2="65" y2="60" strokeWidth={1.5} opacity={0.4} />
      <line x1="52" y1="42" x2="68" y2="42" strokeWidth={1} opacity={0.3} />
      <line x1="52" y1="50" x2="68" y2="50" strokeWidth={1} opacity={0.3} />
      <line x1="52" y1="58" x2="68" y2="58" strokeWidth={1} opacity={0.3} />
      <path d="M92,50 Q100,38 108,30" strokeWidth={1.5} strokeDasharray="3 3" />
    </svg>
  );
}

function RobotSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <rect x="40" y="24" width="40" height="32" rx="4" />
      <circle cx="52" cy="38" r="5" fill="currentColor" opacity={0.15} stroke="currentColor" strokeWidth={2} />
      <circle cx="68" cy="38" r="5" fill="currentColor" opacity={0.15} stroke="currentColor" strokeWidth={2} />
      <line x1="50" y1="48" x2="70" y2="48" strokeWidth={2} />
      <line x1="60" y1="18" x2="60" y2="24" strokeWidth={2} />
      <circle cx="60" cy="14" r="4" fill="currentColor" opacity={0.15} stroke="currentColor" strokeWidth={2} />
      <rect x="34" y="60" width="16" height="12" rx="3" />
      <rect x="70" y="60" width="16" height="12" rx="3" />
      <line x1="42" y1="72" x2="42" y2="82" />
      <line x1="78" y1="72" x2="78" y2="82" />
    </svg>
  );
}

function SubmarineSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <ellipse cx="60" cy="54" rx="38" ry="18" />
      <rect x="56" y="30" width="8" height="24" rx="3" />
      <line x1="60" y1="30" x2="70" y2="24" strokeWidth={1.5} />
      <circle cx="40" cy="54" r="4" fill="currentColor" opacity={0.15} stroke="currentColor" strokeWidth={1.5} />
      <circle cx="56" cy="54" r="4" fill="currentColor" opacity={0.15} stroke="currentColor" strokeWidth={1.5} />
      <circle cx="72" cy="54" r="4" fill="currentColor" opacity={0.15} stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function TapeSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <circle cx="54" cy="50" r="26" />
      <circle cx="54" cy="50" r="10" />
      <path d="M78,60 L105,76" strokeWidth={2} />
      <line x1="80" y1="50" x2="105" y2="50" strokeWidth={1} opacity={0.3} />
      <circle cx="54" cy="50" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function UnicornSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <ellipse cx="58" cy="58" rx="24" ry="20" />
      <circle cx="54" cy="38" r="16" />
      <path d="M50,24 L46,4" strokeWidth={3} />
      <circle cx="48" cy="36" r="2" fill="currentColor" stroke="none" />
      <path d="M62,28 Q72,26 76,30" strokeWidth={1.5} />
      <path d="M40,44 Q42,48 40,50" strokeWidth={1.5} />
      <line x1="40" y1="76" x2="40" y2="90" />
      <line x1="76" y1="74" x2="76" y2="88" />
    </svg>
  );
}

function VacuumSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <rect x="42" y="14" width="36" height="52" rx="6" />
      <line x1="60" y1="66" x2="60" y2="80" />
      <rect x="44" y="80" width="32" height="8" rx="3" />
      <line x1="52" y1="30" x2="68" y2="30" strokeWidth={1} opacity={0.3} />
      <line x1="52" y1="38" x2="68" y2="38" strokeWidth={1} opacity={0.3} />
      <circle cx="60" cy="50" r="6" fill="currentColor" opacity={0.1} stroke="currentColor" strokeWidth={1.5} />
      <line x1="42" y1="22" x2="32" y2="16" strokeWidth={2} />
    </svg>
  );
}

function WandSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <line x1="32" y1="80" x2="82" y2="24" strokeWidth={3} />
      <polygon points="82,14 86,22 78,22" fill="currentColor" stroke="none" />
      <circle cx="90" cy="16" r="2" fill="currentColor" opacity={0.6} stroke="none" />
      <circle cx="78" cy="10" r="1.5" fill="currentColor" opacity={0.4} stroke="none" />
      <circle cx="92" cy="28" r="1.5" fill="currentColor" opacity={0.4} stroke="none" />
      <line x1="86" y1="10" x2="88" y2="6" strokeWidth={1} opacity={0.5} />
      <line x1="94" y1="22" x2="98" y2="20" strokeWidth={1} opacity={0.5} />
    </svg>
  );
}

function XraySvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <circle cx="60" cy="16" r="10" />
      <line x1="60" y1="26" x2="60" y2="72" />
      <line x1="40" y1="38" x2="80" y2="38" />
      <path d="M48,46 L72,46" strokeWidth={1.5} />
      <path d="M46,52 L74,52" strokeWidth={1.5} />
      <path d="M48,58" strokeWidth={1.5} />
      <line x1="48" y1="58" x2="72" y2="58" strokeWidth={1.5} />
      <line x1="60" y1="72" x2="46" y2="92" />
      <line x1="60" y1="72" x2="74" y2="92" />
      <circle cx="56" cy="14" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="64" cy="14" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YardSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <path d="M30,46 L56,18 L82,46" />
      <rect x="34" y="46" width="44" height="30" rx="1" />
      <rect x="50" y="56" width="12" height="20" rx="1" />
      <rect x="38" y="52" width="8" height="8" rx="1" />
      <rect x="66" y="52" width="8" height="8" rx="1" />
      <line x1="8" y1="76" x2="112" y2="76" />
      <line x1="14" y1="62" x2="14" y2="76" strokeWidth={2} />
      <line x1="22" y1="62" x2="22" y2="76" strokeWidth={2} />
      <line x1="14" y1="64" x2="22" y2="64" strokeWidth={1.5} />
      <line x1="90" y1="62" x2="90" y2="76" strokeWidth={2} />
      <line x1="98" y1="62" x2="98" y2="76" strokeWidth={2} />
      <line x1="106" y1="62" x2="106" y2="76" strokeWidth={2} />
      <line x1="90" y1="64" x2="106" y2="64" strokeWidth={1.5} />
    </svg>
  );
}

function ZebraSvg() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full" {...SVG_PROPS}>
      <ellipse cx="50" cy="52" rx="28" ry="22" />
      <circle cx="86" cy="38" r="14" />
      <path d="M78,26 L74,14" strokeWidth={2} />
      <path d="M94,26 L98,14" strokeWidth={2} />
      <circle cx="90" cy="36" r="2" fill="currentColor" stroke="none" />
      <circle cx="97" cy="42" r="2" fill="currentColor" stroke="none" />
      <path d="M36,36 L42,32" strokeWidth={3} opacity={0.4} />
      <path d="M30,44 L38,40" strokeWidth={3} opacity={0.4} />
      <path d="M28,54 L36,52" strokeWidth={3} opacity={0.4} />
      <path d="M30,64 L38,62" strokeWidth={3} opacity={0.4} />
      <line x1="36" y1="72" x2="36" y2="86" />
      <line x1="64" y1="72" x2="64" y2="86" />
    </svg>
  );
}

const HELLO_MORSE_SVG: Record<string, React.FC> = {
  A: ArcherySvg,
  B: BanjoSvg,
  C: CandySvg,
  D: DogSvg,
  E: EyeSvg,
  F: FiretruckSvg,
  G: GiraffeSvg,
  H: HippoSvg,
  I: InsectSvg,
  J: JetSvg,
  K: KiteSvg,
  L: LaboratorySvg,
  M: MustacheSvg,
  N: NetSvg,
  O: OrchestraSvg,
  P: PaddlesSvg,
  Q: QuarterbackSvg,
  R: RobotSvg,
  S: SubmarineSvg,
  T: TapeSvg,
  U: UnicornSvg,
  V: VacuumSvg,
  W: WandSvg,
  X: XraySvg,
  Y: YardSvg,
  Z: ZebraSvg,
};

export default function MnemonicIllustration({ letter, guide = 'dashdot' }: MnemonicIllustrationProps) {
  const upperLetter = letter.toUpperCase();
  const mnemonics = getMnemonics(guide);
  const mnemonic = mnemonics[upperLetter];

  if (!mnemonic) return null;

  const CustomSVG = guide === 'hello-morse' ? HELLO_MORSE_SVG[upperLetter] : undefined;

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-xs mx-auto">
      <div
        className="w-28 h-24 flex items-center justify-center"
        style={{ color: 'var(--primary)' }}
      >
        {CustomSVG ? (
          <CustomSVG />
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
