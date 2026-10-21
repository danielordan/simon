import { act, fireEvent, render, screen } from '@testing-library/react';
import App from '../App';
import { TIMINGS, TONES } from '../game/constants';
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
    expect(screen.getByRole('button', { name: 'התחל' })).toBeInTheDocument();
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

  it('a wrong press returns to Start', () => {
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'התחל' }));
    advance(TIMINGS.leadIn + TIMINGS.seqOn);
    tap(pad('ירוק'));
    expect(playedFrequencies.at(-1)).toBe(TONES.green);
    expect(screen.getByRole('button', { name: 'התחל' })).toBeInTheDocument();
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
