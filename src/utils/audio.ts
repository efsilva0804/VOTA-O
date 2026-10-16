/**
 * Pure Web Audio API synthesized sounds for stage presentation & voting.
 * Zero external audio file dependencies.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function playVoteChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25, now); // C5
  osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
  osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.28); // C6

  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.65);
}

export function playWinnerFanfare() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [
    { freq: 440, time: 0, duration: 0.18 },      // A4
    { freq: 440, time: 0.2, duration: 0.18 },    // A4
    { freq: 440, time: 0.4, duration: 0.18 },    // A4
    { freq: 587.33, time: 0.6, duration: 0.45 }, // D5
    { freq: 739.99, time: 1.1, duration: 0.3 },  // F#5
    { freq: 880, time: 1.45, duration: 0.9 },    // A5
  ];

  notes.forEach(({ freq, time, duration }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

    gain.gain.setValueAtTime(0.01, ctx.currentTime + time);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + time + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + time);
    osc.stop(ctx.currentTime + time + duration + 0.05);
  });
}

export function playDrumroll(durationSeconds = 2.0) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const count = Math.floor(durationSeconds * 22);

  for (let i = 0; i < count; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const noteTime = now + (i / count) * durationSeconds;
    const progress = i / count;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120 + Math.random() * 40 + progress * 60, noteTime);

    gain.gain.setValueAtTime(0.01, noteTime);
    gain.gain.linearRampToValueAtTime(0.08 + progress * 0.18, noteTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteTime);
    osc.stop(noteTime + 0.06);
  }
}
