import { COLORS, TOTAL_STAGES } from '../game/constants';
import { gameReducer, initialState } from '../game/reducer';
import type { Color, GameState } from '../game/types';

const showing = gameReducer(initialState, { type: 'START', color: 'yellow' });
const input = gameReducer(showing, { type: 'SHOW_DONE' });

/** Plays the whole current sequence correctly. */
function completeStage(state: GameState): GameState {
  let next = gameReducer(state, { type: 'SHOW_DONE' });
  for (const color of next.sequence) next = gameReducer(next, { type: 'PRESS', color });
  return next;
}

/** Plays a full game up to (and including) the given stage, using a cycle of colors. */
function playUntil(stage: number): GameState {
  let state = gameReducer(initialState, { type: 'START', color: COLORS[0] });
  for (let n = 1; n < stage; n++) {
    state = completeStage(state);
    state = gameReducer(state, { type: 'SUCCESS_DONE', color: COLORS[n % 4] });
  }
  return state;
}

describe('gameReducer', () => {
  it('START creates a sequence of one color and starts showing', () => {
    expect(showing).toMatchObject({ sequence: ['yellow'], inputIndex: 0, score: 0, phase: 'showing' });
  });

  it('ignores presses while showing', () => {
    expect(gameReducer(showing, { type: 'PRESS', color: 'yellow' })).toBe(showing);
  });

  it('ignores START when a game is already running', () => {
    expect(gameReducer(showing, { type: 'START', color: 'red' })).toBe(showing);
    expect(gameReducer(input, { type: 'START', color: 'red' })).toBe(input);
  });

  it('SHOW_DONE enables input', () => {
    expect(input.phase).toBe('input');
  });

  it('a correct press that is not the last advances the input index without scoring', () => {
    const twoColors: GameState = { ...input, sequence: ['red', 'blue'] };
    const next = gameReducer(twoColors, { type: 'PRESS', color: 'red' });
    expect(next).toMatchObject({ phase: 'input', inputIndex: 1, score: 0 });
  });

  it('completing a stage adds one point and goes to success', () => {
    const next = gameReducer(input, { type: 'PRESS', color: 'yellow' });
    expect(next).toMatchObject({ phase: 'success', score: 1, sessionBest: 1 });
  });

  it('SUCCESS_DONE adds exactly one color and keeps the previous sequence', () => {
    const success = gameReducer(input, { type: 'PRESS', color: 'yellow' });
    const next = gameReducer(success, { type: 'SUCCESS_DONE', color: 'green' });
    expect(next).toMatchObject({ sequence: ['yellow', 'green'], inputIndex: 0, score: 1, phase: 'showing' });
  });

  it('the sequence length equals the stage number at every stage', () => {
    const seen: Color[][] = [];
    let state = gameReducer(initialState, { type: 'START', color: COLORS[0] });
    for (let stage = 1; stage <= TOTAL_STAGES; stage++) {
      expect(state.sequence).toHaveLength(stage);
      expect(state.score).toBe(stage - 1);
      // The previous sequence is a prefix of the current one.
      if (seen.length) expect(state.sequence.slice(0, -1)).toEqual(seen.at(-1));
      seen.push(state.sequence);
      state = completeStage(state);
      if (stage < TOTAL_STAGES) state = gameReducer(state, { type: 'SUCCESS_DONE', color: COLORS[stage % 4] });
    }
  });

  it('completing stage 10 wins with 10 points and no stage 11', () => {
    const won = completeStage(playUntil(TOTAL_STAGES));
    expect(won).toMatchObject({ phase: 'won', score: 10, sessionBest: 10 });
    expect(won.sequence).toHaveLength(TOTAL_STAGES);
    expect(gameReducer(won, { type: 'SUCCESS_DONE', color: 'red' })).toBe(won);
  });

  it('a wrong press at any stage ends the game immediately', () => {
    for (const stage of [1, 4, 10]) {
      let state = gameReducer(playUntil(stage), { type: 'SHOW_DONE' });
      const wrong = COLORS.find((c) => c !== state.sequence[0])!;
      state = gameReducer(state, { type: 'PRESS', color: wrong });
      expect(state).toMatchObject({ phase: 'lost', score: stage - 1 });
      // No second try.
      expect(gameReducer(state, { type: 'PRESS', color: state.sequence[0] })).toBe(state);
    }
  });

  it('START after a game resets score and sequence but keeps the session best', () => {
    let lost = gameReducer(playUntil(4), { type: 'SHOW_DONE' });
    lost = gameReducer(lost, { type: 'PRESS', color: COLORS.find((c) => c !== lost.sequence[0])! });
    expect(lost.sessionBest).toBe(3);

    const fresh = gameReducer(lost, { type: 'START', color: 'blue' });
    expect(fresh).toMatchObject({ sequence: ['blue'], inputIndex: 0, score: 0, sessionBest: 3, phase: 'showing' });

    // A lower score does not lower the session best.
    const lostAgain = gameReducer(gameReducer(fresh, { type: 'SHOW_DONE' }), { type: 'PRESS', color: 'red' });
    expect(lostAgain).toMatchObject({ phase: 'lost', score: 0, sessionBest: 3 });

    // A won game raises it.
    const won = completeStage(playUntil(TOTAL_STAGES));
    expect(gameReducer(won, { type: 'START', color: 'red' })).toMatchObject({ score: 0, sessionBest: 10 });
  });
});

