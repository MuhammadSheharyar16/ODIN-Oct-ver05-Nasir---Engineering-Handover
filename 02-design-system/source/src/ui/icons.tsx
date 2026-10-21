/** Line icons for KPI objects — 1.6px strokes on a 32 grid, inherit colour. */
type P = { className?: string };
const base = {
  viewBox: '0 0 32 32',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export const IconRevenue = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M16 5 4.5 10.5 16 16l11.5-5.5L16 5Z" />
    <path d="m4.5 15.5 11.5 5.5 11.5-5.5" />
    <path d="m4.5 20.5 11.5 5.5 11.5-5.5" />
  </svg>
);

export const IconEntered = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M19 4H9a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10l-6-6Z" />
    <path d="M19 4v6h6" />
    <path d="M11 17h7m-3-3 3 3-3 3" />
  </svg>
);

export const IconApproved = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <circle cx="16" cy="16" r="11.5" />
    <path d="m10.8 16.4 3.6 3.6 7-7.6" />
  </svg>
);

export const IconClosure = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <circle cx="16" cy="16" r="11.5" />
    <path d="M16 4.5A11.5 11.5 0 0 1 27.5 16" />
    <path d="M16 10v6l4 2.5" />
  </svg>
);

export const IconSpark = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M16 3c.9 6.6 3.4 9.1 10 10-6.6.9-9.1 3.4-10 10-.9-6.6-3.4-9.1-10-10 6.6-.9 9.1-3.4 10-10Z" />
  </svg>
);

export const IconMic = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <rect x="12" y="4" width="8" height="15" rx="4" />
    <path d="M7.5 15a8.5 8.5 0 0 0 17 0M16 23.5V28" />
  </svg>
);
