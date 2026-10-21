type IconProps = { className?: string };

export function InfoIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <line x1="12" y1="11" x2="12" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="7.2" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function BarsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <rect x="3" y="13" width="4.5" height="8" rx="1.2" fill="currentColor" />
      <rect x="9.75" y="8" width="4.5" height="13" rx="1.2" fill="currentColor" />
      <rect x="16.5" y="3" width="4.5" height="18" rx="1.2" fill="currentColor" />
    </svg>
  );
}

export function TrophyIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path
        d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.4A5 5 0 0 1 13 14.9V17h3v2.5H8V17h3v-2.1A5 5 0 0 1 8.4 12H8a4 4 0 0 1-4-4V5h3V3Zm-1 4v1a2 2 0 0 0 1.5 1.94A5 5 0 0 1 7 8V7H6Zm12 0h-1v1c0 .67-.17 1.3-.5 1.94A2 2 0 0 0 18 8V7Z"
        fill="currentColor"
      />
      <rect x="6.5" y="20" width="11" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

export function PowerIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M12 3v8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M7.05 6.05a7 7 0 1 0 9.9 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloseCircleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function RestartIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M19.5 3.5v4.5H15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Chevron pointing physically left. */
export function BackIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path d="M15 4.5 7.5 12l7.5 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
