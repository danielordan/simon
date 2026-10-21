import type { ReactNode } from 'react';

type Props = {
  title: ReactNode;
  /** Set for the LTR game name "SIMON". */
  titleLtr?: boolean;
  icon: ReactNode;
  iconLabel: string;
  onIconClick: () => void;
};

export function TopBar({ title, titleLtr, icon, iconLabel, onIconClick }: Props) {
  return (
    <header className="top-bar">
      {/* Physically on the left in both RTL and LTR (DESIGN.md 2.5). */}
      <button type="button" className="icon-button top-bar__left" aria-label={iconLabel} onClick={onIconClick}>
        {icon}
      </button>
      <h1 className="top-bar__title" dir={titleLtr ? 'ltr' : undefined}>
        {title}
      </h1>
    </header>
  );
}
