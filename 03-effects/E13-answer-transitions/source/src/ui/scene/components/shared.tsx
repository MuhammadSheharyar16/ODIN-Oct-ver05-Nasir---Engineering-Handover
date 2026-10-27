import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { registerProxy, type Proxy3D } from '../../../odin/fx';
import { formatCount } from '../../../lib/format';
import { useArrived, useWaiting } from '../../../odin/waiting';

export const css = (v: Record<string, string | number>) => v as CSSProperties;

/** Emoji flag from ISO-3166 alpha-2 code. */
export function flag(code?: string) {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function DeltaTag({ value, unit = '%', basis, goodWhen = 'up', className = '' }: { value: number | null | undefined; unit?: string; basis?: string; goodWhen?: 'up' | 'down'; className?: string }) {
  if (value === null || value === undefined) return basis ? <span className={`dtag is-flat ${className}`}>— {basis}</span> : null;
  const up = value > 0;
  const flat = value === 0;
  const good = flat ? 'is-flat' : (up === (goodWhen === 'up')) ? 'is-good' : 'is-warn';
  return (
    <span className={`dtag ${good} ${className}`}>
      <span aria-hidden>{flat ? '—' : up ? '▲' : '▼'}</span> {up ? '+' : value < 0 ? '−' : ''}
      {Math.abs(value).toFixed(unit === '%' || unit === ' pp' || unit === ' days' ? 1 : 0)}
      {unit}
      {basis && <span className="dtag__basis"> {basis}</span>}
    </span>
  );
}

export function Bars({ values, accent, className = '' }: { values: number[]; accent: string; className?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className={`mbars ${className}`} style={css({ '--accent': accent })} aria-hidden>
      {values.map((v, i) => (
        <span key={i} style={css({ height: `${14 + (v / max) * 86}%`, '--i': i })} />
      ))}
    </div>
  );
}

export const kfmt = (n: number) => formatCount(n);

/** Registers a 3D proxy for the lifetime of the element. */
export function useProxy(key: string, kind: Proxy3D['kind'], data?: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    return registerProxy(key, { el: ref.current, kind, data });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, kind, JSON.stringify(data ?? null)]);
  return ref;
}

/** A DOM anchor that a 3D pedestal follows (see Plinths3D). */
export function Plinth({ accent, object = 'none', stack, scale, noBloom, tilt, style }: { accent: string; object?: string; stack?: number; scale?: number; noBloom?: boolean; /** Base view angle (radians); small = front view. */ tilt?: number; style?: CSSProperties }) {
  return (
    <span
      className="plinth-anchor"
      data-plinth=""
      data-accent={accent}
      data-object={object}
      {...(stack !== undefined ? { 'data-stack': String(stack) } : {})}
      {...(scale !== undefined ? { 'data-scale': String(scale) } : {})}
      {...(noBloom ? { 'data-nobloom': '' } : {})}
      {...(tilt !== undefined ? { 'data-tilt': String(tilt) } : {})}
      style={style}
    />
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}

/**
 * Count-up reveal for scene numbers: eases 0 → value as the component morphs in
 * (starts after the entrance delay), then tracks later value changes smoothly.
 * Reduced motion: shows the final value immediately. Screen readers always get
 * the final value via aria-label, never the intermediate digits.
 */
export function useCountUp(value: number, { delay = 520, duration = 1150, from: start }: { delay?: number; duration?: number; /** Start here instead of 0 (a number carried over from the previous screen). */ from?: number } = {}) {
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [shown, setShown] = useState(reduced ? value : start ?? 0);
  const cur = useRef(reduced ? value : start ?? 0);
  useEffect(() => {
    if (reduced) {
      cur.current = value;
      setShown(value);
      return;
    }
    if (!Number.isFinite(delay)) return; // waiting for the number (progressive loading)
    const from = cur.current;
    let raf = 0;
    let t0 = -1;
    const wait = from === 0 ? delay : 0;
    const step = (t: number) => {
      if (t0 < 0) t0 = t + wait;
      const k = Math.min(1, Math.max(0, (t - t0) / duration));
      const e = 1 - Math.pow(1 - k, 4);
      const v = from + (value - from) * e;
      cur.current = v;
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, delay, duration, reduced]);
  return shown;
}

/** A number that counts up on entrance, formatted with the same formatter as its final value. */
/** Last value shown per carried number (Count `memo`), so a metric that stays on screen never recounts from 0. */
const carried = new Map<string, number>();

export function Count({ v, fmt = kfmt, delay, className, memo }: { v: number; fmt?: (n: number) => string; delay?: number; className?: string; /** Carry the number across screens under this key (answer view: the morph key). */ memo?: string }) {
  const [start] = useState(() => (memo ? carried.get(memo) : undefined));
  useEffect(() => { if (memo) carried.set(memo, v); }, [memo, v]);
  // Progressive loading (?latency=…&progressive): a loader until this number arrives; numbers arrive in turn.
  const loading = useWaiting((s) => s.dataAt > 0);
  const ready = useArrived((delay ?? 0) * 1.6);
  const n = useCountUp(v, { delay: ready ? (loading ? 60 : delay) : Infinity, from: start });
  // <data> (not <span>) so component rules like `.x span { font-size }` never restyle the number.
  if (!ready) {
    return (
      <data className={`${className ?? ''} odin-loading`} value="" aria-label="Loading">
        <i /><i /><i />
      </data>
    );
  }
  return (
    <data className={className} value={String(v)}>
      {fmt(n)}
    </data>
  );
}
