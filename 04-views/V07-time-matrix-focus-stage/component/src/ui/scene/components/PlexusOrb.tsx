import { useEffect, useMemo, useRef } from 'react';
import { prefersReducedMotion } from '../../../lib/motion';

/**
 * Deep-blue data sphere for the processing time matrix: a slowly rotating
 * constellation (points on and inside a sphere, linked to near neighbours)
 * drawn on a 2D canvas, sitting in a CSS glass orb with a fresnel rim.
 * Replaces ODIN's Home globe on this screen.
 */
const SIZE = 460;

export function PlexusOrb() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduced = useMemo(() => prefersReducedMotion(), []);

  useEffect(() => {
    const cv = canvas.current;
    const g = cv?.getContext('2d');
    if (!cv || !g) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = SIZE * dpr; cv.height = SIZE * dpr;
    g.scale(dpr, dpr);
    const R = SIZE * 0.44, c = SIZE / 2;
    // Fibonacci shell + sparse inner points
    const pts: [number, number, number][] = [];
    const shell = 230;
    for (let i = 0; i < shell; i++) {
      const y = 1 - (i / (shell - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996;
      pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }
    for (let i = 0; i < 90; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, rr = Math.cbrt(Math.random()) * 0.85, s = Math.sqrt(1 - u * u);
      pts.push([Math.cos(th) * s * rr, u * rr, Math.sin(th) * s * rr]);
    }
    const LINK = 0.3;
    let raf = 0;
    const draw = (now: number) => {
      const a = reduced ? 0.6 : now / 14000, tilt = 0.32;
      const ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(tilt), st = Math.sin(tilt);
      const P = pts.map(([x, y, z]) => {
        const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
        const y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
        return { x: c + x1 * R, y: c + y2 * R, z: z2, X: x, Y: y, Z: z };
      });
      g.clearRect(0, 0, SIZE, SIZE);
      g.globalCompositeOperation = 'lighter';
      g.lineWidth = 0.9;
      for (let i = 0; i < P.length; i++) {
        for (let j = i + 1; j < P.length; j++) {
          const p = P[i], q = P[j];
          const dx = p.X - q.X, dy = p.Y - q.Y, dz = p.Z - q.Z, d = dx * dx + dy * dy + dz * dz;
          if (d > LINK * LINK) continue;
          const depth = ((p.z + q.z) / 2 + 1) / 2;
          g.strokeStyle = `rgba(${120 + depth * 100}, ${190 + depth * 50}, 255, ${(1 - Math.sqrt(d) / LINK) * (0.12 + depth * 0.6)})`;
          g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
        }
      }
      for (const p of P) {
        const depth = (p.z + 1) / 2, r = 0.8 + depth * 2;
        g.fillStyle = `rgba(${200 + depth * 55}, ${225 + depth * 30}, 255, ${0.25 + depth * 0.75})`;
        g.beginPath(); g.arc(p.x, p.y, r, 0, Math.PI * 2); g.fill();
        if (depth > 0.75) { g.fillStyle = `rgba(150, 210, 255, ${(depth - 0.75) * 1.1})`; g.beginPath(); g.arc(p.x, p.y, r * 3.4, 0, Math.PI * 2); g.fill(); }
      }
      g.globalCompositeOperation = 'source-over';
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    // ODIN's speaking spectrum hugs the sphere itself (tighter than the old core disc).
    <div className="pxo" aria-hidden data-aura="" data-surface>
      <div className="pxo__glass" />
      <canvas ref={canvas} className="pxo__net" style={{ width: '100%', height: '100%' }} />
      <div className="pxo__rim" />
    </div>
  );
}
