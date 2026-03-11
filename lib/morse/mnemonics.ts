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
  R: { word: 'Robot', emoji: '🤖', description: 'Dot dash dot — a robot beeping' },
  W: { word: 'Wave', emoji: '🌊', description: 'Dot dash dash — a wave rolling in' },
  D: { word: 'Dog', emoji: '🐕', description: 'Dash dot dot — a dog wagging' },
  K: { word: 'Kite', emoji: '🪁', description: 'Dash dot dash — a kite bobbing in wind' },
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
  X: { word: 'X-ray', emoji: '☠️', description: 'Dash dot dot dash — bones revealed' },
  Y: { word: 'Yacht', emoji: '⛵', description: 'Dash dot dash dash — sailing the seas' },
  Z: { word: 'Zebra', emoji: '🦓', description: 'Two dashes, two dots — stripes pattern' },
};

export const HELLO_MORSE_MNEMONICS: Record<string, Mnemonic> = {
  A: { word: 'Archery', emoji: '🏹', description: 'Dot dash — arrow flies from the bow' },
  B: { word: 'Banjo', emoji: '🪕', description: 'Dash dot dot dot — strumming a banjo' },
  C: { word: 'Candy', emoji: '🍬', description: 'Dash dot dash dot — unwrapping candy' },
  D: { word: 'Dog', emoji: '🐕', description: 'Dash dot dot — a dog and its ears' },
  E: { word: 'Eye', emoji: '👁️', description: 'A single dot — a quick blink' },
  F: { word: 'Firetruck', emoji: '🚒', description: 'Dot dot dash dot — siren wailing' },
  G: { word: 'Giraffe', emoji: '🦒', description: 'Dash dash dot — a tall giraffe' },
  H: { word: 'Hippo', emoji: '🦛', description: 'Dot dot dot dot — hippo footsteps' },
  I: { word: 'Insect', emoji: '🐛', description: 'Dot dot — tiny insect antennae' },
  J: { word: 'Jet', emoji: '✈️', description: 'Dot dash dash dash — jet taking off' },
  K: { word: 'Kite', emoji: '🪁', description: 'Dash dot dash — a kite on a string' },
  L: { word: 'Laboratory', emoji: '🔬', description: 'Dot dash dot dot — lab experiments' },
  M: { word: 'Mustache', emoji: '🥸', description: 'Dash dash — a handlebar mustache' },
  N: { word: 'Net', emoji: '🥅', description: 'Dash dot — catching with a net' },
  O: { word: 'Orchestra', emoji: '🎵', description: 'Dash dash dash — the orchestra plays' },
  P: { word: 'Paddles', emoji: '🏓', description: 'Dot dash dash dot — ping pong paddles' },
  Q: { word: 'Quarterback', emoji: '🏈', description: 'Dash dash dot dash — quarterback throws' },
  R: { word: 'Robot', emoji: '🤖', description: 'Dot dash dot — a robot walking' },
  S: { word: 'Submarine', emoji: '🚢', description: 'Dot dot dot — submarine sonar pings' },
  T: { word: 'Tape', emoji: '📼', description: 'A single dash — a strip of tape' },
  U: { word: 'Unicorn', emoji: '🦄', description: 'Dot dot dash — unicorn horn pointing up' },
  V: { word: 'Vacuum', emoji: '🧹', description: 'Dot dot dot dash — vacuum humming' },
  W: { word: 'Wand', emoji: '🪄', description: 'Dot dash dash — a magic wand wave' },
  X: { word: 'X-ray', emoji: '☠️', description: 'Dash dot dot dash — x-ray scan' },
  Y: { word: 'Yard', emoji: '🏡', description: 'Dash dot dash dash — a yard with a fence' },
  Z: { word: 'Zebra', emoji: '🦓', description: 'Dash dash dot dot — zebra stripes' },
};

export function getMnemonics(guide: MnemonicGuideType): Record<string, Mnemonic> {
  return guide === 'hello-morse' ? HELLO_MORSE_MNEMONICS : DASHDOT_MNEMONICS;
}

// Keep backward-compatible default export
export const LETTER_MNEMONICS = DASHDOT_MNEMONICS;
