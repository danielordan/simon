import type { Phase } from '../game/types';

const MESSAGES: Partial<Record<Phase, string>> = {
  showing: 'צפה ברצף',
  input: 'תורך!',
  success: 'כל הכבוד!',
};

type Props = { phase: Phase; onStart: () => void };

export function StatusArea({ phase, onStart }: Props) {
  return (
    <div className="status" aria-live="polite">
      {phase === 'idle' ? (
        <button type="button" className="button button--primary" onClick={onStart}>
          התחל
        </button>
      ) : (
        <div className="status__message">{MESSAGES[phase]}</div>
      )}
    </div>
  );
}
