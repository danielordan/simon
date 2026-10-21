import { InfoIcon } from './icons';

export function TopBar() {
  return (
    <header className="top-bar">
      {/* Physically on the left in both RTL and LTR (DESIGN.md 2.5). No action until Milestone 3. */}
      <button type="button" className="icon-button top-bar__left" aria-label="אודות">
        <InfoIcon />
      </button>
      <h1 className="top-bar__title" dir="ltr">
        SIMON
      </h1>
    </header>
  );
}
