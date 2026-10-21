import type { Color } from './types';

// All durations in milliseconds (DESIGN.md 2.4.1).
export const TIMINGS = {
  leadIn: 700,
  seqOn: 600,
  seqGap: 250,
  press: 300,
  successPause: 1000,
  errorFlash: 600,
} as const;

export type Timings = typeof TIMINGS;

export const COLORS: readonly Color[] = ['green', 'red', 'yellow', 'blue'];

export const TOTAL_STAGES = 10;

// Distinct tone per color, inspired by the original Simon.
export const TONES: Record<Color, number> = {
  green: 415,
  red: 310,
  yellow: 252,
  blue: 209,
};

export const COLOR_LABELS: Record<Color, string> = {
  green: 'ירוק',
  red: 'אדום',
  yellow: 'צהוב',
  blue: 'כחול',
};

// Low, harsh buzz for a wrong press.
export const ERROR_TONE = 110;
