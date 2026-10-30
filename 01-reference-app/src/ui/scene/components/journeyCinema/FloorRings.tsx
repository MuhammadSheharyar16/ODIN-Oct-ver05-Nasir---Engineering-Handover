import { useEffect, useRef } from 'react';
import { onTick } from '../../../../lib/ticker';
/** The highlighted stage: its base on the floor, ring width, height and phase colour. */
export type OrbitTarget = { x: number; y: number; rx: number; h: number; c: string } | null;

/**
 * Highlight for v4.5 (V39) (Anupam, 27 Oct: the swirl hid the stage). On the floor round the base
 * of the highlighted stage, a faint line of light stays at the plinth and ripples of light leave it,
 * travel outward and fade, like beats (Nasir, 27 Oct), in its phase colour with a little glow.
 * The back arc is drawn under the unit and the front arc over it, so the lines wrap the plinth
 * without covering the stage. They fade out at the stage left and in at the next (never travelling).
 * ver05.3 performance: 1.25x pixel density, only the ring's own box is cleared each frame, and the
 * loop (shared 60 fps ticker) stops once the rings have faded out.
 */
export function FloorRings({ W, H, u, target, reduced, zBack, zFront }: { W: number; H: number; u: number; target: OrbitTarget; reduced: boolean; zBack: number; zFront: number }) {
  const back = useRef<HTMLCanvasElement>(null), front = useRef<HTMLCanvasElement>(null);
  const live = useRef(target);
  const wake = useRef<(() => void) | null>(null);
  useEffect(() => { live.current = target; wake.current?.(); });

  useEffect(() => {
    const cb = back.current, cf = front.current;
    if (!cb || !cf) return;
    const dpr = Math.min(1.25, window.devicePixelRatio || 1);
    for (const c of [cb, cf]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    const gb = cb.getContext('2d')!, gf = cf.getContext('2d')!;
    gb.setTransform(dpr, 0, 0, dpr, 0, 0); gf.setTransform(dpr, 0, 0, dpr, 0, 0);
    let cur: NonNullable<OrbitTarget> | null = null;
    let fade = 0, last = performance.now();
    let box: [number, number, number, number] | null = null; // last drawn area, cleared next frame
    let stop: (() => void) | null = null;

    // One ellipse arc on the floor: a soft glow stroke under a fine bright core.
    const arc = (g: CanvasRenderingContext2D, rx: number, ry: number, a0: number, a1: number, core: number, glow: number, alpha: number, color: string) => {
      g.beginPath(); g.ellipse(cur!.x, cur!.y, rx, ry, 0, a0, a1);
      g.strokeStyle = color; g.globalAlpha = alpha * 0.32; g.lineWidth = glow; g.stroke();
      g.strokeStyle = '#ffffff'; g.globalAlpha = alpha * 0.9; g.lineWidth = core; g.stroke();
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const T = live.current;
      const moved = !!T && !!cur && (Math.abs(T.x - cur.x) > 1 || Math.abs(T.y - cur.y) > 1);
      if (T && (!cur || (moved && fade <= 0.01))) cur = { ...T };
      if (T && !moved) fade = Math.min(1, fade + dt * 1.8); else fade = Math.max(0, fade - dt * 2.6);
      if (box) { gb.clearRect(...box); gf.clearRect(...box); box = null; }
      if (cur && fade > 0) {
        const t = now / 1000;
        // A faint line stays at the base; ripples of light leave it, travel outward and fade (about 2.6 s each, three in flight).
        const R = cur.rx * 1.85 + 12 * u;
        box = [cur.x - R, cur.y - R * 0.3 - 12 * u, R * 2, R * 0.6 + 24 * u];
        const ripples = reduced ? [0.25] : [0, 1, 2].map((k) => ((t / 2.6 + k / 3) % 1));
        for (const [g, a0, a1] of [[gb, Math.PI, Math.PI * 2], [gf, 0, Math.PI]] as const) {
          arc(g, cur.rx * 0.96, cur.rx * 0.96 * 0.3, a0, a1, 1.4 * u, 6 * u, fade * 0.55, cur.c);
          for (const p of ripples) {
            const r = cur.rx * (0.96 + 0.85 * p);
            const born = Math.min(1, p / 0.08);
            const a = fade * born * Math.pow(1 - p, 1.6);
            arc(g, r, r * 0.3, a0, a1, (2.2 - 1.4 * p) * u, (10 - 4 * p) * u, a, cur.c);
          }
        }
        gb.globalAlpha = 1; gf.globalAlpha = 1;
      }
      // Idle (nothing to show) or settled under reduced motion: stop until the target changes.
      if ((!T && fade <= 0 && !box) || (reduced && fade >= 1)) { stop?.(); stop = null; }
    };
    const run = () => { if (!stop) { last = performance.now(); stop = onTick(frame); } };
    wake.current = run;
    run();
    return () => { stop?.(); stop = null; wake.current = null; };
  }, [W, H, u, reduced]);

  return (
    <>
      <canvas ref={back} className="j42__orbit" style={{ width: W, height: H, zIndex: zBack }} aria-hidden />
      <canvas ref={front} className="j42__orbit" style={{ width: W, height: H, zIndex: zFront }} aria-hidden />
    </>
  );
}
