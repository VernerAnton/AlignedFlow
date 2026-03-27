// sounds.js — Web Audio API sound generation for AlignedFlow
// All sounds are synthesized — no external audio files needed.

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(ctx, freq, startTime, duration, type = 'sine', gainValue = 0.3, fadeIn = 0.02, fadeOut = 0.15) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gainValue, startTime + fadeIn);
  gainNode.gain.setValueAtTime(gainValue, startTime + duration - fadeOut);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

// Work session start — bright rising arpeggio (C4 → E4 → G4 → C5)
// Energising, upward movement
export function playWorkSound(muted) {
  if (muted) return;
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const notes = [261.63, 329.63, 392.00, 523.25];
  notes.forEach((freq, i) => {
    playTone(ctx, freq, now + i * 0.10, 0.45, 'sine', 0.28, 0.02, 0.20);
  });
}

// Short break start — soft descending chime (G4 → E4 → C4)
// Calming, downward movement, gentler volume
export function playShortBreakSound(muted) {
  if (muted) return;
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const notes = [392.00, 329.63, 261.63];
  notes.forEach((freq, i) => {
    playTone(ctx, freq, now + i * 0.14, 0.55, 'sine', 0.22, 0.02, 0.30);
  });
}

// Long break start — warm sustained chord (C4 + G4 + E5), triangle wave
// Rich, warm, inviting rest
export function playLongBreakSound(muted) {
  if (muted) return;
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  // Root + fifth + major third up an octave
  const notes = [
    { freq: 261.63, gain: 0.18, type: 'triangle' }, // C4
    { freq: 392.00, gain: 0.15, type: 'triangle' }, // G4
    { freq: 659.25, gain: 0.12, type: 'sine' },     // E5
  ];
  notes.forEach(({ freq, gain, type }) => {
    playTone(ctx, freq, now, 1.4, type, gain, 0.15, 0.60);
  });
  // A gentle shimmering overtone to add warmth
  playTone(ctx, 523.25, now + 0.08, 1.2, 'sine', 0.08, 0.10, 0.60);
}

// Satisfying "done" chime — quick bright ping
export function playDoneSound(muted) {
  if (muted) return;
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playTone(ctx, 880, now, 0.35, 'sine', 0.25, 0.01, 0.25);
  playTone(ctx, 1108.73, now + 0.12, 0.30, 'sine', 0.18, 0.01, 0.25);
}

// Unlock audio context on first user interaction
export function unlockAudio() {
  getAudioContext();
}
