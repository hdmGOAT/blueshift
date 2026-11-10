// Small inline SVG icons. All inherit the current text colour.

export const ExpandIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
    <path d="M7 1h4v4M5 11H1V7M11 1 7 5M1 11l4-4" />
  </svg>
);

export const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M1 1l10 10M11 1 1 11" />
  </svg>
);

export const ChevronIcon = ({ dir }: { dir: "left" | "right" | "down" }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d={dir === "left" ? "M6.5 1.5 3 5l3.5 3.5" : dir === "right" ? "M3.5 1.5 7 5 3.5 8.5" : "M1.5 3.5 5 7l3.5-3.5"} />
  </svg>
);

export const PlusIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M5.5 0v11M0 5.5h11" />
  </svg>
);

export const MinusIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M0 5.5h11" />
  </svg>
);

export const ResetIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
    <path d="M2 6.5a4.5 4.5 0 1 0 1.3-3.2M2 1.5v2.5h2.5" />
  </svg>
);

export const PlayIcon = () => (
  <svg width="11" height="12" viewBox="0 0 11 12" aria-hidden>
    <path d="M1 1.2v9.6a.6.6 0 0 0 .9.5l8.2-4.8a.6.6 0 0 0 0-1L1.9.7a.6.6 0 0 0-.9.5Z" fill="currentColor" />
  </svg>
);

export const PauseIcon = () => (
  <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden>
    <rect width="3" height="12" rx="1" fill="currentColor" />
    <rect x="7" width="3" height="12" rx="1" fill="currentColor" />
  </svg>
);

export const BrandMark = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
    <circle cx="11" cy="11" r="10" fill="none" stroke="var(--accent-text)" strokeWidth="1.5" />
    <path d="M3 12.5c2.2-2 4.4-2 6.6 0s4.4 2 6.6 0 2.9-1.5 2.9-1.5" fill="none" stroke="var(--white)" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/** Panel-layout glyph for the sidebar toggles. */
export const PanelIcon = ({ side, open }: { side: "left" | "right"; open: boolean }) => (
  <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
    <rect x="0.65" y="0.65" width="14.7" height="12.7" rx="2.5" />
    <path d={side === "left" ? "M5.5 1v12" : "M10.5 1v12"} />
    {open && <rect x={side === "left" ? 1.5 : 11} y="1.5" width="3.5" height="11" rx="1" fill="currentColor" stroke="none" opacity="0.5" />}
  </svg>
);
