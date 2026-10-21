import { TOTAL_STAGES } from './constants';
import { checkInput } from './rules';
import type { Color, GameState } from './types';

export type GameAction =
  | { type: 'START'; color: Color }
  | { type: 'SHOW_DONE' }
  | { type: 'PRESS'; color: Color }
  | { type: 'SUCCESS_DONE'; color: Color }
  | { type: 'OPEN_ABOUT' }
  | { type: 'CLOSE_ABOUT'; color: Color }
  | { type: 'GO_BACKGROUND' }
  | { type: 'RESUME'; color: Color };

export const initialState: GameState = {
  sequence: [],
  inputIndex: 0,
  score: 0,
  sessionBest: 0,
  phase: 'idle',
  screen: 'home',
  awaitingResume: false,
};

/** success → showing: the only place a color is added to an existing sequence. */
function advanceStage(state: GameState, color: Color): GameState {
  return { ...state, sequence: [...state.sequence, color], inputIndex: 0, phase: 'showing' };
}

// Invalid actions return the same state object, so rapid/duplicate events cause no transition.
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START':
      // Used for both "Start" and "New game"; sessionBest is kept.
      if (state.phase !== 'idle' && state.phase !== 'won' && state.phase !== 'lost') return state;
      return { ...state, sequence: [action.color], inputIndex: 0, score: 0, phase: 'showing', awaitingResume: false };

    case 'SHOW_DONE':
      if (state.phase !== 'showing') return state;
      return { ...state, inputIndex: 0, phase: 'input' };

    case 'PRESS': {
      if (state.phase !== 'input' || state.screen !== 'home') return state;
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
      return advanceStage(state, action.color);

    case 'OPEN_ABOUT':
      if (state.screen !== 'home') return state;
      // The game is kept as is; playback is paused by the hook while the About screen is shown.
      return { ...state, screen: 'about' };

    case 'CLOSE_ABOUT': {
      if (state.screen !== 'about') return state;
      const back: GameState = { ...state, screen: 'home', awaitingResume: false };
      // Leaving during the post-success pause completes the move to the next stage.
      return state.phase === 'success' ? advanceStage(back, action.color) : back;
    }

    case 'GO_BACKGROUND':
      if (state.screen !== 'home' || state.awaitingResume) return state;
      if (state.phase !== 'showing' && state.phase !== 'success') return state;
      return { ...state, awaitingResume: true };

    case 'RESUME': {
      if (!state.awaitingResume) return state;
      const resumed: GameState = { ...state, awaitingResume: false };
      return state.phase === 'success' ? advanceStage(resumed, action.color) : resumed;
    }
  }
}
