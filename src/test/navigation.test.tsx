import { act, fireEvent, render, screen } from '@testing-library/react';
import App from '../App';
import { COLORS, COLOR_LABELS, ERROR_TONE, TIMINGS, TONES } from '../game/constants';
import type { Color } from '../game/types';
import { playedFrequencies } from './setup';

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

const button = (name: string) => screen.getByRole('button', { name });
const pad = (color: Color) => screen.getByRole('button', { name: COLOR_LABELS[color] });

function tap(color: Color) {
  const el = pad(color);
  fireEvent.pointerDown(el, { pointerId: 1, pointerType: 'touch' });
  fireEvent.pointerUp(el, { pointerId: 1, pointerType: 'touch' });
}

const toneColor = (frequency: number) => COLORS.find((c) => TONES[c] === frequency)!;

/** Time from the start of a stage until input is enabled. */
const showTime = (length: number) => TIMINGS.leadIn + length * TIMINGS.seqOn + (length - 1) * TIMINGS.seqGap;

// Cycling RNG: green, red, yellow, blue, green, ...
function renderGame() {
  let i = 0;
  return render(<App rng={() => i++ % 4} />);
}

/** Watches a whole sequence of the given length and returns the colors that were played. */
function watch(length: number): Color[] {
  const before = playedFrequencies.length;
  advance(showTime(length));
  expect(screen.getByText('תורך!')).toBeInTheDocument();
  const played = playedFrequencies.slice(before).map(toneColor);
  expect(played).toHaveLength(length);
  return played;
}

/** Starts a game and completes stages until the given stage starts. Returns the last completed sequence. */
function reachStage(stage: number): Color[] {
  fireEvent.click(button('התחל'));
  let sequence: Color[] = [];
  for (let n = 1; n < stage; n++) {
    sequence = watch(n);
    sequence.forEach(tap);
    advance(TIMINGS.successPause);
  }
  return sequence;
}

function setVisibility(state: 'hidden' | 'visible') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

const openAbout = () => fireEvent.click(screen.getAllByRole('button', { name: 'אודות' })[0]);
const backButton = () => screen.getAllByRole('button', { name: 'חזרה למשחק' });
const isAbout = () => screen.queryByText('איך משחקים?') !== null;
const isHome = () => document.querySelector('.home') !== null;

beforeEach(() => {
  vi.useFakeTimers();
  playedFrequencies.length = 0;
});

afterEach(() => {
  setVisibility('visible');
  vi.useRealTimers();
});

