import { act, fireEvent, render, screen } from '@testing-library/react';
import App from '../App';
import { ERROR_TONE, TIMINGS, TONES } from '../game/constants';
import { playedFrequencies } from './setup';

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

const pad = (name: string) => screen.getByRole('button', { name });

function tap(el: HTMLElement) {
  fireEvent.pointerDown(el, { pointerId: 1, pointerType: 'touch' });
  fireEvent.pointerUp(el, { pointerId: 1, pointerType: 'touch' });
}

// RNG fixed to 3 → the sequence is always blue.
const renderGame = () => render(<App rng={() => 3} />);

beforeEach(() => {
  vi.useFakeTimers();
  playedFrequencies.length = 0;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Home screen', () => {
  it('shows the initial screen in Hebrew', () => {
    renderGame();
    expect(screen.getByRole('heading', { name: 'SIMON' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'אודות' })).toBeInTheDocument();
    expect(screen.getByTestId('stage')).toHaveTextContent('1 / 10');
    expect(screen.getByTestId('score')).toHaveTextContent('0');
    for (const name of ['ירוק', 'אדום', 'צהוב', 'כחול']) expect(pad(name)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'התחל' })).toBeInTheDocument();
  });

  it('keeps the board in a fixed physical (LTR) order', () => {
    renderGame();
    const colors = Array.from(document.querySelectorAll('.board .pad')).map((el) => el.getAttribute('data-color'));
    expect(colors).toEqual(['green', 'red', 'yellow', 'blue']);
    expect(document.querySelector('.board')).toHaveAttribute('dir', 'ltr');
  });
});

describe('Game flow', () => {
  it('plays the sequence, then accepts a correct press and returns to Start', () => {
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'התחל' }));
    expect(screen.getByText('צפה ברצף')).toBeInTheDocument();
    expect(pad('כחול')).toHaveAttribute('data-lit', 'false');

    advance(TIMINGS.leadIn);
    expect(pad('כחול')).toHaveAttribute('data-lit', 'true');
    expect(playedFrequencies).toEqual([TONES.blue]);

    advance(TIMINGS.seqOn);
    expect(pad('כחול')).toHaveAttribute('data-lit', 'false');
    expect(screen.getByText('תורך!')).toBeInTheDocument();

    tap(pad('כחול'));
    expect(screen.getByText('כל הכבוד!')).toBeInTheDocument();
    expect(pad('כחול')).toHaveAttribute('data-lit', 'true');
    expect(playedFrequencies).toEqual([TONES.blue, TONES.blue]);

    advance(TIMINGS.press);
    expect(pad('כחול')).toHaveAttribute('data-lit', 'false');

    advance(TIMINGS.successPause - TIMINGS.press);
    // Stage 2 starts automatically with the same color plus one new one.
    expect(screen.getByText('צפה ברצף')).toBeInTheDocument();
    expect(screen.getByTestId('stage')).toHaveTextContent('2 / 10');
    expect(screen.getByTestId('score')).toHaveTextContent('1');
  });

  it('ignores presses while the sequence is shown', () => {
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'התחל' }));
    advance(TIMINGS.leadIn);
    tap(pad('אדום'));
    tap(pad('כחול'));
    expect(pad('אדום')).toHaveAttribute('data-lit', 'false');
    expect(playedFrequencies).toEqual([TONES.blue]);
    expect(screen.getByText('צפה ברצף')).toBeInTheDocument();

    advance(TIMINGS.seqOn);
    expect(screen.getByText('תורך!')).toBeInTheDocument();
  });

  it('ignores a second finger while the first is still down', () => {
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'התחל' }));
    advance(TIMINGS.leadIn + TIMINGS.seqOn);
    fireEvent.pointerDown(pad('כחול'), { pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerDown(pad('ירוק'), { pointerId: 2, pointerType: 'touch' });
    expect(screen.getByText('כל הכבוד!')).toBeInTheDocument();
    expect(playedFrequencies).toEqual([TONES.blue, TONES.blue]);
  });
});

/** Time from the start of a stage until input is enabled. */
const showTime = (length: number) => TIMINGS.leadIn + length * TIMINGS.seqOn + (length - 1) * TIMINGS.seqGap;

/** Waits for the sequence, then taps blue `length` times (the RNG always gives blue). */
function playStage(length: number) {
  advance(showTime(length));
  expect(screen.getByText('תורך!')).toBeInTheDocument();
  for (let i = 0; i < length; i++) tap(pad('כחול'));
}

