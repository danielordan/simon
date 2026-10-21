import { TONES } from '../game/constants';
import type { Color } from '../game/types';

const ENVELOPE = 0.01; // seconds, avoids clicks at start/end
const VOLUME = 0.3;

let ctx: AudioContext | null = null;
let current: { osc: OscillatorNode; gain: GainNode } | null = null;

/** Creates or resumes the AudioContext. Must be called from a user gesture. */
export function ensureAudio(): void {
  try {
    if (!ctx) {
      if (typeof AudioContext === 'undefined') return;
      ctx = new AudioContext();
    }
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
  } catch {
    // Audio is optional; the game keeps working visually.
  }
}

export function stopAll(): void {
  if (!current || !ctx) return;
  const { osc, gain } = current;
  current = null;
  try {
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + ENVELOPE);
    osc.stop(now + ENVELOPE);
  } catch {
    // Already stopped.
  }
}

export function playTone(color: Color, ms: number): void {
  if (!ctx) return;
  stopAll();
  try {
    const now = ctx.currentTime;
    const end = now + ms / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = TONES[color];
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(VOLUME, now + ENVELOPE);
    gain.gain.setValueAtTime(VOLUME, end - ENVELOPE);
    gain.gain.linearRampToValueAtTime(0, end);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(end);
    const entry = { osc, gain };
    current = entry;
    osc.onended = () => {
      if (current === entry) current = null;
    };
  } catch {
    // Audio is optional; the game keeps working visually.
  }
}
