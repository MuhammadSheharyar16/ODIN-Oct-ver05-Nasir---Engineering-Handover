import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { prefersReducedMotion } from '../../lib/motion';
import { useOdinLayout } from '../bridge';
import { intro } from '../../lib/intro';

/**
 * Light beam from the floor ring up into a screen's central object (Home's beam language):
 * a bright hotspot at the ring's centre, a white-hot column with a cyan glow that thins as it
 * rises, light motes rising inside it, and three hairline white rays each side with sparks
 * running down to the floor.
 *
 * Any screen opts in by marking its central sphere with `data-beam` (optional value: comma-separated
 * accent colours for the motes). The beam draws only where it fits: wide layouts, the object above
 * the ring and close to its centre line. It follows the object (morphs) and fades with it.
 * `data-beam-level` (0–1) dims it on busy screens so it never competes with the metrics.
 * `data-beam-mode="rays"` draws only the hairline rays (Home: the 3D globe already has its beam).
 * `data-beam-narrow` also draws it on tablet / phone layouts (the answer view stands its sphere on the ring there too).
 */
const rgb = (h: string) => { const n = parseInt(h.replace('#', ''), 16); return `${n >> 16},${(n >> 8) & 255},${n & 255}`; };
const sprite = (hex: string) => {
  const o = document.createElement('canvas'); o.width = o.height = 20;
  const x = o.getContext('2d')!; const gr = x.createRadialGradient(10, 10, 0, 10, 10, 10); const c = rgb(hex);
  gr.addColorStop(0, '#fff'); gr.addColorStop(0.22, `rgb(${c})`); gr.addColorStop(0.55, `rgba(${c},.25)`); gr.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 20, 20); return o;
};

