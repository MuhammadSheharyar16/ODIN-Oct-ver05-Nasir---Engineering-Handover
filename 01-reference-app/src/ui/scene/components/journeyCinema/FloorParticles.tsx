import { useEffect, useRef } from 'react';

/**
 * Particle floor (V39): along each route a thick stream of white-cored particles flows over a
 * faint guide of light; every route is equally thick, and its soft, desaturated phase colour spreads
 * as a wide gentle halo round each particle (Nasir, 27 Oct);
 * white glass arrows on the floor show the direction, and a light beam sweeps along the route
 * into the highlighted stage only (`beam`), so the eye goes to that stage (Nasir, 27 Oct).
 * A slow dust of light
 * lies over the whole floor; the stage the application has reached gets a soft pool of light
 * with rising sparkles; the travelling application (an icon
 * drawn by JourneyCinema42) leaves a soft trail.
 * 2D canvas, pre-rendered soft sprites. ODIN's floor is bright, so the streams are drawn as
 * coloured particles with white cores over a faint guide of light (additive light alone would
 * vanish on it); stills under reduced motion.
 */
export type Stream = { id: string; p: number[]; c0: string; c1: string; weight: number; state: 'idle' | 'done' | 'live' };
export type Pool = { x: number; y: number; r: number; c: string } | null;
export type Comet = { p: number[]; c: string; start: number; dur: number } | null;

/** s = position along (0–1), v = flow speed, o = lateral offset (gaussian), w = warm ribbon, k = sparkle seed. */
type Dot = { s: number; v: number; o: number; w: number; k: number; ph: number };
/** The home sphere's warm amber (OdinGlobe streamShader), for a few warm motes in the floor dust. */
const WARM = '#ff9438';

