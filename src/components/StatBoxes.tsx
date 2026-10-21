import { TOTAL_STAGES } from '../game/constants';
import { BarsIcon, TrophyIcon } from './icons';

type Props = { stage: number; score: number };

export function StatBoxes({ stage, score }: Props) {
  return (
    <div className="stats">
      <div className="stat-card">
        <BarsIcon className="stat-card__icon" />
        <div className="stat-card__text">
          <span className="stat-card__label">שלב</span>
          <span className="stat-card__value" dir="ltr" data-testid="stage">
            {stage} / {TOTAL_STAGES}
          </span>
        </div>
      </div>
      <div className="stat-card">
        <TrophyIcon className="stat-card__icon" />
        <div className="stat-card__text">
          <span className="stat-card__label">ניקוד</span>
          <span className="stat-card__value" data-testid="score">
            {score}
          </span>
        </div>
      </div>
    </div>
  );
}
