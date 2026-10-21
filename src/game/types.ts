export type Color = 'green' | 'red' | 'yellow' | 'blue';

export type Phase = 'idle' | 'showing' | 'input' | 'success' | 'lost' | 'won';

export type GameState = {
  sequence: Color[];
  inputIndex: number;
  score: number;
  sessionBest: number;
  phase: Phase;
};

/** Returns an integer in the range 0–3. Injected so tests can use a known sequence. */
export type Rng = () => number;
