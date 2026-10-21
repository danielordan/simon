import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { ensureAudio, playError, playTone, stopAll } from '../audio/audio';
import { TIMINGS } from '../game/constants';
import { cryptoRng } from '../game/random';
import { gameReducer, initialState, type GameAction } from '../game/reducer';
import { randomColor } from '../game/rules';
import { playSequence } from '../game/scheduler';
import type { Color, Rng } from '../game/types';

type Timer = ReturnType<typeof setTimeout> | null;

export function useGame(rng: Rng = cryptoRng) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [litColor, setLitColor] = useState<Color | null>(null);
  const [errorFlash, setErrorFlash] = useState(false);
  // The result card appears only after the error flash / last press light ends.
  const [resultVisible, setResultVisible] = useState(false);

  // Mirrors the reducer state synchronously so rapid presses are checked against the latest value.
  const stateRef = useRef(state);
  const send = useCallback((action: GameAction) => {
    stateRef.current = gameReducer(stateRef.current, action);
    dispatch(action);
    return stateRef.current;
  }, []);

  // Timers live in refs, not in React state.
  const pressTimer = useRef<Timer>(null);
  const endTimer = useRef<Timer>(null);

  const clearTimer = (timer: { current: Timer }) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => {
    if (state.phase === 'showing') {
      // Generation guard: a late callback from a cancelled playback does nothing.
      let active = true;
      const cancel = playSequence(state.sequence, {
        onLight: (color) => {
          if (!active) return;
          setLitColor(color);
          if (color) playTone(color, TIMINGS.seqOn);
        },
        onDone: () => {
          if (active) send({ type: 'SHOW_DONE' });
        },
      });
      return () => {
        active = false;
        cancel();
        setLitColor(null);
        stopAll();
      };
    }
    if (state.phase === 'success') {
      const timer = setTimeout(() => send({ type: 'SUCCESS_DONE', color: randomColor(rng) }), TIMINGS.successPause);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.sequence, rng, send]);

  useEffect(
    () => () => {
      clearTimer(pressTimer);
      clearTimer(endTimer);
    },
    [],
  );

  /** "Start" and "New game": allowed before a game or once the result card is shown. */
  const start = useCallback(() => {
    const { phase } = stateRef.current;
    if (phase !== 'idle' && !(resultVisible && (phase === 'won' || phase === 'lost'))) return;
    ensureAudio();
    clearTimer(pressTimer);
    clearTimer(endTimer);
    setLitColor(null);
    setErrorFlash(false);
    setResultVisible(false);
    send({ type: 'START', color: randomColor(rng) });
  }, [rng, send, resultVisible]);

  const press = useCallback(
    (color: Color) => {
      if (stateRef.current.phase !== 'input') return;
      ensureAudio();
      // A new press interrupts the light and tone of the previous one.
      clearTimer(pressTimer);
      const { phase } = send({ type: 'PRESS', color });

      if (phase === 'lost') {
        setLitColor(null);
        setErrorFlash(true);
        playError(TIMINGS.errorFlash);
        endTimer.current = setTimeout(() => {
          endTimer.current = null;
          setErrorFlash(false);
          setResultVisible(true);
        }, TIMINGS.errorFlash);
        return;
      }

      setLitColor(color);
      playTone(color, TIMINGS.press);
      pressTimer.current = setTimeout(() => {
        pressTimer.current = null;
        setLitColor(null);
        if (phase === 'won') setResultVisible(true);
      }, TIMINGS.press);
    },
    [send],
  );

  return { state, litColor, errorFlash, resultVisible, start, press };
}