describe('About screen', () => {
  it('shows all its content and returns to the start view', () => {
    renderGame();
    openAbout();
    expect(isHome()).toBe(false);
    expect(screen.getByRole('heading', { name: 'אודות' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'SIMON' })).toBeInTheDocument();
    expect(screen.getByText('בדוק את הזיכרון שלך!')).toBeInTheDocument();
    expect(screen.getByText(/משחק זיכרון קלאסי/)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText('הניקוד הנוכחי')).toBeInTheDocument();
    expect(screen.getByText('שיא הניקוד בסשן זה')).toBeInTheDocument();
    expect(screen.getByTestId('about-score')).toHaveTextContent('0');
    expect(screen.getByTestId('about-best')).toHaveTextContent('0');
    // The top-bar arrow and the wide button both go back.
    expect(backButton()).toHaveLength(2);

    fireEvent.click(backButton()[1]);
    expect(isAbout()).toBe(false);
    expect(button('התחל')).toBeInTheDocument();

    openAbout();
    fireEvent.click(backButton()[0]);
    expect(button('התחל')).toBeInTheDocument();
  });

  it('opens from the result card and returns to it with the final score', () => {
    renderGame();
    reachStage(3);
    advance(showTime(3));
    tap('blue'); // first color is green
    advance(TIMINGS.errorFlash);
    expect(screen.getByRole('heading', { name: 'אוי לא!' })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'אודות' })[1]);
    expect(isAbout()).toBe(true);
    expect(screen.getByTestId('about-score')).toHaveTextContent('2');
    expect(screen.getByTestId('about-best')).toHaveTextContent('2');

    fireEvent.click(backButton()[1]);
    expect(screen.getByRole('heading', { name: 'אוי לא!' })).toBeInTheDocument();
    expect(screen.getByTestId('final-score')).toHaveTextContent('2');
  });

  it('leaving while the sequence is shown stops it; coming back replays the same sequence from the start', () => {
    renderGame();
    const previous = reachStage(3);
    advance(TIMINGS.leadIn + TIMINGS.seqOn); // first color shown
    const before = playedFrequencies.length;
    const firstShown = toneColor(playedFrequencies[before - 1]);
    openAbout();
    advance(10_000);
    expect(playedFrequencies).toHaveLength(before);

    fireEvent.click(backButton()[1]);
    expect(screen.getByText('צפה ברצף')).toBeInTheDocument();
    expect(screen.getByTestId('stage')).toHaveTextContent('3 / 10');
    // Presses are still blocked.
    tap('green');
    expect(playedFrequencies).toHaveLength(before);

    // Same sequence from its first color, with no new color added.
    const replay = watch(3);
    expect(replay[0]).toBe(firstShown);
    expect(replay.slice(0, 2)).toEqual(previous);
    replay.forEach(tap);
    expect(screen.getByText('כל הכבוד!')).toBeInTheDocument();
    expect(screen.getByTestId('score')).toHaveTextContent('3');
  });

  it('leaving during input keeps the input position, sequence and score', () => {
    renderGame();
    reachStage(2);
    const sequence = watch(2);
    tap(sequence[0]);
    openAbout();
    expect(screen.getByTestId('about-score')).toHaveTextContent('1');
    advance(5_000);
    const before = playedFrequencies.length;
    fireEvent.click(backButton()[1]);
    expect(screen.getByText('תורך!')).toBeInTheDocument();
    advance(5_000);
    // The sequence is not shown again.
    expect(playedFrequencies).toHaveLength(before);

    tap(sequence[1]);
    expect(screen.getByText('כל הכבוד!')).toBeInTheDocument();
    expect(screen.getByTestId('score')).toHaveTextContent('2');
  });

  it('leaving in the pause after "well done" starts the next stage with exactly one new color', () => {
    renderGame();
    reachStage(2);
    const sequence = watch(2);
    sequence.forEach(tap);
    expect(screen.getByText('כל הכבוד!')).toBeInTheDocument();
    openAbout();
    advance(10_000);
    fireEvent.click(backButton()[1]);
    expect(screen.getByTestId('stage')).toHaveTextContent('3 / 10');
    expect(screen.getByText('צפה ברצף')).toBeInTheDocument();

    const next = watch(3);
    expect(next.slice(0, 2)).toEqual(sequence);
    // The old pause timer did not add another color.
    next.forEach(tap);
    advance(TIMINGS.successPause);
    expect(screen.getByTestId('stage')).toHaveTextContent('4 / 10');
  });

  it('leaving during the error flash shows the loss card on return, without another error sound', () => {
    renderGame();
    reachStage(1);
    const [color] = watch(1);
    tap(COLORS.find((c) => c !== color)!);
    expect(playedFrequencies.at(-1)).toBe(ERROR_TONE);
    const errors = playedFrequencies.filter((f) => f === ERROR_TONE).length;
    openAbout();
    fireEvent.click(backButton()[1]);
    expect(screen.getByRole('heading', { name: 'אוי לא!' })).toBeInTheDocument();
    advance(5_000);
    expect(playedFrequencies.filter((f) => f === ERROR_TONE)).toHaveLength(errors);
  });

  it('returning does not start a new game or change the session best', () => {
    renderGame();
    reachStage(3);
    openAbout();
    expect(screen.getByTestId('about-score')).toHaveTextContent('2');
    expect(screen.getByTestId('about-best')).toHaveTextContent('2');
    fireEvent.click(backButton()[1]);
    openAbout();
    expect(screen.getByTestId('about-best')).toHaveTextContent('2');
    fireEvent.click(backButton()[1]);
    expect(screen.getByTestId('stage')).toHaveTextContent('3 / 10');
    expect(screen.getByTestId('score')).toHaveTextContent('2');
  });
});

