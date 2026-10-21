import { checkInput } from './rules';
import type { Color, GameState } from './types';

export type GameAction =
  | { type: 'START'; color: Color }
  | { type: 'SHOW_DONE' }
  | { type: 'PRESS'; color: Color }
  | { type: 'SUCCESS_DONE' };

export const initialState: GameState = {
  sequence: [],
  inputIndex: 0,
  score: 0,
  sessionBest: 0,
  phase: 'idle',
};

// Invalid actions return the same state object, so rapid/duplicate events cause no transition.
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START':
      if (state.phase !== 'idle') return state;
      return { ...state, sequence: [action.color], inputIndex: 0, score: 0, phase: 'showing' };

    case 'SHOW_DONE':
      if (state.phase !== 'showing') return state;
      return { ...state, inputIndex: 0, phase: 'input' };

    case 'PRESS': {
      if (state.phase !== 'input') return state;
      const result = checkInput(state.sequence, state.inputIndex, action.color);
      if (result === 'correct') return { ...state, inputIndex: state.inputIndex + 1 };
      if (result === 'complete') {
        const score = state.score + 1;
        return { ...state, score, sessionBest: Math.max(state.sessionBest, score), phase: 'success' };
      }
      // Milestone 1: a wrong press simply returns to idle (error flow arrives in Milestone 2).
      return { ...state, phase: 'idle' };
    }

    case 'SUCCESS_DONE':
      if (state.phase !== 'success') return state;
      // Milestone 1: no next stage yet, return to idle.
      return { ...state, phase: 'idle' };
  }
}
