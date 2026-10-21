import { useEffect, useState, type CSSProperties } from 'react';
import { useLayout } from '../state/layout';
import type { LayoutMode } from '../lib/homeLayout';
import './chrome.css';

/** Chrome type scale per device class (reference px → CSS px multiplier). */
const CHROME_SCALE: Record<LayoutMode, number> = { wide: 1, portrait: 1, compact: 0.62, short: 0.55 };

/** Placeholder ODIN wordmark (open-D form from the concept art) until the approved SVG is supplied. */
function OdinWordmark() {
  return (
    <svg className="odin-wordmark" viewBox="0 0 220 48" aria-label="ODIN" role="img">
      <g fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
        <circle cx="24" cy="24" r="20" />
        <path d="M74 4.5 A19.5 19.5 0 0 1 74 43.5" />
        <path d="M64 4.5 h10 M64 43.5 h10" />
        <path d="M130 4 V44" />
        <path d="M176 44 V4 L214 44 V4" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Dubai',
});
const timeFmt = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Dubai',
});

export function Chrome() {
  const now = useClock();
  const { mode, u, chrome } = useLayout((s) => s.home);
  const style = { '--c': `${u * CHROME_SCALE[mode]}px`, '--inset': `${chrome.inset}px` } as CSSProperties;
  return (
    <div className={`chrome${chrome.compact ? ' is-compact' : ''}`} style={style} data-intro="chrome">
      <header className="chrome-brand">
        <OdinWordmark />
        <span className="chrome-sub">Executive Intelligence</span>
      </header>
      <aside className="chrome-meta">
        <span className="chrome-aegi">aegi</span>
        <span className="chrome-time">
          {dateFmt.format(now)} <span className="chrome-dot">·</span> {timeFmt.format(now)} GST
        </span>
        <span className="chrome-status" title="All values are labelled mock fixtures. No live VAS connection.">
          <span className="chrome-status-dot" />
          Demo data · not live
        </span>
      </aside>
    </div>
  );
}
