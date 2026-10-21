import type { ReactNode } from 'react';

/**
 * Line icons for the online journey v2 jars (48 × 48 grid, 2.4 stroke, round
 * caps). Drawn white; the jar's colour and glow come from CSS.
 */
export type JarIcon = 'home' | 'submit' | 'card' | 'review' | 'upload' | 'bank' | 'mail' | 'calendar' | 'finger' | 'check' | 'cross';

const P: Record<JarIcon, ReactNode> = {
  home: (
    <>
      <path d="M8 22.5 24 9l16 13.5" />
      <path d="M12.5 19.5V38a1.5 1.5 0 0 0 1.5 1.5h20a1.5 1.5 0 0 0 1.5-1.5V19.5" />
      <path d="M20 39.5V29.5a1.5 1.5 0 0 1 1.5-1.5h5a1.5 1.5 0 0 1 1.5 1.5v10" />
    </>
  ),
  submit: (
    <>
      <path d="M27 40H13a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h14l8 8v8" />
      <path d="M27 8v8h8" />
      <path d="M16.5 20h11M16.5 26h8M16.5 32h5" />
      <circle cx="34.5" cy="34.5" r="7.5" />
      <path d="M34.5 38.5v-8M31 33.5l3.5-3.5 3.5 3.5" />
    </>
  ),
  card: (
    <>
      <rect x="6.5" y="12" width="35" height="24" rx="3.5" />
      <path d="M6.5 19h35" />
      <path d="M12 29h7M24 29h4" />
    </>
  ),
  review: (
    <>
      <path d="M24 40H13a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h14l8 8v4" />
      <path d="M27 8v8h8" />
      <path d="M16.5 20h10M16.5 26h6" />
      <circle cx="31" cy="31" r="6.5" />
      <path d="m35.8 35.8 5 5" />
    </>
  ),
  upload: (
    <>
      <path d="M15 34h-1.5a8.5 8.5 0 0 1-1-16.9A11 11 0 0 1 33.6 15a8 8 0 0 1 1.9 19H33" />
      <path d="M24 40V24.5M18.5 30 24 24.5 29.5 30" />
    </>
  ),
  bank: (
    <>
      <path d="M7 18 24 8.5 41 18Z" />
      <path d="M11.5 22v12M18.5 22v12M29.5 22v12M36.5 22v12" />
      <path d="M8 38.5h32M6 42h36" />
      <circle cx="24" cy="14.5" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  mail: (
    <>
      <rect x="6.5" y="11.5" width="35" height="25" rx="3.5" />
      <path d="m8 14 16 12 16-12" />
      <path d="m8 34.5 11.5-10M40 34.5l-11.5-10" />
    </>
  ),
  calendar: (
    <>
      <rect x="7.5" y="10.5" width="33" height="29" rx="3.5" />
      <path d="M7.5 18.5h33M16 7v7M32 7v7" />
      <g fill="currentColor" stroke="none">
        <circle cx="15.5" cy="25" r="1.7" /><circle cx="22" cy="25" r="1.7" /><circle cx="28.5" cy="25" r="1.7" /><circle cx="35" cy="25" r="1.7" />
        <circle cx="15.5" cy="31.5" r="1.7" /><circle cx="22" cy="31.5" r="1.7" /><circle cx="28.5" cy="31.5" r="1.7" />
      </g>
    </>
  ),
  finger: (
    <>
      <path d="M12.5 17.5a14 14 0 0 1 23 0" />
      <path d="M10.5 26c0-7.5 6-13.5 13.5-13.5S37.5 18.5 37.5 26v1.5" />
      <path d="M15.5 36.5a17 17 0 0 1-1-6.5v-4a9.5 9.5 0 0 1 19 0v3" />
      <path d="M20 39.5a19 19 0 0 1-1.5-7.5v-6a5.5 5.5 0 0 1 11 0v4a20 20 0 0 1-1.3 7.2" />
      <path d="M24 26v5.5a22 22 0 0 0 2 9.5" />
      <path d="M33.5 34.5a25 25 0 0 1-1.3 5" />
    </>
  ),
  check: (
    <>
      <circle cx="24" cy="24" r="16" />
      <path d="m16.5 24.5 5.2 5.2L32 19" />
    </>
  ),
  cross: <path d="M14 14l20 20M34 14 14 34" strokeWidth="5" />,
};

export function JarGlyph({ icon }: { icon: JarIcon }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {P[icon]}
    </svg>
  );
}

/** The travelling application: a glass document with a folded corner and a small stamp tick. */
export function ApplicationGlyph() {
  return (
    <svg viewBox="0 0 40 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id="jj-doc" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d9e7ff" />
        </linearGradient>
      </defs>
      <path d="M8 3h17l9 9v30a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" fill="url(#jj-doc)" />
      <path d="M25 3v6a3 3 0 0 0 3 3h6" fill="#b9cff5" />
      <path d="M11 19h15M11 25h12M11 31h8" stroke="#5f86c9" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="27.5" cy="35.5" r="5.5" fill="var(--doc-tone, #3d84f7)" />
      <path d="m25 35.6 1.8 1.8 3.4-3.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Home jar scene: a girl at her desk working on a laptop (white silhouette and
 * lines, glowing in the jar colour). Drawn on an 84 × 64 grid that sits inside
 * the dome; the rising applications are separate elements animated in CSS.
 */
export function HomeDeskScene() {
  return (
    <svg viewBox="0 0 84 64" fill="none" aria-hidden>
      {/* chair */}
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
        <path d="M7.5 25.5 10.5 43.5H25" />
        <path d="M17.5 44v16.5M11 61h13" />
      </g>
      {/* desk */}
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M35 46.5h46" />
        <path d="M39 47v14.5M77 47v14.5" />
      </g>
      {/* laptop: base on the desk, lit screen angled towards her */}
      <path d="M47 45.2h21" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M66.4 44.8 69.6 27.6l3.3.7-3.4 16.6Z" fill="currentColor" />
      <path d="M65.4 42.6 68.1 29" stroke="var(--glow, #cfe6ff)" strokeWidth="1.6" strokeLinecap="round" />
      {/* girl: long flowing hair, head, leaning torso (filled) */}
      <g fill="currentColor">
        <path d="M31.2 13.6c-.3-5.2-4.6-8.4-9.3-7.6-4.6.8-7.2 4.9-6.7 9.6.4 3.6.2 7.4-1.6 10.6-.8 1.5-1.9 2.9-3.2 4 3.6.3 7.1-1.2 9.2-4.1 1.5-2.1 2.2-4.6 2.3-7.1 2.6.1 5.5-.6 7.6-2.4l1.7-3Z" />
        <circle cx="25.6" cy="14.6" r="5.4" />
        <path d="M20.6 22.6c3-1.4 6.6-.6 8.6 2l4.6 6.3c.9 1.3.6 3-.7 3.9l-2.4 1.6-1.3 6.8c-.3 1.3-1.4 2.2-2.7 2.2h-6.3c-1.4 0-2.5-1.1-2.5-2.5V28.3c0-2.4 1.1-4.6 2.7-5.7Z" />
      </g>
      {/* legs and typing arm */}
      <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19.5 43.4h17.2l.9 16.8h4.6" />
        <path d="M27.5 27.4 34.6 37.6l13.2 6.1" />
      </g>
    </svg>
  );
}
