/**
 * Where ODIN is running (ver05.4, virtual desktops). AEGI opens ODIN only inside Azure Virtual
 * Desktop (AVD). There, two things change the experience:
 *  1. Remote desktop sessions switch Windows animation effects off, so the browser reports
 *     `prefers-reduced-motion: reduce` and ODIN would go static (no morphs, frozen globe).
 *     `motion` lets a deployment keep ODIN's motion anyway.
 *  2. AVD session hosts usually have no GPU, so WebGL is software-rendered or missing.
 *     `lite` drops the heavy GPU finish so ODIN stays smooth; with no WebGL at all the room is
 *     shown as a still picture and everything else keeps working.
 *
 * Settings (each: URL parameter, remembered in this browser; else the build default):
 *  - `?motion=on | auto`  on = animate even when the OS asks for reduced motion.  Build: VITE_ODIN_MOTION.
 *  - `?lite=auto | on | off`  auto = lite when WebGL is software or missing.       Build: VITE_ODIN_LITE.
 *  - `?perf=1 | 0`  shows the on-screen diagnostic (renderer, motion, lite, fps).
 */
type Setting = 'motion' | 'lite' | 'perf';

const DEFAULTS: Record<Setting, string> = {
  motion: (import.meta.env.VITE_ODIN_MOTION as string | undefined) ?? 'auto',
  lite: (import.meta.env.VITE_ODIN_LITE as string | undefined) ?? 'auto',
  perf: '0',
};
const VALID: Record<Setting, string[]> = { motion: ['on', 'auto'], lite: ['auto', 'on', 'off'], perf: ['1', '0'] };

const store = {
  get(k: string) { try { return window.localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { window.localStorage.setItem(k, v); } catch { /* private mode: URL only */ } },
};

/** URL wins and is remembered (an AVD user sets it once); otherwise the remembered value; otherwise the build default. */
export function setting(name: Setting): string {
  if (typeof window === 'undefined') return DEFAULTS[name];
  const url = new URLSearchParams(window.location.search).get(name);
  if (url && VALID[name].includes(url)) { store.set(`odin.${name}`, url); return url; }
  const kept = store.get(`odin.${name}`);
  return kept && VALID[name].includes(kept) ? kept : DEFAULTS[name];
}

export const motionForced = () => setting('motion') === 'on';

/** The operating system's own preference, before any override (shown in the diagnostic). */
export const osReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

export type GpuInfo = { webgl: 'hardware' | 'software' | 'none'; renderer: string };
let gpuCache: GpuInfo | null = null;
const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic|mesa offscreen|warp/i;

/** WebGL2 with a hardware renderer, a software renderer (SwiftShader, WARP, llvmpipe), or none. */
export function gpuInfo(): GpuInfo {
  if (gpuCache) return gpuCache;
  if (typeof document === 'undefined') return (gpuCache = { webgl: 'hardware', renderer: 'n/a' });
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') ?? c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return (gpuCache = { webgl: 'none', renderer: 'WebGL unavailable' });
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    // Chromium also flags a "major performance caveat" when only software rendering is available.
    const strict = (document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true })
      ?? document.createElement('canvas').getContext('webgl', { failIfMajorPerformanceCaveat: true })) as WebGLRenderingContext | null;
    const caveat = !strict;
    strict?.getExtension('WEBGL_lose_context')?.loseContext();
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return (gpuCache = { webgl: SOFTWARE.test(renderer) || caveat ? 'software' : 'hardware', renderer });
  } catch {
    return (gpuCache = { webgl: 'none', renderer: 'WebGL error' });
  }
}

/** Lite mode: forced on/off, or automatic when the GPU is software or missing. */
export function isLite(): boolean {
  const s = setting('lite');
  if (s === 'on') return true;
  if (s === 'off') return false;
  return gpuInfo().webgl !== 'hardware';
}

/** Removes the stylesheets' reduced-motion rules (used when motion is forced on). */
function dropReducedMotionRules(sheet: CSSStyleSheet | CSSMediaRule | CSSSupportsRule) {
  let rules: CSSRuleList;
  try { rules = sheet.cssRules; } catch { return; } // cross-origin sheet: not ours
  for (let i = rules.length - 1; i >= 0; i--) {
    const r = rules[i];
    if (r instanceof CSSMediaRule) {
      if (/prefers-reduced-motion\s*:\s*reduce/.test(r.conditionText ?? r.media.mediaText)) sheet.deleteRule(i);
      else dropReducedMotionRules(r);
    } else if (r instanceof CSSSupportsRule) dropReducedMotionRules(r);
  }
}

/** Run once at start-up: tags <html> (data-motion, data-lite, data-gpu) and applies the motion override. */
export function applyEnvironment() {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  const g = gpuInfo();
  html.dataset.gpu = g.webgl;
  if (isLite()) html.dataset.lite = '1';
  if (!motionForced()) return;
  html.dataset.motion = 'on';
  const sweep = () => { for (const s of Array.from(document.styleSheets)) dropReducedMotionRules(s); };
  sweep();
  // Stylesheets that arrive later (lazy chunks, dev HMR) get the same treatment.
  new MutationObserver((list) => {
    sweep();
    for (const m of list) for (const n of Array.from(m.addedNodes)) if (n instanceof HTMLLinkElement) n.addEventListener('load', sweep, { once: true });
  }).observe(document.head, { childList: true, subtree: true });
  window.addEventListener('load', sweep, { once: true });
}
