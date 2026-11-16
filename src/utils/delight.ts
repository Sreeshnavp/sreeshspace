import confetti from 'canvas-confetti';

// Audio Context Singleton for instant zero-latency feedback without external assets
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
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

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('sreeshspace_sound');
  return saved !== 'disabled';
}

export function toggleSound(): boolean {
  const current = isSoundEnabled();
  const next = !current;
  localStorage.setItem('sreeshspace_sound', next ? 'enabled' : 'disabled');
  if (next) {
    playPopSound();
  }
  return next;
}

// Gentle mellow bubble pop sound
export function playPopSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(820, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    // Ignore audio errors
  }
}

// Harmonic triple chime for goal completion
export function playSuccessChime() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const noteStart = now + idx * 0.07;
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.12, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteStart);
      osc.stop(noteStart + 0.3);
    });
  } catch {
    // Ignore audio errors
  }
}

// Confetti & visual delights
export function triggerPartyPop(mode: 'single' | 'grand' | 'stars' = 'single') {
  if (mode === 'grand') {
    playSuccessChime();
    // Epic party cannon from both sides
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      colors: ['#4e876c', '#feeddf', '#f7885e', '#a78dc7', '#fad480'],
    });
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors: ['#4e876c', '#feeddf', '#f7885e', '#a78dc7', '#fad480'],
    });
  } else if (mode === 'stars') {
    playPopSound();
    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.75 },
      shapes: ['star'],
      colors: ['#f59e0b', '#fbbf24', '#fde68a'],
    });
  } else {
    playPopSound();
    confetti({
      particleCount: 28,
      spread: 45,
      origin: { y: 0.8 },
      colors: ['#4e876c', '#f7885e', '#a78dc7', '#fad480'],
    });
  }
}
