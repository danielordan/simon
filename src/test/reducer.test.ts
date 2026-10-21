import { gameReducer, initialState } from '../game/reducer';
import type { GameState } from '../game/types';

const showing = gameReducer(initialState, { type: 'START', color: 'yellow' });
const input = gameReducer(showing, { type: 'SHOW_DONE' });

describe('gameReducer', () => {
  it('START creates a sequence of one color and starts showing', () => {
    expect(showing).toMatchObject({ sequence: ['yellow'], inputIndex: 0, score: 0, phase: 'showing' });
  });

  it('ignores presses while showing', () => {
    expect(gameReducer(showing, { type: 'PRESS', color: 'yellow' })).toBe(showing);
  });

  it('ignores START when a game is already running', () => {
    expect(gameReducer(showing, { type: 'START', color: 'red' })).toBe(showing);
  });

  it('SHOW_DONE enables input', () => {
    expect(input.phase).toBe('input');
  });

  it('a correct press completes the stage', () => {
    const next = gameReducer(input, { type: 'PRESS', color: 'yellow' });
    expect(next).toMatchObject({ phase: 'success', score: 1, sessionBest: 1 });
  });

  it('a correct press that is not the last advances the input index', () => {
    const twoColors: GameState = { ...input, sequence: ['red', 'blue'] };
    const next = gameReducer(twoColors, { type: 'PRESS', color: 'red' });
    expect(next).toMatchObject({ phase: 'input', inputIndex: 1, score: 0 });
  });

  it('a wrong press returns to idle', () => {
    expect(gameReducer(input, { type: 'PRESS', color: 'green' }).phase).toBe('idle');
  });

  it('SUCCESS_DONE returns to idle', () => {
    const success = gameReducer(input, { type: 'PRESS', color: 'yellow' });
    expect(gameReducer(success, { type: 'SUCCESS_DONE' }).phase).toBe('idle');
  });
});
