import { COLORS } from './constants';
import type { Color, GameState, Rng } from './types';

export type InputResult = 'correct' | 'complete' | 'wrong';

export function randomColor(rng: Rng): Color {
  return COLORS[rng() % COLORS.length];
}

export function appendColor(sequence: readonly Color[], rng: Rng): Color[] {
  return [...sequence, randomColor(rng)];
}

export function checkInput(sequence: readonly Color[], inputIndex: number, color: Color): InputResult {
  if (sequence[inputIndex] !== color) return 'wrong';
  return inputIndex === sequence.length - 1 ? 'complete' : 'correct';
}

/** Stage shown to the player; stage 1 is shown before the game starts. */
export function currentStage(state: GameState): number {
  return Math.max(1, state.sequence.length);
}
