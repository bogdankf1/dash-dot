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
  G: { word: 'Giraffe', emoji: '🦒', description: 'Two tall neck segments, small head' },
  H: { word: 'Hippo', emoji: '🦛', description: 'Four stubby footsteps' },
  I: { word: 'Insect', emoji: '🐛', description: 'Two tiny antennae' },
  J: { word: 'Jet', emoji: '✈️', description: 'Short takeoff, three long contrails' },
  K: { word: 'Kite', emoji: '🪁', description: 'Pull, release, pull the string' },
  L: { word: 'Laboratory', emoji: '🔬', description: 'Bubble, fizz, bubble, bubble' },
  M: { word: 'Mustache', emoji: '🥸', description: 'Two sweeping handlebar sides' },
  N: { word: 'Net', emoji: '🥅', description: 'Long handle, round catch' },
  O: { word: 'Orchestra', emoji: '🎵', description: 'Three long, sustained notes' },
  P: { word: 'Paddles', emoji: '🏓', description: 'Ping, pong-pong, ping' },
  Q: { word: 'Quarterback', emoji: '🏈', description: 'Hut-hut, hike, throw long' },
  R: { word: 'Robot', emoji: '🤖', description: 'Step, stride, step — mechanical walk' },
  S: { word: 'Submarine', emoji: '🚢', description: 'Three sonar pings' },
  T: { word: 'Tape', emoji: '📼', description: 'One long strip' },
  U: { word: 'Unicorn', emoji: '🦄', description: 'Two hoofbeats, then the horn rises' },
  V: { word: 'Vacuum', emoji: '🧹', description: 'Three short pushes, one long pull' },
  W: { word: 'Wand', emoji: '🪄', description: 'Spark, then two sweeping swooshes' },
  X: { word: 'X-ray', emoji: '☠️', description: 'Scan across, two ribs, scan back' },
  Y: { word: 'Yard', emoji: '🏡', description: 'Fence, gap, two long stretches' },
  Z: { word: 'Zebra', emoji: '🦓', description: 'Two long stripes, two short stripes' },
};

export function getMnemonics(guide: MnemonicGuideType): Record<string, Mnemonic> {
  return guide === 'hello-morse' ? HELLO_MORSE_MNEMONICS : DASHDOT_MNEMONICS;
}

// Keep backward-compatible default export
export const LETTER_MNEMONICS = DASHDOT_MNEMONICS;
