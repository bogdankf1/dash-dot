const DOT_DURATION = 80;
const DASH_DURATION = 240;
const SYMBOL_GAP = 80;
const LETTER_GAP = 240;
const WORD_LETTER_GAP = 720; // 3x LETTER_GAP for inter-letter gap in words
const FREQUENCY = 600;

let audioContext: AudioContext | null = null;
let activeTapGain: GainNode | null = null;
let activeTapOsc: OscillatorNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

function stopActiveTap() {
  if (activeTapGain) {
    try { activeTapGain.gain.cancelScheduledValues(0); activeTapGain.gain.setValueAtTime(0, 0); } catch {}
    activeTapGain = null;
  }
  if (activeTapOsc) {
    try { activeTapOsc.stop(); } catch {}
    activeTapOsc = null;
  }
}

export async function playBeep(
  duration: number,
  frequency: number = FREQUENCY,
  tap: boolean = false
): Promise<void> {
  const ctx = getAudioContext();

  if (tap) stopActiveTap();

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.005);
  gainNode.gain.setValueAtTime(0.8, ctx.currentTime + duration / 1000 - 0.005);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  if (tap) {
    activeTapGain = gainNode;
    activeTapOsc = oscillator;
  }

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration / 1000);

  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function playMorse(
  pattern: string,
  speed: number = 1
): Promise<void> {
  const dotMs = DOT_DURATION / speed;
  const dashMs = DASH_DURATION / speed;
  const symbolGapMs = SYMBOL_GAP / speed;
  const letterGapMs = LETTER_GAP / speed;

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];

    if (char === '.') {
      await playBeep(dotMs, FREQUENCY);
    } else if (char === '-') {
      await playBeep(dashMs, FREQUENCY);
    } else if (char === ' ') {
      await sleep(letterGapMs);
      continue;
    } else {
      continue;
    }

    if (i < pattern.length - 1 && pattern[i + 1] !== ' ') {
      await sleep(symbolGapMs);
    }
  }
}

export async function playMorseWord(
  word: string,
  speed: number = 1
): Promise<void> {
  const { MORSE_MAP } = await import('./codes');
  const letters = word.toUpperCase().split('');
  const wordGapMs = WORD_LETTER_GAP / speed;

  for (let i = 0; i < letters.length; i++) {
    const pattern = MORSE_MAP[letters[i]];
    if (pattern) {
      await playMorse(pattern, speed);
    }
    if (i < letters.length - 1) {
      await sleep(wordGapMs);
    }
  }
}
