export type MnemonicGuideType = 'dashdot' | 'hello-morse';

export interface Mnemonic {
  word: string;
  emoji: string;
  description: string;
}

export const DASHDOT_MNEMONICS: Record<string, Mnemonic> = {
  E: { word: 'Egg', emoji: '🥚', description: 'A single dot, like a small egg' },
  T: { word: 'Tree', emoji: '🌲', description: 'A single dash, like a tall tree trunk' },
  I: { word: 'Icicle', emoji: '🧊', description: 'Two dots, like two drips from an icicle' },
  A: { word: 'Arrow', emoji: '🏹', description: 'Dot dash — an arrow launching forward' },
  N: { word: 'Needle', emoji: '🪡', description: 'Dash dot — a needle with thread' },
  M: { word: 'Mountain', emoji: '🏔️', description: 'Two dashes, like two mountain peaks' },
  S: { word: 'Stars', emoji: '✨', description: 'Three dots, like three twinkling stars' },
  U: { word: 'Umbrella', emoji: '☂️', description: 'Two dots and a dash — rain then shelter' },
  R: { word: 'Rocket', emoji: '🚀', description: 'Spark, blast, spark — ignition sequence' },
  W: { word: 'Wave', emoji: '🌊', description: 'Dot dash dash — a wave rolling in' },
  D: { word: 'Drum', emoji: '🥁', description: 'One big boom, two quick taps' },
  K: { word: 'Kangaroo', emoji: '🦘', description: 'Hop, skip, hop — bounding rhythm' },
  G: { word: 'Gorilla', emoji: '🦍', description: 'Two dashes and a dot — heavy then light' },
  O: { word: 'Ocean', emoji: '🌊', description: 'Three dashes, like rolling ocean waves' },
  H: { word: 'Hearts', emoji: '💕', description: 'Four dots, like tiny heartbeats' },
  B: { word: 'Butterfly', emoji: '🦋', description: 'Dash then three dots — flutter flutter' },
  C: { word: 'Cactus', emoji: '🌵', description: 'Dash dot dash dot — prickly on both sides' },
  F: { word: 'Firefly', emoji: '🪲', description: 'Two dots, dash, dot — flickering light' },
  J: { word: 'Jellyfish', emoji: '🪼', description: 'Dot then three dashes — trailing tentacles' },
  L: { word: 'Lighthouse', emoji: '🗼', description: 'Dot dash dot dot — beacon flashing' },
  P: { word: 'Penguin', emoji: '🐧', description: 'Dot dash dash dot — waddle pattern' },
  Q: { word: 'Queen', emoji: '👑', description: 'Two dashes, dot, dash — royal fanfare' },
  V: { word: 'Violin', emoji: '🎻', description: 'Three dots and a dash — building crescendo' },
  X: { word: 'Xylophone', emoji: '🎶', description: 'Long note, two taps, long note' },
  Y: { word: 'Yacht', emoji: '⛵', description: 'Dash dot dash dash — sailing the seas' },
  Z: { word: 'Zipper', emoji: '🤐', description: 'Two long pulls, two quick clicks' },
};

export const HELLO_MORSE_MNEMONICS: Record<string, Mnemonic> = {
  A: { word: 'Archery', emoji: '🏹', description: 'Arrowhead dot, long shaft dash' },
  B: { word: 'Banjo', emoji: '🪕', description: 'Long neck, three quick finger picks' },
  C: { word: 'Candy', emoji: '🍬', description: 'Twist, unwrap, twist, unwrap' },
  D: { word: 'Dog', emoji: '🐕', description: 'Long howl, two short barks' },
  E: { word: 'Eye', emoji: '👁️', description: 'One quick blink' },
  F: { word: 'Firetruck', emoji: '🚒', description: 'Short-short-long-short siren wail' },
  G: { word: 'Globe', emoji: '🌍', description: 'Two slow spins, one quick stop' },
  H: { word: 'Hammer', emoji: '🔨', description: 'Four quick taps' },
  I: { word: 'Insect', emoji: '🐛', description: 'Two tiny antennae' },
  J: { word: 'Jet', emoji: '✈️', description: 'Short takeoff, three long contrails' },
  K: { word: 'Key', emoji: '🔑', description: 'Turn, click, turn' },
  L: { word: 'Laboratory', emoji: '🔬', description: 'Bubble, fizz, bubble, bubble' },
  M: { word: 'Magnet', emoji: '🧲', description: 'Two strong poles pulling together' },
  N: { word: 'Navigate', emoji: '🧭', description: 'Long voyage, quick arrival' },
  O: { word: 'Orchestra', emoji: '🎵', description: 'Three long, sustained notes' },
  P: { word: 'Pizza', emoji: '🍕', description: 'Slice, two whole pies, slice' },
  Q: { word: 'Quarterback', emoji: '🏈', description: 'Long pass, long pass, catch, throw' },
  R: { word: 'Robot', emoji: '🤖', description: 'Step, stride, step — mechanical walk' },
  S: { word: 'Submarine', emoji: '🚢', description: 'Three sonar pings' },
  T: { word: 'Tape', emoji: '📼', description: 'One long strip' },
  U: { word: 'Unicorn', emoji: '🦄', description: 'Two hoofbeats, then the horn rises' },
  V: { word: 'Victory', emoji: '🏆', description: 'Three tries, one big win' },
  W: { word: 'Wand', emoji: '🪄', description: 'Spark, then two sweeping swooshes' },
  X: { word: 'X-ray', emoji: '☠️', description: 'Scan across, two ribs, scan back' },
  Y: { word: 'Yard', emoji: '🏡', description: 'Post, gap, two long rails' },
  Z: { word: 'Zap', emoji: '⚡', description: 'Two long bolts, two quick sparks' },
};

export function getMnemonics(guide: MnemonicGuideType): Record<string, Mnemonic> {
  return guide === 'hello-morse' ? HELLO_MORSE_MNEMONICS : DASHDOT_MNEMONICS;
}

// Keep backward-compatible default export
export const LETTER_MNEMONICS = DASHDOT_MNEMONICS;