const bez = (p: number[], t: number) => {
  const m = 1 - t, a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
  return [a * p[0] + b * p[2] + c * p[4] + d * p[6], a * p[1] + b * p[3] + c * p[5] + d * p[7]];
};
const tan = (p: number[], t: number) => {
  const m = 1 - t;
  const x = 3 * m * m * (p[2] - p[0]) + 6 * m * t * (p[4] - p[2]) + 3 * t * t * (p[6] - p[4]);
  const y = 3 * m * m * (p[3] - p[1]) + 6 * m * t * (p[5] - p[3]) + 3 * t * t * (p[7] - p[5]);
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

/** A soft round sprite in one colour, drawn once and stamped many times; `core` = a bright white centre (streams). */
function sprite(color: string, px: number, core = false) {
  const c = document.createElement('canvas');
  c.width = c.height = px;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
  if (core) {
    // White core, then the colour spread thinly over a wide halo (immersive, not a saturated ring).
    r.addColorStop(0, '#ffffff'); r.addColorStop(0.16, '#ffffff'); r.addColorStop(0.32, color + 'b3'); r.addColorStop(0.62, color + '40'); r.addColorStop(1, color + '00');
  } else {
    r.addColorStop(0, '#fffaf2'); r.addColorStop(0.18, color); r.addColorStop(0.55, color + '88'); r.addColorStop(1, color + '00');
  }
  g.fillStyle = r;
  g.fillRect(0, 0, px, px);
  return c;
}

export function FloorParticles({ W, H, u, streams, floor, pool, comet, beam, flat = 0.5, reduced }: {
  W: number; H: number; u: number; streams: Stream[]; floor: { x0: number; x1: number; y0: number; y1: number }; pool: Pool; comet: Comet; beam: string | null; flat?: number; reduced: boolean;
}) {
  const cv = useRef<HTMLCanvasElement>(null);
  const live = useRef({ streams, floor, pool, comet, beam });
  useEffect(() => { live.current = { streams, floor, pool, comet, beam }; });

  useEffect(() => {
    const canvas = cv.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const g = canvas.getContext('2d')!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    const sprites = new Map<string, HTMLCanvasElement>();
    const sp = (c: string, core = false) => { const key = core ? c + '*' : c; let s = sprites.get(key); if (!s) { s = sprite(c, 32, core); sprites.set(key, s); } return s; };
    const white = sp('#dfeaff');

    // Particles per stream (density = volume), kept across frames by stream id.
    const dots = new Map<string, Dot[]>();
    const dotsFor = (s: Stream) => {
      const n = 620; // every route equally thick (Nasir, 27 Oct)
      let d = dots.get(s.id);
      if (!d || d.length !== n) {
        d = Array.from({ length: n }, (_, i) => ({ s: Math.random(), v: 0.05 + Math.random() * 0.06, o: gauss(), w: i % 2, k: Math.random(), ph: Math.random() * 6.28 }));
        dots.set(s.id, d);
      }
      return d;
    };
    // Floor dust: depth (z) from the back of the floor (small, slow) to the front.
    const dust = Array.from({ length: 380 }, () => ({ x: Math.random(), y: Math.pow(Math.random(), 0.8), v: (Math.random() - 0.5) * 0.003, ph: Math.random() * 6.28, sz: 0.5 + Math.random() * 1.6, w: Math.random() < 0.25 }));
    const sparks = Array.from({ length: 18 }, (_, i) => ({ t: i / 18, a: Math.random() * 6.28, r: Math.random() }));

    // The guides only change when a route's state does (once per stop): cache them.
    const guide = document.createElement('canvas');
    guide.width = canvas.width; guide.height = canvas.height;
    const gg = guide.getContext('2d')!;
    let guideKey = '';

    let raf = 0, last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const { streams: S, floor: F, pool: P, comet: C, beam: B } = live.current;
      g.clearRect(0, 0, W, H);
      g.globalCompositeOperation = 'source-over';

      // 1 · dust of light over the floor
      for (const p of dust) {
        if (!reduced) p.x = (p.x + p.v * dt + 1) % 1;
        const x = F.x0 + p.x * (F.x1 - F.x0), y = F.y0 + p.y * (F.y1 - F.y0);
        const depth = 0.45 + 0.55 * p.y;
        const tw = 0.5 + 0.5 * Math.sin(t * 0.8 + p.ph);
        const s = (1.4 + 1.3 * p.sz) * depth * u;
        g.globalAlpha = (0.1 + 0.32 * tw) * depth;
        g.drawImage(p.w ? sp(WARM) : white, x - s / 2, y - (s * flat) / 2, s, s * flat);
      }

      // 2 · pool of light under the stage the application has reached
      if (P) {
        const br = 0.75 + 0.25 * Math.sin(t * 1.6);
        const grd = g.createRadialGradient(P.x, P.y, 0, P.x, P.y, P.r);
        grd.addColorStop(0, P.c);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.save();
        g.translate(P.x, P.y); g.scale(1, flat * 0.62); g.translate(-P.x, -P.y);
        g.globalAlpha = 0.42 * br;
        g.fillStyle = grd;
        g.fillRect(P.x - P.r, P.y - P.r, P.r * 2, P.r * 2);
        g.restore();
        const spr = sp(P.c);
        for (const k of sparks) {
          const life = (k.t + t * 0.22) % 1;
          const x = P.x + Math.cos(k.a) * P.r * 0.55 * k.r;
          const y = P.y + Math.sin(k.a) * P.r * 0.2 * k.r - life * 90 * u;
          const s = (5 + 4 * (1 - life)) * u;
          g.globalAlpha = Math.sin(Math.PI * life) * 0.9;
          g.drawImage(spr, x - s / 2, y - s / 2, s, s);
        }
      }

      // 3 · streams along the routes, over a faint guide of light (drawn once per state, then stamped)
      const key = S.map((s) => s.id + s.state).join('|');
      if (key !== guideKey) {
        guideKey = key;
        gg.setTransform(1, 0, 0, 1, 0, 0); gg.clearRect(0, 0, guide.width, guide.height); gg.setTransform(dpr, 0, 0, dpr, 0, 0);
        for (const s of S) {
          const width = 22 * u;
          const gain = s.state === 'live' ? 1 : s.state === 'done' ? 0.85 : 0.62;
          gg.beginPath(); gg.moveTo(s.p[0], s.p[1]); gg.bezierCurveTo(s.p[2], s.p[3], s.p[4], s.p[5], s.p[6], s.p[7]);
          const lg = gg.createLinearGradient(s.p[0], s.p[1], s.p[6], s.p[7]);
          lg.addColorStop(0, s.c0); lg.addColorStop(1, s.c1);
          gg.strokeStyle = lg; gg.lineCap = 'round';
          gg.globalAlpha = 0.16 * gain; gg.lineWidth = width * 2.2; gg.stroke();
          gg.globalAlpha = 0.45 * gain; gg.lineWidth = 1.4 * u; gg.stroke();
        }
        gg.globalAlpha = 1;
      }
      g.globalAlpha = 1;
      g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(guide, 0, 0); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const s of S) {
        const d = dotsFor(s);
        const width = 22 * u;
        const gain = s.state === 'live' ? 1 : s.state === 'done' ? 0.85 : 0.62;
        const s0 = sp(s.c0, true), s1 = sp(s.c1, true);
        for (const p of d) {
          if (!reduced) p.s += p.v * dt * (s.state === 'live' ? 1.6 : 1);
          if (p.s > 1) p.s -= 1;
          const [x, y] = bez(s.p, p.s);
          const [tx, ty] = tan(s.p, p.s);
          const wave = Math.sin(t * 0.7 + p.s * 7 + p.ph) * 0.35;
          const off = (p.o + wave) * width;
          const px = x - ty * off, py = y + tx * off * flat;
          const fade = Math.sin(Math.PI * p.s);
          const z = 0.5 + 0.9 * p.k;
          const sz = (5.6 + 4.8 * z) * u;
          g.globalAlpha = Math.min(1, fade * gain * (0.55 + 0.45 * z) * (1 - Math.min(1, Math.abs(p.o) * 0.4)) * 1.15);
          g.drawImage(p.s < 0.5 ? s0 : s1, px - sz / 2, py - (sz * 0.8) / 2, sz, sz * 0.8);
        }
      }

      // 3b · glass arrows lying on the floor along each route, drifting slowly in the direction of flow
      for (const s of S) {
        let L = 0, [lx, ly] = bez(s.p, 0);
        for (let k = 1; k <= 24; k++) { const [x, y] = bez(s.p, k / 24); L += Math.hypot(x - lx, y - ly); lx = x; ly = y; }
        const step = 74 * u, n = Math.max(1, Math.floor((L - 40 * u) / step));
        const drift = reduced ? 0.5 : (t * 0.22) % 1;
        const gain = s.state === 'live' ? 1 : s.state === 'done' ? 0.92 : 0.78;
        for (let k = 0; k < n; k++) {
          const q = (20 * u + (k + drift) * step) / L;
          if (q <= 0.04 || q >= 0.96) continue;
          const [x, y] = bez(s.p, q), [tx, ty] = tan(s.p, q);
          const a = Math.atan2(ty / flat, tx);
          const edgeFade = Math.min(1, Math.min(q, 1 - q) * 8);
          const ca = Math.cos(a), sa = Math.sin(a);
          g.setTransform(dpr * ca, dpr * sa * flat, -dpr * sa, dpr * ca * flat, dpr * x, dpr * y);
          g.beginPath(); g.moveTo(-7 * u, -9.5 * u); g.lineTo(5.5 * u, 0); g.lineTo(-7 * u, 9.5 * u);
          g.lineCap = 'round'; g.lineJoin = 'round';
          g.strokeStyle = '#ffffff'; g.globalAlpha = 0.4 * gain * edgeFade; g.lineWidth = 10 * u; g.stroke();
          g.strokeStyle = q < 0.5 ? s.c0 : s.c1; g.globalAlpha = 0.35 * gain * edgeFade; g.lineWidth = 6 * u; g.stroke();
          g.strokeStyle = '#ffffff'; g.globalAlpha = gain * edgeFade; g.lineWidth = 3.6 * u; g.stroke();
        }
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      // 3c · a light beam sweeping along the route into the highlighted stage (about 1.8 s a pass)
      g.lineCap = 'round';
      S.forEach((s) => {
        if (s.id !== B) return;
        const gain = 1;
        const head = reduced ? 0.6 : ((t / 1.8) % 1) * 1.25 - 0.05;
        const len = 0.2, seg = 14;
        let [px, py] = bez(s.p, Math.max(0, Math.min(1, head - len)));
        for (let k = 1; k <= seg; k++) {
          const q = head - len + (len * k) / seg;
          if (q < 0 || q > 1) { [px, py] = bez(s.p, Math.max(0, Math.min(1, q))); continue; }
          const [x, y] = bez(s.p, q);
          const a = (k / seg) * Math.min(1, Math.min(q, 1 - q) * 10) * gain;
          g.beginPath(); g.moveTo(px, py); g.lineTo(x, y);
          g.strokeStyle = '#ffffff'; g.globalAlpha = 0.22 * a; g.lineWidth = 16 * u; g.stroke();
          g.strokeStyle = s.c1; g.globalAlpha = 0.4 * a; g.lineWidth = 7 * u; g.stroke();
          g.strokeStyle = '#ffffff'; g.globalAlpha = 0.95 * a; g.lineWidth = 2.6 * u; g.stroke();
          px = x; py = y;
        }
      });

      // 4 · the soft trail behind the travelling application icon
      if (C && !reduced) {
        const k = Math.min(1, (now - C.start) / C.dur);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const spr = sp(C.c);
        for (let i = 24; i >= 1; i--) {
          const q = Math.max(0, e - i * 0.012);
          const [x, y] = bez(C.p, q);
          const s = (i === 0 ? 26 : 12 * (1 - i / 26)) * u;
          g.globalAlpha = (i === 0 ? 1 : 0.5 * (1 - i / 25)) * Math.sin(Math.PI * Math.min(1, k * 1.05));
          g.drawImage(i === 0 ? white : spr, x - s / 2, y - s / 2, s, s);
        }
      }

      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      if (!reduced) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [W, H, u, flat, reduced]);

  return <canvas ref={cv} className="j42__floor" style={{ width: W, height: H }} aria-hidden />;
}