describe('Background', () => {
  it('mid-sequence: stops, shows "tap to continue", then replays from the start with sound', () => {
    renderGame();
    reachStage(2);
    advance(TIMINGS.leadIn + 100);
    const before = playedFrequencies.length;
    setVisibility('hidden');
    advance(10_000);
    expect(playedFrequencies).toHaveLength(before);
    expect(document.querySelector('[data-lit="true"]')).toBeNull();

    setVisibility('visible');
    expect(button('הקש להמשך')).toBeInTheDocument();
    advance(10_000);
    expect(playedFrequencies).toHaveLength(before);
    // The board stays blocked.
    tap('green');
    expect(playedFrequencies).toHaveLength(before);

    fireEvent.click(button('הקש להמשך'));
    expect(screen.queryByRole('button', { name: 'הקש להמשך' })).not.toBeInTheDocument();
    expect(screen.getByText('צפה ברצף')).toBeInTheDocument();
    expect(screen.getByTestId('stage')).toHaveTextContent('2 / 10');
    const replay = watch(2);
    replay.forEach(tap);
    expect(screen.getByText('כל הכבוד!')).toBeInTheDocument();
  });

  it('in the pause after "well done": "tap to continue" adds one color and shows the new sequence', () => {
    renderGame();
    reachStage(1);
    watch(1).forEach(tap);
    setVisibility('hidden');
    advance(10_000);
    setVisibility('visible');
    expect(screen.getByTestId('stage')).toHaveTextContent('1 / 10');
    fireEvent.click(button('הקש להמשך'));
    expect(screen.getByTestId('stage')).toHaveTextContent('2 / 10');
    watch(2);
  });

  it('during input: no "tap to continue", input continues', () => {
    renderGame();
    reachStage(2);
    const sequence = watch(2);
    tap(sequence[0]);
    setVisibility('hidden');
    setVisibility('visible');
    expect(screen.queryByRole('button', { name: 'הקש להמשך' })).not.toBeInTheDocument();
    expect(screen.getByText('תורך!')).toBeInTheDocument();
    tap(sequence[1]);
    expect(screen.getByText('כל הכבוד!')).toBeInTheDocument();
  });

  it('during the error flash: the loss card is shown on return', () => {
    renderGame();
    reachStage(1);
    const [color] = watch(1);
    tap(COLORS.find((c) => c !== color)!);
    setVisibility('hidden');
    setVisibility('visible');
    expect(screen.getByRole('heading', { name: 'אוי לא!' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'הקש להמשך' })).not.toBeInTheDocument();
  });

  it('while About is open: About stays, without "tap to continue"', () => {
    renderGame();
    reachStage(2);
    advance(TIMINGS.leadIn);
    openAbout();
    setVisibility('hidden');
    advance(10_000);
    setVisibility('visible');
    expect(isAbout()).toBe(true);
    fireEvent.click(backButton()[1]);
    expect(screen.queryByRole('button', { name: 'הקש להמשך' })).not.toBeInTheDocument();
    expect(screen.getByText('צפה ברצף')).toBeInTheDocument();
    watch(2);
  });
});

describe('Screens', () => {
  it('only one of the two screens is shown at a time; game over stays on the game screen', () => {
    renderGame();
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(isHome()).toBe(true);
    openAbout();
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(isHome()).toBe(false);
    fireEvent.click(backButton()[1]);
    reachStage(1);
    const [color] = watch(1);
    tap(COLORS.find((c) => c !== color)!);
    advance(TIMINGS.errorFlash);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(isHome()).toBe(true);
    expect(screen.getByRole('heading', { name: 'SIMON' })).toBeInTheDocument();
  });
});
