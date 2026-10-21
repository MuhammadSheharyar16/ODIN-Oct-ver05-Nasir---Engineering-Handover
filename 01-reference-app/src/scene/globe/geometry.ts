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
 * Energy bands: tilted partial great circles sampled densely as points,
 * so they read as thick luminous strands that swirl around the core.
 */
export function buildBands(bandCount: number, pointsPerBand: number, seed: number) {
  const rand = mulberry32(seed);
  const positions: number[] = [];
  const along: number[] = [];
  const band: number[] = [];
  const warm: number[] = [];
  const size: number[] = [];
  const axis = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  for (let b = 0; b < bandCount; b++) {
    axis.set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
    const span = Math.PI * (1.1 + rand() * 0.8);
    const start = rand() * Math.PI * 2;
    // Roughly half the strands warm amber, half cool blue, like the concept art.
    const isWarm = b % 2 === 0 ? 1 : 0;
    const width = 0.6 + rand() * 0.8;
    for (let i = 0; i < pointsPerBand; i++) {
      const u = i / (pointsPerBand - 1);
      const a = start + u * span;
      const jitter = (rand() - 0.5) * 0.035 * width;
      p.set(Math.cos(a), jitter, Math.sin(a)).normalize().applyQuaternion(q).multiplyScalar(1.012 + rand() * 0.012);
      positions.push(p.x, p.y, p.z);
      along.push(u);
      band.push(b / bandCount);
      warm.push(isWarm);
      // Strands taper at both ends.
      size.push((0.6 + Math.sin(u * Math.PI) * 1.4) * (0.7 + rand() * 0.6) * width);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('aAlong', new THREE.Float32BufferAttribute(along, 1));
  g.setAttribute('aBand', new THREE.Float32BufferAttribute(band, 1));
  g.setAttribute('aWarm', new THREE.Float32BufferAttribute(warm, 1));
  g.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
  return g;
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
