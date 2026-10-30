import { useEffect, useState } from 'react';
import { gpuInfo, isLite, motionForced, osReducedMotion, setting } from '../../lib/environment';

/**
 * `?perf=1` (ver05.4): what this machine gives ODIN — renderer (hardware / software / none),
 * the OS reduced-motion preference and whether ODIN overrides it, lite mode, frame rate and
 * pixel density. For checking a virtual desktop (AVD) in seconds. `?perf=0` hides it again.
 */
export function PerfHud() {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let n = 0, raf = 0, t0 = performance.now();
    const loop = (t: number) => {
      n++;
      if (t - t0 >= 1000) { setFps(Math.round((n * 1000) / (t - t0))); n = 0; t0 = t; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const g = gpuInfo();
  const canvas = document.querySelector('.stage-canvas canvas') as HTMLCanvasElement | null;
  const rows: [string, string, 'ok' | 'warn' | 'bad'][] = [
    ['WebGL', g.webgl, g.webgl === 'hardware' ? 'ok' : g.webgl === 'software' ? 'warn' : 'bad'],
    ['Renderer', g.renderer.replace(/^ANGLE \(/, '').slice(0, 38), g.webgl === 'hardware' ? 'ok' : 'warn'],
    ['OS reduced motion', osReducedMotion() ? 'on (remote desktop?)' : 'off', osReducedMotion() && !motionForced() ? 'bad' : 'ok'],
    ['ODIN motion', motionForced() ? 'forced on' : osReducedMotion() ? 'reduced' : 'full', motionForced() || !osReducedMotion() ? 'ok' : 'bad'],
    ['Lite mode', `${isLite() ? 'on' : 'off'} (${setting('lite')})`, isLite() ? 'warn' : 'ok'],
    ['Frame rate', `${fps} fps`, fps >= 50 ? 'ok' : fps >= 25 ? 'warn' : 'bad'],
    ['Pixel density', `${window.devicePixelRatio} screen · ${canvas ? (canvas.width / window.innerWidth).toFixed(2) : '–'} 3D`, 'ok'],
  ];
  const col = { ok: '#3fcf8e', warn: '#f2b544', bad: '#ff5468' } as const;
  return (
    <div role="status" aria-label="ODIN diagnostics" style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 99999, font: '12px/1.45 ui-monospace, Menlo, monospace', color: '#e8eefc', background: 'rgba(8,12,24,.88)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 10, padding: '10px 12px', minWidth: 300, pointerEvents: 'none' }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>ODIN diagnostics</div>
      {rows.map(([k, v, s]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
          <span style={{ opacity: .75 }}>{k}</span><span style={{ color: col[s] }}>{v}</span>
        </div>
      ))}
    </div>
  );
}
