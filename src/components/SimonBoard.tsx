import { useRef, type MouseEvent, type PointerEvent } from 'react';
import { COLOR_LABELS } from '../game/constants';
import type { Color } from '../game/types';
import { PowerIcon } from './icons';

// Physical grid order: top-left, top-right, bottom-left, bottom-right.
const BOARD_ORDER: readonly Color[] = ['green', 'red', 'yellow', 'blue'];

type Props = {
  litColor: Color | null;
  errorFlash: boolean;
  inputEnabled: boolean;
  onPress: (color: Color) => void;
};

export function SimonBoard({ litColor, errorFlash, inputEnabled, onPress }: Props) {
  // Only one touch at a time; extra fingers are ignored until it is lifted.
  const activePointer = useRef<number | null>(null);

  const handlePointerDown = (color: Color) => (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (activePointer.current !== null) return;
    e.preventDefault();
    activePointer.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Not supported in every environment.
    }
    onPress(color);
  };

  const releasePointer = (e: PointerEvent<HTMLButtonElement>) => {
    if (activePointer.current === e.pointerId) activePointer.current = null;
  };

  // Keyboard activation (Enter/Space) has detail 0; pointer clicks were handled on pointerdown.
  const handleClick = (color: Color) => (e: MouseEvent<HTMLButtonElement>) => {
    if (e.detail === 0) onPress(color);
  };

  return (
    <div className="board" dir="ltr" data-error={errorFlash}>
      {BOARD_ORDER.map((color) => (
        <button
          key={color}
          type="button"
          className={`pad pad--${color}`}
          data-color={color}
          data-lit={litColor === color}
          aria-label={COLOR_LABELS[color]}
          aria-disabled={!inputEnabled}
          onPointerDown={handlePointerDown(color)}
          onPointerUp={releasePointer}
          onPointerCancel={releasePointer}
          onLostPointerCapture={releasePointer}
          onClick={handleClick(color)}
          onContextMenu={(e) => e.preventDefault()}
        />
      ))}
      <div className="board__disc" aria-hidden="true">
        <PowerIcon className="board__power" />
        <span className="board__name">SIMON</span>
      </div>
    </div>
  );
}