export function FloorBeam({ root }: { root: RefObject<HTMLElement | null> }) {
  const layout = useOdinLayout();
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const wide = layout.mode === 'wide';
  const { width, height } = layout;
  const ring = layout.ring;

  useEffect(() => {
    const cv = ref.current, g = cv?.getContext('2d');
    if (!cv || !g) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(width * dpr); cv.height = Math.round(height * dpr);
    const k = wide ? Math.min(width / 1920, height / 1080) : Math.min(width / 1080, height / 1920);
    const white = sprite('#dff0ff');
    let accents = '', sprites: HTMLCanvasElement[] = [white];
    type Mote = { t: number; u: number; v: number; s: number; ph: number; i: number };
    const P: Mote[] = Array.from({ length: 150 }, () => ({ t: Math.random(), u: Math.random() * 2 - 1, v: 0.1 + Math.random() * 0.12, s: 0.5 + Math.random() * 1.1, ph: Math.random() * 6.28, i: 0 }));
    const RAYS = [-30, -20, -11, 11, 20, 30];
    const SP = RAYS.flatMap((_, li) => Array.from({ length: 9 }, () => ({ li, t: Math.random(), v: 0.13 + Math.random() * 0.12, s: 0.35 + Math.random() * 0.45 })));
    const pick = () => (Math.random() < 0.45 || sprites.length === 1 ? 0 : 1 + Math.floor(Math.random() * (sprites.length - 1)));
    let col: HTMLCanvasElement | null = null, colH = 0;
    const buildColumn = (h: number) => {
      // Built once per height: horizontal falloff × vertical fade (bright at the floor, thinning upward).
      col = document.createElement('canvas'); col.width = Math.round(160 * k * dpr); col.height = Math.max(1, Math.round(h * dpr)); colH = h;
      const c2 = col.getContext('2d')!; c2.scale(dpr, dpr);
      const cx = 80 * k;
      const layer = (w: number, color: string) => {
        const hg = c2.createLinearGradient(cx - w, 0, cx + w, 0);
        hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(0.5, color); hg.addColorStop(1, 'rgba(0,0,0,0)');
        c2.fillStyle = hg; c2.fillRect(cx - w, 0, w * 2, h);
      };
      c2.globalCompositeOperation = 'lighter';
      layer(72 * k, 'rgba(90,170,255,0.38)'); layer(24 * k, 'rgba(160,220,255,0.8)'); layer(7 * k, 'rgba(255,255,255,1)'); layer(3 * k, 'rgba(255,255,255,1)');
      c2.globalCompositeOperation = 'destination-in';
      const vg = c2.createLinearGradient(0, h, 0, 0);
      vg.addColorStop(0, 'rgba(0,0,0,1)'); vg.addColorStop(0.4, 'rgba(0,0,0,0.92)'); vg.addColorStop(0.75, 'rgba(0,0,0,0.6)'); vg.addColorStop(0.97, 'rgba(0,0,0,0.75)'); vg.addColorStop(1, 'rgba(0,0,0,0.2)');
      c2.fillStyle = vg; c2.fillRect(0, 0, 160 * k, h);
    };
    let raf = 0, last = performance.now(), T = 0, fade = 0;
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!reduced) T += dt;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
      const el = root.current?.querySelector<HTMLElement>('[data-beam]');
      const r = el?.getBoundingClientRect();
      const morph = el?.closest<HTMLElement>('[data-morph]');
      const op = morph ? parseFloat(getComputedStyle(morph).opacity || '1') : 1;
      const R = r ? Math.min(r.width, r.height) / 2 : 0;
      const ox = r ? r.left + r.width / 2 : 0, oy = r ? r.top + r.height / 2 : 0;
      const sqf = parseFloat(el?.dataset.beamSquash ?? '1') || 1;
      const fits = !!r && (wide || el?.dataset.beamNarrow !== undefined) && R > 20 && ring.y > oy + R * sqf + 12 && Math.abs(ox - ring.x) < ring.halfWidth * 0.35;
      const level = Math.min(1, Math.max(0, parseFloat(el?.dataset.beamLevel ?? '1') || 1));
      const raysOnly = el?.dataset.beamMode === 'rays';
      fade += ((fits ? op * level * (raysOnly ? intro.beam : 1) : 0) - fade) * Math.min(1, dt * 4);
      if (fade < 0.01 || !r) { raf = requestAnimationFrame(draw); return; }
      if (el && el.dataset.beam !== accents) { accents = el.dataset.beam ?? ''; sprites = [white, ...accents.split(',').filter(Boolean).map((a) => sprite(a.trim()))]; P.forEach((m) => (m.i = pick())); }
      // Squash < 1: a tilted ring (3D donut) whose visible lower edge sits at R × squash.
      const sq = parseFloat(el?.dataset.beamSquash ?? '1') || 1;
      // The beam meets the object's lower edge and stops there (never shows through glass).
      const cx = ring.x, fy = ring.y, ty = oy + R * sq * (sq < 1 ? 0.93 : 0.985);
      const h = fy - ty;
      if (h < 8) { raf = requestAnimationFrame(draw); return; }
      if (!col || Math.abs(colH - h) > 2) buildColumn(h);
      g.globalCompositeOperation = 'lighter';
      // Column with a slow shimmer.
      g.globalAlpha = fade * (0.88 + 0.12 * Math.sin(T * 2.6) * Math.sin(T * 1.1));
      if (!raysOnly) g.drawImage(col!, (cx - 80 * k) * dpr, ty * dpr, col!.width, h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Hairline rays each side, from the object down to the floor, with sparks running down.
      RAYS.forEach((dx0, i) => {
        const dx = dx0 * k, a = ox + dx, ay = oy + Math.sqrt(Math.max(0, R * R - dx * dx)) * 0.99 * sq, bx = cx + dx;
        const w = Math.abs(dx0) > 25 ? 0.75 : Math.abs(dx0) > 15 ? 0.9 : 1;
        const fl = (0.72 + 0.28 * Math.sin(T * 2.2 + i * 1.37) * Math.sin(T * 0.9 + i * 2.74)) * w * fade;
        for (const [lw, c, kk] of [[3, '200,230,255', 0.45], [0.9, '255,255,255', 1]] as const) {
          const lg = g.createLinearGradient(a, ay, bx, fy);
          lg.addColorStop(0, `rgba(${c},0)`); lg.addColorStop(0.08, `rgba(${c},${(0.9 * kk * fl).toFixed(3)})`); lg.addColorStop(0.55, `rgba(${c},${(0.6 * kk * fl).toFixed(3)})`); lg.addColorStop(1, `rgba(${c},${(kk * fl).toFixed(3)})`);
          g.strokeStyle = lg; g.lineWidth = lw * Math.max(0.7, k); g.beginPath(); g.moveTo(a, ay); g.lineTo(bx, fy); g.stroke();
        }
        for (const m of SP) {
          if (m.li !== i) continue;
          if (!reduced) { m.t += m.v * dt; if (m.t > 1) m.t -= 1; }
          const x = a + (bx - a) * m.t, y = ay + (fy - ay) * m.t, z = m.s * 2.2 * Math.max(0.7, k);
          g.globalAlpha = Math.min(1, m.t * 8) * Math.min(1, (1 - m.t) * 6) * w * fade;
          g.drawImage(white, x - z, y - z, z * 2, z * 2);
        }
      });
      if (raysOnly) { g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; raf = requestAnimationFrame(draw); return; }
      // Hotspot where the beam leaves the floor.
      g.globalAlpha = fade * (0.82 + 0.18 * Math.sin(T * 1.5));
      g.save(); g.translate(cx, fy); g.scale(1, 0.24);
      const hr = 170 * k, hs = g.createRadialGradient(0, 0, 0, 0, 0, hr);
      hs.addColorStop(0, 'rgba(255,255,255,0.95)'); hs.addColorStop(0.18, 'rgba(190,230,255,0.75)'); hs.addColorStop(0.5, 'rgba(110,180,255,0.25)'); hs.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = hs; g.beginPath(); g.arc(0, 0, hr, 0, Math.PI * 2); g.fill(); g.fill(); g.restore();
      // Motes rising inside the beam (a little spread at the floor, converging upward).
      for (const m of P) {
        if (!reduced) { m.t += m.v * dt; if (m.t > 1) { m.t -= 1; m.u = Math.random() * 2 - 1; m.i = pick(); } }
        const spread = 22 * k * (1 - m.t * 0.65);
        const x = cx + (ox - cx) * m.t + (m.u + Math.sin(T * 1.3 + m.ph) * 0.15) * spread, y = fy + (ty - fy) * m.t, z = m.s * 2.4 * Math.max(0.7, k);
        g.globalAlpha = Math.min(1, m.t * 10) * Math.min(1, (1 - m.t) * 4) * (0.6 + 0.4 * Math.sin(T * 3.5 + m.ph)) * fade;
        g.drawImage(sprites[m.i] ?? white, x - z, y - z, z * 2, z * 2);
      }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [wide, width, height, ring.x, ring.y, ring.halfWidth, root, reduced]);

  return <canvas ref={ref} className="floor-beam" aria-hidden style={{ position: 'absolute', left: 0, top: 0, width, height, pointerEvents: 'none' }} />;
}
