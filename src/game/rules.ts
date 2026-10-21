import { COLORS, TOTAL_STAGES } from './constants';
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

/** Stage shown on the result card: the failed stage on a loss, all stages on a win. */
export function reachedStage(state: GameState): number {
  return state.phase === 'won' ? TOTAL_STAGES : state.score + 1;
}
