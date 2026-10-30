import { afterEach, describe, expect, it, vi } from 'vitest';

// A browser with a URL query, localStorage and an OS reduced-motion preference.
function browser(search: string, reduce: boolean, kept: Record<string, string> = {}) {
  const mem = { ...kept };
  vi.stubGlobal('window', {
    location: { search },
    localStorage: { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = v; } },
    matchMedia: (q: string) => ({ matches: reduce && q.includes('reduce') }),
  });
  return mem;
}

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe('virtual-desktop settings (ver05.4)', () => {
  it('follows the OS reduced-motion preference by default', async () => {
    browser('', true);
    const { prefersReducedMotion } = await import('./motion');
    expect(prefersReducedMotion()).toBe(true);
  });

  it('?motion=on keeps ODIN moving on a remote desktop, and is remembered', async () => {
    const mem = browser('?motion=on', true);
    const { prefersReducedMotion } = await import('./motion');
    expect(prefersReducedMotion()).toBe(false);
    expect(mem['odin.motion']).toBe('on');
  });

  it('a remembered setting applies without the URL; ?motion=auto switches back', async () => {
    browser('', true, { 'odin.motion': 'on' });
    expect((await import('./motion')).prefersReducedMotion()).toBe(false);
    vi.resetModules();
    browser('?motion=auto', true, { 'odin.motion': 'on' });
    expect((await import('./motion')).prefersReducedMotion()).toBe(true);
  });

  it('?lite=on and ?lite=off override the automatic choice', async () => {
    browser('?lite=on', false);
    expect((await import('./environment')).isLite()).toBe(true);
    vi.resetModules();
    browser('?lite=off', false);
    expect((await import('./environment')).isLite()).toBe(false);
  });

  it('ignores unknown values', async () => {
    browser('?motion=fast&lite=maybe', false);
    const env = await import('./environment');
    expect(env.setting('motion')).toBe('auto');
    expect(env.setting('lite')).toBe('auto');
  });
});
