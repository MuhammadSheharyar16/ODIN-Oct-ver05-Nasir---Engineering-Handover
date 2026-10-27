import * as THREE from 'three';

/** Deterministic PRNG so the globe looks identical on every load. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Evenly distributed points on the unit sphere (Fibonacci lattice). */
export function fibonacciSphere(n: number) {
  const pts: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    pts.push(new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r));
  }
  return pts;
}

/**
 * Fine network lattice: each node joined to its nearest neighbours with arcs
 * that follow the sphere surface (subdivided so they curve, not cut through).
 */
export function buildLattice(nodeCount: number, neighbours: number, seed: number) {
  const rand = mulberry32(seed);
  const nodes = fibonacciSphere(nodeCount);
  const edges = new Set<string>();
  nodes.forEach((a, i) => {
    const nearest = nodes
      .map((b, j) => ({ j, d: i === j ? Infinity : a.distanceToSquared(b) }))
      .sort((p, q) => p.d - q.d)
      .slice(0, neighbours);
    for (const { j } of nearest) edges.add(i < j ? `${i}-${j}` : `${j}-${i}`);
  });

  const SUB = 5;
  const positions: number[] = [];
  const t: number[] = [];
  const phase: number[] = [];
  const warm: number[] = [];
  const tmp = new THREE.Vector3();
  for (const key of edges) {
    const [i, j] = key.split('-').map(Number);
    const ph = rand();
    const w = rand() < 0.4 ? 1 : 0;
    for (let s = 0; s < SUB; s++) {
      for (const k of [s, s + 1]) {
        tmp.copy(nodes[i]).lerp(nodes[j], k / SUB).normalize().multiplyScalar(1.004);
        positions.push(tmp.x, tmp.y, tmp.z);
        t.push(k / SUB);
        phase.push(ph);
        warm.push(w);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(t, 1));
  g.setAttribute('aPhase', new THREE.Float32BufferAttribute(phase, 1));
  g.setAttribute('aWarm', new THREE.Float32BufferAttribute(warm, 1));
  return { geometry: g, nodes };
}

/**
 * Silk streams (replaces the brush-like bands): fine, even particles spread across
 * soft ribbons that glide slowly along great-circle arcs. Positions are computed in the
 * shader from each stream's frame (aE1/aE2) so the particles really flow.
 */
export function buildStreams(streamCount: number, perStream: number, seed: number) {
  const rand = mulberry32(seed);
  const e1: number[] = [], e2: number[] = [], prm: number[] = [], prm2: number[] = [], pos: number[] = [];
  const axis = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
  for (let s = 0; s < streamCount; s++) {
    axis.set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
    a.set(1, 0, 0); if (Math.abs(axis.x) > 0.9) a.set(0, 0, 1);
    a.crossVectors(axis, a).normalize(); b.crossVectors(axis, a).normalize();
    const start = rand() * Math.PI * 2, span = Math.PI * (0.9 + rand() * 0.7);
    const speed = (0.012 + rand() * 0.01) * (rand() < 0.5 ? 1 : -1);
    const warm = s % 2 === 0 ? 1 : 0, width = 0.05 + rand() * 0.045, wave = rand() * 6.28;
    for (let i = 0; i < perStream; i++) {
      // Lateral offset: gaussian across the ribbon, so its edges fade softly.
      const g = (rand() + rand() + rand() - 1.5) / 1.5;
      e1.push(a.x, a.y, a.z); e2.push(b.x, b.y, b.z);
      prm.push(start, span, rand(), speed);          // start angle, arc length, position along (0–1), flow speed
      prm2.push(g * width, warm, wave, rand());       // lateral offset, warm, wave phase, sparkle seed
      pos.push(axis.x, axis.y, axis.z);               // the stream's axis (its normal); the arc is rebuilt in the shader
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aE1', new THREE.Float32BufferAttribute(e1, 3));
  geo.setAttribute('aE2', new THREE.Float32BufferAttribute(e2, 3));
  geo.setAttribute('aPrm', new THREE.Float32BufferAttribute(prm, 4));
  geo.setAttribute('aPrm2', new THREE.Float32BufferAttribute(prm2, 4));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);
  return geo;
}

/** Sparkle dust in a thin shell around the sphere. */
export function buildDust(count: number, inner: number, outer: number, seed: number) {
  const rand = mulberry32(seed);
  const positions: number[] = [];
  const phase: number[] = [];
  const size: number[] = [];
  const warm: number[] = [];
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    v.set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
    const r = inner + Math.pow(rand(), 2.2) * (outer - inner);
    v.multiplyScalar(r);
    positions.push(v.x, v.y, v.z);
    phase.push(rand());
    size.push(0.5 + rand() * 1.6);
    warm.push(rand() < 0.25 ? 1 : 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('aPhase', new THREE.Float32BufferAttribute(phase, 1));
  g.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
  g.setAttribute('aWarm', new THREE.Float32BufferAttribute(warm, 1));
  return g;
}
