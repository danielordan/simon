import { TOTAL_STAGES } from './constants';
import { checkInput } from './rules';
import type { Color, GameState } from './types';

export type GameAction =
  | { type: 'START'; color: Color }
  | { type: 'SHOW_DONE' }
  | { type: 'PRESS'; color: Color }
  | { type: 'SUCCESS_DONE'; color: Color };

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
      // Used for both "Start" and "New game"; sessionBest is kept.
      if (state.phase !== 'idle' && state.phase !== 'won' && state.phase !== 'lost') return state;
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
        const phase = state.sequence.length >= TOTAL_STAGES ? 'won' : 'success';
        return { ...state, score, sessionBest: Math.max(state.sessionBest, score), phase };
      }
      // Sequence and score are kept for the result card.
      return { ...state, phase: 'lost' };
    }

    case 'SUCCESS_DONE':
      if (state.phase !== 'success') return state;
      // The only place a color is added to an existing sequence.
      return { ...state, sequence: [...state.sequence, action.color], inputIndex: 0, phase: 'showing' };
  }
}
