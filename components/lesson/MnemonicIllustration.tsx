'use client';

import { MORSE_MAP } from '@/lib/morse/codes';
import { getMnemonics, type MnemonicGuideType } from '@/lib/morse/mnemonics';
import MorseDisplay from '@/components/lesson/MorseDisplay';

interface MnemonicIllustrationProps {
  letter: string;
  guide?: MnemonicGuideType;
}

function MorseOverlay({ pattern }: { pattern: string }) {
  const symbols = pattern.split('');
  return (
    <g>
      {symbols.map((sym, i) => {
        const x = 60 + i * 22 - (symbols.length * 22) / 2;
        const y = 85;
        if (sym === '.') {
          return <circle key={i} cx={x} cy={y} r={4} fill="var(--primary)" opacity={0.9} />;
        }
        return <rect key={i} x={x - 8} y={y - 4} width={16} height={8} rx={4} fill="var(--primary)" opacity={0.9} />;
      })}
    </g>
  );
}

// ── Dash Dot SVG illustrations ──

function EggSVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <ellipse cx="60" cy="48" rx="22" ry="28" fill="#FDE68A" stroke="#F59E0B" strokeWidth="2" />
      <ellipse cx="54" cy="40" rx="6" ry="8" fill="#FEF3C7" opacity={0.6} />
      <MorseOverlay pattern="." />
    </svg>
  );
}

function TreeSVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <polygon points="60,10 35,55 85,55" fill="#22C55E" stroke="#16A34A" strokeWidth="2" />
      <polygon points="60,25 40,60 80,60" fill="#16A34A" stroke="#15803D" strokeWidth="2" />
      <rect x="55" y="60" width="10" height="15" fill="#92400E" rx="2" />
      <MorseOverlay pattern="-" />
    </svg>
  );
}

function IcicleSVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <rect x="20" y="8" width="80" height="12" fill="#BFDBFE" rx="3" />
      <polygon points="40,20 37,55 43,55" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1" />
      <polygon points="60,20 57,50 63,50" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1" />
      <polygon points="80,20 77,45 83,45" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1" />
      <circle cx="40" cy="58" r="3" fill="#60A5FA" opacity={0.7} />
      <circle cx="60" cy="53" r="3" fill="#60A5FA" opacity={0.7} />
      <MorseOverlay pattern=".." />
    </svg>
  );
}

function ArrowSVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <line x1="25" y1="45" x2="85" y2="45" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
      <polygon points="85,45 72,35 72,55" fill="#EF4444" />
      <line x1="30" y1="50" x2="25" y2="58" stroke="#92400E" strokeWidth="2" />
      <line x1="30" y1="50" x2="35" y2="58" stroke="#92400E" strokeWidth="2" />
      <MorseOverlay pattern=".-" />
    </svg>
  );
}

function NeedleSVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <line x1="30" y1="60" x2="90" y2="20" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="90" cy="20" r="4" fill="none" stroke="#9CA3AF" strokeWidth="2" />
      <path d="M30,60 Q20,65 35,70 Q50,62 30,60" fill="#60A5FA" stroke="#3B82F6" strokeWidth="1" />
      <MorseOverlay pattern="-." />
    </svg>
  );
}

function MountainSVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <polygon points="10,70 40,20 70,70" fill="#6B7280" stroke="#4B5563" strokeWidth="2" />
      <polygon points="50,70 80,25 110,70" fill="#9CA3AF" stroke="#6B7280" strokeWidth="2" />
      <polygon points="35,35 40,20 45,35" fill="white" opacity={0.7} />
      <polygon points="75,40 80,25 85,40" fill="white" opacity={0.7} />
      <MorseOverlay pattern="--" />
    </svg>
  );
}

function StarsSVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      {[
        { cx: 30, cy: 30, r: 6 },
        { cx: 60, cy: 20, r: 8 },
        { cx: 90, cy: 35, r: 5 },
      ].map((star, i) => (
        <g key={i}>
          <polygon
            points={`${star.cx},${star.cy - star.r} ${star.cx + star.r * 0.3},${star.cy - star.r * 0.3} ${star.cx + star.r},${star.cy - star.r * 0.2} ${star.cx + star.r * 0.4},${star.cy + star.r * 0.2} ${star.cx + star.r * 0.6},${star.cy + star.r} ${star.cx},${star.cy + star.r * 0.5} ${star.cx - star.r * 0.6},${star.cy + star.r} ${star.cx - star.r * 0.4},${star.cy + star.r * 0.2} ${star.cx - star.r},${star.cy - star.r * 0.2} ${star.cx - star.r * 0.3},${star.cy - star.r * 0.3}`}
            fill="#FBBF24"
            stroke="#F59E0B"
            strokeWidth="1"
          />
        </g>
      ))}
      <MorseOverlay pattern="..." />
    </svg>
  );
}

function UmbrellaSVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <path d="M30,45 Q60,10 90,45" fill="#8B5CF6" stroke="#7C3AED" strokeWidth="2" />
      <line x1="60" y1="45" x2="60" y2="75" stroke="#6B7280" strokeWidth="3" />
      <path d="M60,75 Q55,80 50,75" fill="none" stroke="#6B7280" strokeWidth="3" strokeLinecap="round" />
      <circle cx="35" cy="55" r="2" fill="#60A5FA" opacity={0.6} />
      <circle cx="45" cy="60" r="2" fill="#60A5FA" opacity={0.6} />
      <MorseOverlay pattern="..-" />
    </svg>
  );
}

function RobotSVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <rect x="40" y="25" width="40" height="35" rx="5" fill="#9CA3AF" stroke="#6B7280" strokeWidth="2" />
      <circle cx="52" cy="40" r="5" fill="#22D3EE" />
      <circle cx="68" cy="40" r="5" fill="#22D3EE" />
      <rect x="50" y="50" width="20" height="4" rx="2" fill="#6B7280" />
      <line x1="60" y1="20" x2="60" y2="25" stroke="#6B7280" strokeWidth="2" />
      <circle cx="60" cy="17" r="3" fill="#F59E0B" />
      <rect x="35" y="62" width="15" height="10" rx="3" fill="#9CA3AF" stroke="#6B7280" strokeWidth="1" />
      <rect x="70" y="62" width="15" height="10" rx="3" fill="#9CA3AF" stroke="#6B7280" strokeWidth="1" />
      <MorseOverlay pattern=".-." />
    </svg>
  );
}

function WaveSVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <path d="M10,50 Q30,25 50,50 Q70,75 90,50 Q100,38 110,50" fill="none" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
      <path d="M10,60 Q30,40 50,60 Q70,80 90,60 Q100,50 110,60" fill="none" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" opacity={0.6} />
      <path d="M10,70 Q30,55 50,70 Q70,85 90,70" fill="none" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" opacity={0.4} />
      <MorseOverlay pattern=".--" />
    </svg>
  );
}

const DASHDOT_SVG: Record<string, React.FC> = {
  E: EggSVG,
  T: TreeSVG,
  I: IcicleSVG,
  A: ArrowSVG,
  N: NeedleSVG,
  M: MountainSVG,
  S: StarsSVG,
  U: UmbrellaSVG,
  R: RobotSVG,
  W: WaveSVG,
};

// ── Hello Morse SVG illustrations ──

function EyeSVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <ellipse cx="60" cy="45" rx="35" ry="22" fill="white" stroke="#6B7280" strokeWidth="2" />
      <circle cx="60" cy="45" r="14" fill="#60A5FA" />
      <circle cx="60" cy="45" r="7" fill="#1E3A5F" />
      <circle cx="55" cy="40" r="3" fill="white" opacity={0.8} />
      <MorseOverlay pattern="." />
    </svg>
  );
}

function TapeSVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <rect x="15" y="30" width="90" height="30" rx="4" fill="#9CA3AF" stroke="#6B7280" strokeWidth="2" />
      <rect x="20" y="35" width="80" height="20" rx="2" fill="#D1D5DB" />
      <line x1="40" y1="35" x2="40" y2="55" stroke="#9CA3AF" strokeWidth="1" opacity={0.5} />
      <line x1="60" y1="35" x2="60" y2="55" stroke="#9CA3AF" strokeWidth="1" opacity={0.5} />
      <line x1="80" y1="35" x2="80" y2="55" stroke="#9CA3AF" strokeWidth="1" opacity={0.5} />
      <MorseOverlay pattern="-" />
    </svg>
  );
}

function ArcherySVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <path d="M30,15 Q15,45 30,75" fill="none" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
      <line x1="30" y1="15" x2="30" y2="75" stroke="#D1D5DB" strokeWidth="1.5" />
      <line x1="30" y1="45" x2="90" y2="45" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" />
      <polygon points="90,45 82,39 82,51" fill="#EF4444" />
      <MorseOverlay pattern=".-" />
    </svg>
  );
}

function NetSVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <line x1="60" y1="10" x2="60" y2="50" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
      <path d="M35,50 Q60,75 85,50" fill="none" stroke="#6B7280" strokeWidth="2" />
      <line x1="35" y1="50" x2="85" y2="50" stroke="#6B7280" strokeWidth="2" />
      <line x1="47" y1="50" x2="44" y2="65" stroke="#6B7280" strokeWidth="1" opacity={0.6} />
      <line x1="60" y1="50" x2="60" y2="70" stroke="#6B7280" strokeWidth="1" opacity={0.6} />
      <line x1="73" y1="50" x2="76" y2="65" stroke="#6B7280" strokeWidth="1" opacity={0.6} />
      <MorseOverlay pattern="-." />
    </svg>
  );
}

function MustacheSVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <path d="M20,50 Q35,30 60,45 Q85,30 100,50" fill="#4B3621" stroke="#3B2710" strokeWidth="2" />
      <path d="M20,50 Q30,60 45,50" fill="#4B3621" />
      <path d="M100,50 Q90,60 75,50" fill="#4B3621" />
      <circle cx="60" cy="42" r="2" fill="#4B3621" />
      <MorseOverlay pattern="--" />
    </svg>
  );
}

function SubmarineSVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <ellipse cx="60" cy="50" rx="35" ry="16" fill="#6B7280" stroke="#4B5563" strokeWidth="2" />
      <rect x="55" y="30" width="10" height="20" rx="3" fill="#9CA3AF" stroke="#6B7280" strokeWidth="1.5" />
      <circle cx="45" cy="50" r="4" fill="#22D3EE" opacity={0.8} />
      <circle cx="60" cy="50" r="4" fill="#22D3EE" opacity={0.8} />
      <circle cx="75" cy="50" r="4" fill="#22D3EE" opacity={0.8} />
      <MorseOverlay pattern="..." />
    </svg>
  );
}

function UnicornSVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <ellipse cx="60" cy="55" rx="22" ry="18" fill="white" stroke="#D1D5DB" strokeWidth="2" />
      <circle cx="55" cy="42" r="14" fill="white" stroke="#D1D5DB" strokeWidth="2" />
      <polygon points="55,15 52,28 58,28" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1" />
      <circle cx="50" cy="40" r="2.5" fill="#1E3A5F" />
      <path d="M60,45 Q62,47 60,48" fill="none" stroke="#F9A8D4" strokeWidth="1.5" />
      <MorseOverlay pattern="..-" />
    </svg>
  );
}

function HmRobotSVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <rect x="40" y="25" width="40" height="35" rx="5" fill="#9CA3AF" stroke="#6B7280" strokeWidth="2" />
      <circle cx="52" cy="40" r="5" fill="#22D3EE" />
      <circle cx="68" cy="40" r="5" fill="#22D3EE" />
      <rect x="50" y="50" width="20" height="4" rx="2" fill="#6B7280" />
      <line x1="60" y1="20" x2="60" y2="25" stroke="#6B7280" strokeWidth="2" />
      <circle cx="60" cy="17" r="3" fill="#F59E0B" />
      <rect x="35" y="62" width="15" height="10" rx="3" fill="#9CA3AF" stroke="#6B7280" strokeWidth="1" />
      <rect x="70" y="62" width="15" height="10" rx="3" fill="#9CA3AF" stroke="#6B7280" strokeWidth="1" />
      <MorseOverlay pattern=".-." />
    </svg>
  );
}

function InsectSVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <ellipse cx="60" cy="50" rx="12" ry="16" fill="#84CC16" stroke="#65A30D" strokeWidth="2" />
      <circle cx="60" cy="32" r="8" fill="#84CC16" stroke="#65A30D" strokeWidth="2" />
      <circle cx="56" cy="30" r="2" fill="#1E3A5F" />
      <circle cx="64" cy="30" r="2" fill="#1E3A5F" />
      <line x1="56" y1="24" x2="50" y2="15" stroke="#65A30D" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="64" y1="24" x2="70" y2="15" stroke="#65A30D" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="49" cy="14" r="2" fill="#65A30D" />
      <circle cx="71" cy="14" r="2" fill="#65A30D" />
      <line x1="48" y1="45" x2="38" y2="40" stroke="#65A30D" strokeWidth="1.5" />
      <line x1="72" y1="45" x2="82" y2="40" stroke="#65A30D" strokeWidth="1.5" />
      <line x1="48" y1="55" x2="38" y2="58" stroke="#65A30D" strokeWidth="1.5" />
      <line x1="72" y1="55" x2="82" y2="58" stroke="#65A30D" strokeWidth="1.5" />
      <MorseOverlay pattern=".." />
    </svg>
  );
}

function WandSVG() {
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <line x1="35" y1="70" x2="85" y2="20" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />
      <polygon points="85,12 88,20 82,20" fill="#FBBF24" />
      {[
        { cx: 92, cy: 15, r: 2 },
        { cx: 80, cy: 10, r: 1.5 },
        { cx: 95, cy: 25, r: 1.5 },
      ].map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#FBBF24" opacity={0.8} />
      ))}
      <MorseOverlay pattern=".--" />
    </svg>
  );
}

const HELLO_MORSE_SVG: Record<string, React.FC> = {
  E: EyeSVG,
  T: TapeSVG,
  A: ArcherySVG,
  N: NetSVG,
  M: MustacheSVG,
  S: SubmarineSVG,
  U: UnicornSVG,
  R: HmRobotSVG,
  I: InsectSVG,
  W: WandSVG,
};

export default function MnemonicIllustration({ letter, guide = 'dashdot' }: MnemonicIllustrationProps) {
  const upperLetter = letter.toUpperCase();
  const mnemonics = getMnemonics(guide);
  const mnemonic = mnemonics[upperLetter];
  const pattern = MORSE_MAP[upperLetter];

  if (!mnemonic || !pattern) return null;

  const svgMap = guide === 'hello-morse' ? HELLO_MORSE_SVG : DASHDOT_SVG;
  const CustomSVG = svgMap[upperLetter];

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-xs mx-auto">
      <div className="w-28 h-24 flex items-center justify-center">
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
      {!CustomSVG && (
        <MorseDisplay pattern={pattern} size="sm" />
      )}
    </div>
  );
}