describe('navigation and pause', () => {
  const success = gameReducer(input, { type: 'PRESS', color: 'yellow' });
  const twoColorInput: GameState = { ...input, sequence: ['red', 'blue'], inputIndex: 1, score: 3, sessionBest: 5 };

  it('OPEN_ABOUT / CLOSE_ABOUT keep the game while showing or during input', () => {
    for (const state of [showing, twoColorInput]) {
      const about = gameReducer(state, { type: 'OPEN_ABOUT' });
      expect(about).toEqual({ ...state, screen: 'about' });
      expect(gameReducer(about, { type: 'CLOSE_ABOUT', color: 'green' })).toEqual(state);
    }
  });

  it('CLOSE_ABOUT during the success pause adds exactly one color', () => {
    const about = gameReducer(success, { type: 'OPEN_ABOUT' });
    expect(about.sequence).toEqual(['yellow']);
    expect(gameReducer(about, { type: 'CLOSE_ABOUT', color: 'red' })).toMatchObject({
      screen: 'home',
      phase: 'showing',
      sequence: ['yellow', 'red'],
      inputIndex: 0,
      score: 1,
      sessionBest: 1,
    });
  });

  it('CLOSE_ABOUT before a game or after it ends changes only the screen', () => {
    const lost = gameReducer(input, { type: 'PRESS', color: 'red' });
    for (const state of [initialState, lost]) {
      const back = gameReducer(gameReducer(state, { type: 'OPEN_ABOUT' }), { type: 'CLOSE_ABOUT', color: 'blue' });
      expect(back).toEqual(state);
    }
  });

  it('presses are ignored while the About screen is open', () => {
    const about = gameReducer(input, { type: 'OPEN_ABOUT' });
    expect(gameReducer(about, { type: 'PRESS', color: 'yellow' })).toBe(about);
  });

  it('GO_BACKGROUND waits for "tap to continue" only while showing or in the success pause', () => {
    expect(gameReducer(showing, { type: 'GO_BACKGROUND' }).awaitingResume).toBe(true);
    expect(gameReducer(success, { type: 'GO_BACKGROUND' }).awaitingResume).toBe(true);
    expect(gameReducer(input, { type: 'GO_BACKGROUND' })).toBe(input);
    expect(gameReducer(initialState, { type: 'GO_BACKGROUND' })).toBe(initialState);
    const about = gameReducer(showing, { type: 'OPEN_ABOUT' });
    expect(gameReducer(about, { type: 'GO_BACKGROUND' })).toBe(about);
  });

  it('RESUME replays the same sequence while showing and adds one color after success', () => {
    const waitingShow = gameReducer(showing, { type: 'GO_BACKGROUND' });
    expect(gameReducer(waitingShow, { type: 'RESUME', color: 'red' })).toEqual(showing);

    const waitingSuccess = gameReducer(success, { type: 'GO_BACKGROUND' });
    expect(gameReducer(waitingSuccess, { type: 'RESUME', color: 'red' })).toMatchObject({
      awaitingResume: false,
      phase: 'showing',
      sequence: ['yellow', 'red'],
    });
    expect(gameReducer(showing, { type: 'RESUME', color: 'red' })).toBe(showing);
  });

  it('closing About also clears a pending "tap to continue"', () => {
    const waiting = gameReducer(showing, { type: 'GO_BACKGROUND' });
    const back = gameReducer(gameReducer(waiting, { type: 'OPEN_ABOUT' }), { type: 'CLOSE_ABOUT', color: 'red' });
    expect(back).toEqual(showing);
  });
});
