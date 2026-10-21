import type { Phase } from '../game/types';

const MESSAGES: Partial<Record<Phase, string>> = {
  showing: 'צפה ברצף',
  input: 'תורך!',
  success: 'כל הכבוד!',
};

type Props = {
  phase: Phase;
  awaitingResume: boolean;
  onStart: () => void;
  onResume: () => void;
};

export function StatusArea({ phase, awaitingResume, onStart, onResume }: Props) {
  return (
    <div className="status" aria-live="polite">
      {phase === 'idle' ? (
        <button type="button" className="button button--primary" onClick={onStart}>
          התחל
        </button>
      ) : awaitingResume ? (
        <button type="button" className="button button--primary" onClick={onResume}>
          הקש להמשך
        </button>
      ) : (
        <div className="status__message">{MESSAGES[phase]}</div>
      )}
    </div>
  );
}
