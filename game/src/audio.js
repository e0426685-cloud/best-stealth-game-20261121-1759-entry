// SHADOW VAULT — tiny WebAudio bleeps: a pickup chime, an alarm sting, a
// caught thud and a win arpeggio. Synthesised, no audio files, and silent
// until the first user gesture creates the audio context.

let context = null;
let muted = false;

function ensure() {
  if (context) return context;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
  } catch {
    context = null;
  }
  return context;
}

export function unlockAudio() {
  const ctx = ensure();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(frequency, startAt, duration, type, gainValue) {
  if (muted) return;
  const ctx = ensure();
  if (!ctx) return;
  try {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + startAt);
    gain.gain.exponentialRampToValueAtTime(gainValue, ctx.currentTime + startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startAt + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(ctx.currentTime + startAt);
    oscillator.stop(ctx.currentTime + startAt + duration + 0.05);
  } catch {
    // Audio is decoration; a failure must never break the game.
  }
}

export function playPickup() {
  tone(660, 0, 0.12, 'sine', 0.12);
  tone(990, 0.09, 0.16, 'sine', 0.1);
}

export function playAlarm() {
  tone(220, 0, 0.22, 'sawtooth', 0.08);
  tone(175, 0.2, 0.3, 'sawtooth', 0.08);
}

export function playCaught() {
  tone(140, 0, 0.4, 'triangle', 0.16);
  tone(90, 0.15, 0.5, 'triangle', 0.14);
}

export function playWin() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.12, 0.22, 'sine', 0.1));
}

export function playLevel() {
  [392, 523, 659].forEach((f, i) => tone(f, i * 0.1, 0.18, 'sine', 0.1));
}
