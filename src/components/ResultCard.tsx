import { TOTAL_STAGES } from '../game/constants';
import { BarsIcon, CloseCircleIcon, RestartIcon, TrophyIcon } from './icons';

type Props = {
  won: boolean;
  stage: number;
  score: number;
  onNewGame: () => void;
};

export function ResultCard({ won, stage, score, onNewGame }: Props) {
  return (
    <section className={`result-card result-card--${won ? 'won' : 'lost'}`} aria-live="polite">
      <div className="result-card__icon">{won ? <TrophyIcon /> : <CloseCircleIcon />}</div>
      <h2 className="result-card__title">{won ? 'כל הכבוד! ניצחת!' : 'אוי לא!'}</h2>
      {!won && <p className="result-card__text">המשחק הסתיים.</p>}

      <div className="result-card__stats">
        <div className="stat-card">
          <BarsIcon className="stat-card__icon" />
          <div className="stat-card__text">
            <span className="stat-card__label">השלב שהושג</span>
            <span className="stat-card__value" dir="ltr" data-testid="reached-stage">
              {stage} / {TOTAL_STAGES}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <TrophyIcon className="stat-card__icon" />
          <div className="stat-card__text">
            <span className="stat-card__label">הניקוד הסופי</span>
            <span className="stat-card__value" data-testid="final-score">
              {score}
            </span>
          </div>
        </div>
      </div>

      <div className="result-card__actions">
        <button type="button" className={`button ${won ? 'button--primary' : 'button--danger'}`} onClick={onNewGame}>
          <RestartIcon />
          משחק חדש
        </button>
        {/* No action until the About screen is built in Milestone 3. */}
        <button type="button" className="button button--secondary">
          אודות
        </button>
      </div>
    </section>
  );
}
