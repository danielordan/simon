import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { ensureAudio, playTone, stopAll } from '../audio/audio';
import { TIMINGS } from '../game/constants';
import { cryptoRng } from '../game/random';
import { gameReducer, initialState } from '../game/reducer';
import { randomColor } from '../game/rules';
import { playSequence } from '../game/scheduler';
import type { Color, Rng } from '../game/types';

export function useGame(rng: Rng = cryptoRng) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [litColor, setLitColor] = useState<Color | null>(null);

  // Timers live in refs, not in React state.
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mirrors the phase synchronously so rapid presses are checked against the latest value.
  const phaseRef = useRef(state.phase);
  phaseRef.current = state.phase;

  const clearPressTimer = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
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
          if (active) dispatch({ type: 'SHOW_DONE' });
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
      const timer = setTimeout(() => dispatch({ type: 'SUCCESS_DONE' }), TIMINGS.successPause);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.sequence]);

  useEffect(() => clearPressTimer, []);

  const start = useCallback(() => {
    if (phaseRef.current !== 'idle') return;
    ensureAudio();
    phaseRef.current = 'showing';
    dispatch({ type: 'START', color: randomColor(rng) });
  }, [rng]);

  const press = useCallback((color: Color) => {
    if (phaseRef.current !== 'input') return;
    ensureAudio();
    // A new press interrupts the light and tone of the previous one.
    clearPressTimer();
    setLitColor(color);
    playTone(color, TIMINGS.press);
    pressTimer.current = setTimeout(() => {
      pressTimer.current = null;
      setLitColor(null);
    }, TIMINGS.press);
    dispatch({ type: 'PRESS', color });
  }, []);

  return { state, litColor, start, press };
}
