import { TIMINGS, type Timings } from './constants';
import type { Color } from './types';

type PlaybackHandlers = {
  onLight: (color: Color | null) => void;
  onDone: () => void;
};

/** Plays a sequence with timed lights; returns a function that cancels all pending timers. */
export function playSequence(
  sequence: readonly Color[],
  { onLight, onDone }: PlaybackHandlers,
  timings: Timings = TIMINGS,
): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];
  let at = timings.leadIn;

  sequence.forEach((color) => {
    timers.push(setTimeout(() => onLight(color), at));
    at += timings.seqOn;
    timers.push(setTimeout(() => onLight(null), at));
    at += timings.seqGap;
  });
  // The gap after the last color is not needed before input starts.
  timers.push(setTimeout(onDone, at - timings.seqGap));

  return () => timers.forEach(clearTimeout);
}
