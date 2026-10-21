import { BackIcon, BarsIcon, TrophyIcon } from './icons';
import { TopBar } from './TopBar';

const STEPS = [
  'צפה ברצף הצבעים שמוצג.',
  'כשמופיעה ההודעה ״תורך!״, לחץ על הצבעים באותו סדר.',
  'בכל שלב נוסף צבע חדש לרצף.',
  'נסה להשלים את כל 10 השלבים!',
];

type Props = {
  score: number;
  sessionBest: number;
  onBack: () => void;
};

export function AboutScreen({ score, sessionBest, onBack }: Props) {
  return (
    <>
      <TopBar title="אודות" icon={<BackIcon />} iconLabel="חזרה למשחק" onIconClick={onBack} />
      <main className="about">
        <div className="about__intro">
          <h2 className="about__title" dir="ltr">
            SIMON
          </h2>
          <p className="about__subtitle">בדוק את הזיכרון שלך!</p>
        </div>

        <section className="info-card">
          <p className="info-card__text">משחק זיכרון קלאסי שבו עליך לשחזר רצף הולך וגדל של צבעים.</p>
        </section>

        <section className="info-card">
          <h3 className="info-card__title">איך משחקים?</h3>
          <ol className="steps">
            {STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <div className="stats">
          <div className="stat-card">
            <BarsIcon className="stat-card__icon" />
            <div className="stat-card__text">
              <span className="stat-card__label">הניקוד הנוכחי</span>
              <span className="stat-card__value" data-testid="about-score">
                {score}
              </span>
            </div>
          </div>
          <div className="stat-card">
            <TrophyIcon className="stat-card__icon" />
            <div className="stat-card__text">
              <span className="stat-card__label">שיא הניקוד בסשן זה</span>
              <span className="stat-card__value" data-testid="about-best">
                {sessionBest}
              </span>
            </div>
          </div>
        </div>

        <button type="button" className="button button--primary about__back" onClick={onBack}>
          חזרה למשחק
        </button>
      </main>
    </>
  );
}
