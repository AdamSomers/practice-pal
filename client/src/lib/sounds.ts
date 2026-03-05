let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

interface SoundVariant {
  frequency: number;
  type: OscillatorType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  gain: number;
}

const checkSounds: SoundVariant[] = [
  { frequency: 880, type: 'sine', attack: 0.01, decay: 0.08, sustain: 0.3, release: 0.15, gain: 0.25 },
  { frequency: 1047, type: 'sine', attack: 0.01, decay: 0.06, sustain: 0.2, release: 0.12, gain: 0.22 },
  { frequency: 784, type: 'triangle', attack: 0.01, decay: 0.1, sustain: 0.25, release: 0.18, gain: 0.28 },
  { frequency: 988, type: 'sine', attack: 0.005, decay: 0.07, sustain: 0.2, release: 0.1, gain: 0.2 },
  { frequency: 1175, type: 'sine', attack: 0.01, decay: 0.05, sustain: 0.15, release: 0.1, gain: 0.18 },
  { frequency: 659, type: 'triangle', attack: 0.01, decay: 0.12, sustain: 0.3, release: 0.2, gain: 0.3 },
  { frequency: 1319, type: 'sine', attack: 0.005, decay: 0.04, sustain: 0.1, release: 0.08, gain: 0.15 },
  { frequency: 740, type: 'sine', attack: 0.01, decay: 0.09, sustain: 0.25, release: 0.15, gain: 0.25 },
  { frequency: 1109, type: 'triangle', attack: 0.01, decay: 0.06, sustain: 0.2, release: 0.12, gain: 0.2 },
  { frequency: 831, type: 'sine', attack: 0.01, decay: 0.08, sustain: 0.2, release: 0.14, gain: 0.22 },
  { frequency: 1397, type: 'sine', attack: 0.005, decay: 0.04, sustain: 0.1, release: 0.08, gain: 0.14 },
  { frequency: 698, type: 'triangle', attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.18, gain: 0.28 },
];

function playSound(variant: SoundVariant) {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = variant.type;
  oscillator.frequency.setValueAtTime(variant.frequency, now);

  // ADSR envelope
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(variant.gain, now + variant.attack);
  gainNode.gain.linearRampToValueAtTime(
    variant.gain * variant.sustain,
    now + variant.attack + variant.decay
  );
  gainNode.gain.linearRampToValueAtTime(
    0,
    now + variant.attack + variant.decay + variant.release
  );

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + variant.attack + variant.decay + variant.release + 0.01);
}

export function playCheckSound() {
  const variant = checkSounds[Math.floor(Math.random() * checkSounds.length)];
  playSound(variant);
}

export function playUncheckSound() {
  // Silent on uncheck per spec
}

export function initAudio() {
  getAudioContext();
}
