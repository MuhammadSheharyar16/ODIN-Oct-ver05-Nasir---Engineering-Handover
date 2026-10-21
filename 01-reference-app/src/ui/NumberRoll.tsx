import { useEffect, useRef, useState } from 'react';
import { useArrived } from '../odin/waiting';
import { prefersReducedMotion } from '../lib/motion';

type Props = {
  value: number;
  format: (v: number) => string;
  className?: string;
  durationMs?: number;
  /** Count up from zero once, when the intro releases figures. */
  countUp?: boolean;
};

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Global gate so figures count up in sync with the intro timeline. */
let released = false;
const introSkipped = typeof location !== 'undefined' && new URLSearchParams(location.search).has('nointro');
const listeners = new Set<() => void>();
export function releaseFigures() {
  released = true;
  listeners.forEach((fn) => fn());
  listeners.clear();
}

/**
 * Live tick (motion tier T1): counts from the last known value to the new
 * one and sweeps a soft light across the figure. Only animates between real
 * values (or from zero once at intro) — never invents other data.
 */
export function NumberRoll({ value, format, className, durationMs = 700, countUp }: Props) {
  // Progressive loading: a loader until the data is in.
  const arrived = useArrived(500);
  const startsAtZero = countUp && !released && !prefersReducedMotion() && !introSkipped;
  const [shown, setShown] = useState(startsAtZero ? 0 : value);
  const [ticking, setTicking] = useState(false);
  const from = useRef(startsAtZero ? 0 : value);
  /** Value currently on screen — interrupted animations resume from here. */
  const shownRef = useRef(startsAtZero ? 0 : value);
  const [armed, setArmed] = useState(!startsAtZero);
  const raf = useRef(0);

  useEffect(() => {
    if (armed) return;
    const go = () => setArmed(true);
    if (released) go();
    else listeners.add(go);
    return () => {
      listeners.delete(go);
    };
  }, [armed]);

  useEffect(() => {
    if (!armed || value === from.current) return;
    if (prefersReducedMotion()) {
      from.current = value;
      shownRef.current = value;
      setShown(value);
      return;
    }
    const isIntro = from.current === 0 && shownRef.current === 0;
    const dur = isIntro ? 1600 : durationMs;
    let start = -1;
    const a = shownRef.current;
    // Glow pulse only for live updates, not the intro count-up.
    if (!isIntro) setTicking(true);
    const step = (now: number) => {
      // Time from the first frame's own timestamp (one clock), clamped.
      if (start < 0) start = now;
      const t = Math.min(1, Math.max(0, (now - start) / dur));
      const v = a + (value - a) * easeOut(t);
      shownRef.current = v;
      setShown(v);
      if (t < 1) raf.current = requestAnimationFrame(step);
      else {
        from.current = value;
        window.setTimeout(() => setTicking(false), 450);
      }
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, durationMs, armed]);

  if (!arrived) {
    return (
      <span className={`number-roll odin-loading${className ? ` ${className}` : ''}`} aria-label="Loading">
        <i /><i /><i />
      </span>
    );
  }
  return (
    <span className={`number-roll${ticking ? ' is-ticking' : ''}${className ? ` ${className}` : ''}`}>
      {format(shown)}
    </span>
  );
}