function startGame() {
  fireEvent.click(screen.getByRole('button', { name: 'התחל' }));
}

describe('Full game', () => {
  it('advances through stages; partial input does not score', () => {
    renderGame();
    startGame();
    playStage(1);
    advance(TIMINGS.successPause);

    advance(showTime(2));
    tap(pad('כחול'));
    expect(screen.getByText('תורך!')).toBeInTheDocument();
    expect(screen.getByTestId('score')).toHaveTextContent('1');
    tap(pad('כחול'));
    expect(screen.getByText('כל הכבוד!')).toBeInTheDocument();
    expect(screen.getByTestId('score')).toHaveTextContent('2');
    advance(TIMINGS.successPause);
    expect(screen.getByTestId('stage')).toHaveTextContent('3 / 10');
  });

  it('ignores presses while the sequence is shown in later stages', () => {
    renderGame();
    startGame();
    playStage(1);
    advance(TIMINGS.successPause);
    advance(TIMINGS.leadIn);
    tap(pad('ירוק'));
    expect(screen.getByText('צפה ברצף')).toBeInTheDocument();
    expect(pad('ירוק')).toHaveAttribute('data-lit', 'false');
  });

  it('a wrong press plays the error sound, flashes the board, then shows the loss card', () => {
    renderGame();
    startGame();
    playStage(1);
    advance(TIMINGS.successPause);
    playStage(2);
    advance(TIMINGS.successPause);

    advance(showTime(3));
    tap(pad('כחול'));
    tap(pad('ירוק'));
    expect(playedFrequencies.at(-1)).toBe(ERROR_TONE);
    expect(document.querySelector('.board')).toHaveAttribute('data-error', 'true');
    expect(screen.queryByText('אוי לא!')).not.toBeInTheDocument();

    // No second try during the flash.
    tap(pad('כחול'));
    expect(playedFrequencies.at(-1)).toBe(ERROR_TONE);

    advance(TIMINGS.errorFlash);
    expect(screen.getByRole('heading', { name: 'אוי לא!' })).toBeInTheDocument();
    expect(screen.getByText('המשחק הסתיים.')).toBeInTheDocument();
    expect(screen.getByTestId('reached-stage')).toHaveTextContent('3 / 10');
    expect(screen.getByTestId('final-score')).toHaveTextContent('2');
    expect(document.querySelector('.board')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'אודות' })).toHaveLength(2);

    // Nothing keeps playing after the game ended.
    const played = playedFrequencies.length;
    advance(10_000);
    expect(playedFrequencies).toHaveLength(played);
    expect(screen.getByRole('heading', { name: 'אוי לא!' })).toBeInTheDocument();
  });

  it('completing stage 10 shows the win card directly with 10 / 10', () => {
    renderGame();
    startGame();
    for (let stage = 1; stage < 10; stage++) {
      playStage(stage);
      advance(TIMINGS.successPause);
    }
    expect(screen.getByTestId('stage')).toHaveTextContent('10 / 10');
    playStage(10);
    // No intermediate "well done" message.
    expect(screen.queryByText('כל הכבוד!')).not.toBeInTheDocument();
    expect(pad('כחול')).toHaveAttribute('data-lit', 'true');

    advance(TIMINGS.press);
    expect(screen.getByRole('heading', { name: 'כל הכבוד! ניצחת!' })).toBeInTheDocument();
    expect(screen.getByTestId('reached-stage')).toHaveTextContent('10 / 10');
    expect(screen.getByTestId('final-score')).toHaveTextContent('10');

    // No stage 11.
    const played = playedFrequencies.length;
    advance(10_000);
    expect(playedFrequencies).toHaveLength(played);
  });

  it('"New game" starts a fresh game with score 0', () => {
    renderGame();
    startGame();
    playStage(1);
    advance(TIMINGS.successPause);
    advance(showTime(2));
    tap(pad('ירוק'));
    advance(TIMINGS.errorFlash);

    fireEvent.click(screen.getByRole('button', { name: 'משחק חדש' }));
    expect(screen.getByText('צפה ברצף')).toBeInTheDocument();
    expect(screen.getByTestId('stage')).toHaveTextContent('1 / 10');
    expect(screen.getByTestId('score')).toHaveTextContent('0');
    expect(document.querySelector('.board')).toHaveAttribute('data-error', 'false');

    playStage(1);
    expect(screen.getByText('כל הכבוד!')).toBeInTheDocument();
  });
});
