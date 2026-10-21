/**
 * Transition particle burst (motion tier T5). The director calls `burst`
 * with outgoing and incoming component rects; the WebGL layer streams
 * particles from the old shapes, through ODIN, into the new shapes.
 */
export type FxRect = { x: number; y: number; w: number; h: number; accent: string };

export const fx = {
  version: 0,
  startedAt: 0,
  duration: 1.35,
  from: [] as FxRect[],
  to: [] as FxRect[],
  via: { x: 0, y: 0 },
  /** Particle choreography: 0 stream · 1 vortex · 2 wave · 3 rise · 4 scatter · 5 helix. */
  style: 0,
};

export function burst(from: FxRect[], to: FxRect[], via: { x: number; y: number }, style = 0) {
  fx.style = style;
  fx.from = from;
  fx.to = to;
  fx.via = via;
  fx.startedAt = performance.now();
  fx.version++;
}

/**
 * WebGL objects (3D donut, journey pedestals) that follow a DOM proxy element:
 * they read its live rect and opacity every frame, so DOM morphs drive 3D too.
 */
export type Proxy3D = { el: HTMLElement; kind: 'donut' | 'pedestal' | 'plinths' | 'earth' | 'orb'; data: unknown };
export const proxies = new Map<string, Proxy3D>();
export const proxyVersion = { value: 0 };

export function registerProxy(key: string, p: Proxy3D) {
  proxies.set(key, p);
  proxyVersion.value++;
  return () => {
    if (proxies.get(key) === p) {
      proxies.delete(key);
      proxyVersion.value++;
    }
  };
}

if (import.meta.env.DEV) (window as unknown as { __odinProxies: typeof proxies }).__odinProxies = proxies;
