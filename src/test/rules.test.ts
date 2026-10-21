import { COLORS } from '../game/constants';
import { cryptoRng } from '../game/random';
import { initialState } from '../game/reducer';
import { appendColor, checkInput, randomColor, reachedStage } from '../game/rules';
import type { Color } from '../game/types';

describe('randomColor', () => {
  it('maps the RNG value to a color', () => {
    expect(randomColor(() => 0)).toBe('green');
    expect(randomColor(() => 1)).toBe('red');
    expect(randomColor(() => 2)).toBe('yellow');
    expect(randomColor(() => 3)).toBe('blue');
  });

  it('always returns one of the four colors with the crypto RNG', () => {
    for (let i = 0; i < 200; i++) {
      expect(COLORS).toContain(randomColor(cryptoRng));
    }
  });
});

describe('appendColor', () => {
  it('adds exactly one color without changing the original sequence', () => {
    const original: Color[] = ['red', 'red'];
    const next = appendColor(original, () => 3);
    expect(next).toEqual(['red', 'red', 'blue']);
    expect(original).toEqual(['red', 'red']);
  });
});

describe('checkInput', () => {
  const sequence: Color[] = ['green', 'blue'];

  it('detects a correct press that is not the last one', () => {
    expect(checkInput(sequence, 0, 'green')).toBe('correct');
  });

  it('detects completion of the sequence', () => {
    expect(checkInput(sequence, 1, 'blue')).toBe('complete');
    expect(checkInput(['yellow'], 0, 'yellow')).toBe('complete');
  });

  it('detects a wrong press', () => {
    expect(checkInput(sequence, 0, 'red')).toBe('wrong');
  });
});

describe('reachedStage', () => {
  it('is the failed stage (score + 1) on a loss', () => {
    expect(reachedStage({ ...initialState, phase: 'lost', score: 3 })).toBe(4);
    expect(reachedStage({ ...initialState, phase: 'lost', score: 0 })).toBe(1);
  });

  it('is 10 on a win', () => {
    expect(reachedStage({ ...initialState, phase: 'won', score: 10 })).toBe(10);
  });
});
