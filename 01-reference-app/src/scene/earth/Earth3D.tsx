import { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import { geoEquirectangular, geoPath } from 'd3-geo';
import landTopo from 'world-atlas/land-110m.json';
import type { Topology, GeometryCollection } from 'topojson-specification';
import { proxies } from '../../odin/fx';
import { PRESENCE_DEPTH, screenLengthToWorld, screenToWorld } from '../../lib/layout';
import { prefersReducedMotion } from '../../lib/motion';

/**
 * Data Earth (v5.1): digital neon continents (faint cyan fill, fine dot grid, glowing
 * coastline) on a translucent deep-glass ocean with a faint graticule, an atmosphere
 * halo, orbit rings and a slow ring of light dust, light spikes rising from each ranked
 * country, and blue light arcs converging on the UAE: a glow sheath, a cyan core with a
 * travelling pulse, light motes streaming in (blue → white), a pulse ring at each
 * origin and a ripple at the UAE.
 * Follows a DOM proxy (kind 'earth') whose data lists {lat, lon, value, accent}.
 */

type Pin = { lat: number; lon: number; value: number; accent?: string };

let cachedTex: THREE.CanvasTexture | null = null;
function landTexture() {
  if (cachedTex) return cachedTex;
  const W = 2048;
  const H = 1024;
  const mask = document.createElement('canvas');
  mask.width = W;
  mask.height = H;
  const mctx = mask.getContext('2d')!;
  const topo = landTopo as unknown as Topology<{ land: GeometryCollection }>;
  const land = feature(topo, topo.objects.land);
  const proj = geoEquirectangular().fitSize([W, H], { type: 'Sphere' } as never);
  const path = geoPath(proj, mctx);
  mctx.fillStyle = '#fff';
  mctx.beginPath();
  path(land as never);
  mctx.fill();
  const data = mctx.getImageData(0, 0, W, H).data;

  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const ctx = out.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  // Digital neon land: R = soft land fill, G = fine dot grid, B = glowing coastline.
  const tint = (c: string, src: HTMLCanvasElement, alpha = 1, blur = 0) => {
    const t = document.createElement('canvas'); t.width = W; t.height = H;
    const tc = t.getContext('2d')!;
    if (blur) tc.filter = `blur(${blur}px)`;
    tc.drawImage(src, 0, 0); tc.filter = 'none';
    tc.globalCompositeOperation = 'source-in'; tc.fillStyle = c; tc.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha; ctx.drawImage(t, 0, 0); ctx.globalAlpha = 1;
  };
  tint('#ff0000', mask, 0.55);
  // Coastline: the mask minus a slightly shrunk copy, plus a soft glow.
  const edge = document.createElement('canvas'); edge.width = W; edge.height = H;
  const ec = edge.getContext('2d')!;
  ec.drawImage(mask, 0, 0); ec.globalCompositeOperation = 'destination-out'; ec.filter = 'blur(2.2px)'; ec.drawImage(mask, 0, 0); ec.filter = 'none';
  tint('#0000ff', edge, 1);
  tint('#0000ff', edge, 0.55, 4);
  ctx.globalCompositeOperation = 'source-over';
  const step = 6;
  for (let y = step / 2; y < H; y += step) {
    // Compensate dot spacing toward the poles.
    const lat = (0.5 - y / H) * Math.PI;
    const sx = step / Math.max(0.25, Math.cos(lat));
    for (let x = (y / step) % 2 ? sx / 2 : 0; x < W; x += sx) {
      const i = ((y | 0) * W + (x | 0)) * 4;
      if (data[i] > 128) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(x, y, 1.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  }
  cachedTex = new THREE.CanvasTexture(out);
  cachedTex.anisotropy = 8;
  return cachedTex;
}

const earthVert = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;

const earthFrag = /* glsl */ `
  uniform sampler2D uLand; uniform float uTime; uniform float uOpacity;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main(){
    vec4 L = texture2D(uLand, vUv);
    float facing = max(dot(normalize(vN), normalize(vV)), 0.0);
    float fres = pow(max(1.0 - facing, 0.0), 2.4);
    // Deep translucent glass ocean with a faint digital graticule.
    vec3 ocean = mix(vec3(0.01, 0.03, 0.12), vec3(0.03, 0.09, 0.26), pow(max(facing, 0.0), 1.5));
    vec2 g = abs(fract(vec2(vUv.x * 36.0, vUv.y * 18.0)) - 0.5);
    float grat = (1.0 - smoothstep(0.0, 0.035, min(g.x, g.y))) * 0.10;
    // Neon land: a faint cyan fill, fine twinkling dots and a glowing coastline (not solid).
    float scan = 0.85 + 0.15 * sin(vUv.y * 900.0 - uTime * 1.5);
    float tw = 0.7 + 0.3 * sin(uTime * 1.6 + vUv.x * 420.0 + vUv.y * 310.0);
    vec3 neon = vec3(0.28, 0.85, 1.0);
    vec3 col = ocean + vec3(0.25, 0.6, 1.0) * grat * (1.0 - L.r);
    col += neon * L.r * 0.5 * scan;
    col += mix(neon, vec3(0.9, 0.98, 1.0), 0.35) * L.g * tw * 1.25;
    col += mix(neon, vec3(0.75, 0.95, 1.0), 0.4) * L.b * 2.2;
    // Soft light from the upper left and a glint on the glass.
    vec3 Ld = normalize(vec3(-0.55, 0.45, 0.75));
    vec3 N = normalize(vN), V = normalize(vV);
    float lam = max(dot(N, Ld), 0.0);
    col *= mix(0.75, 1.1, lam);
    float spec = pow(max(dot(reflect(-Ld, N), V), 0.0), 28.0);
    col += vec3(0.75, 0.88, 1.0) * spec * 0.35;
    // Atmosphere rim.
    col += vec3(0.45, 0.7, 1.0) * fres * 1.3;
    // Translucent: the room shows faintly through the ocean; land and rim stay bright.
    float alpha = clamp(mix(0.72, 1.0, fres) + L.b * 0.3 + L.g * 0.2, 0.0, 1.0) * uOpacity;
    gl_FragColor = vec4(col, alpha);
  }`;

const atmoFrag = /* glsl */ `
  uniform float uOpacity; varying vec2 vUv;
  void main(){ float d = length(vUv - 0.5) * 2.0; float g = smoothstep(1.0, 0.62, d) * smoothstep(0.42, 0.62, d); gl_FragColor = vec4(vec3(0.42, 0.68, 1.0) * g * 0.9 * uOpacity, 1.0); }`;

const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false } as const;

/** Atmosphere shell (back faces): a limb glow that hugs the sphere. */
const haloVert = /* glsl */ `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const haloFrag = /* glsl */ `uniform float uOpacity; varying vec3 vN; varying vec3 vV;
  void main(){ float i = pow(clamp(0.72 - dot(normalize(vN), normalize(vV)) * -1.0, 0.0, 1.0), 3.2); gl_FragColor = vec4(vec3(0.38, 0.66, 1.0) * i * 1.7 * uOpacity, 1.0); }`;

/** Soft round light motes (arcs, dust): size in screen px via uPx, colour and alpha per point. */
const moteVert = /* glsl */ `attribute float aSize; attribute float aAlpha; attribute vec3 aColor; uniform float uPx; varying float vA; varying vec3 vC;
  void main(){ vA = aAlpha; vC = aColor; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = aSize * uPx; gl_Position = projectionMatrix * mv; }`;
const moteFrag = /* glsl */ `varying float vA; varying vec3 vC;
  void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; if (r > 1.0) discard; float core = exp(-r * r * 9.0); float halo = exp(-r * r * 2.4) * 0.45;
    gl_FragColor = vec4(mix(vC, vec3(1.0), core * 0.7) * (core + halo) * vA, 1.0); }`;

/** Ring that fades out as it grows (origin pulses, UAE ripple). */
const ringFrag = /* glsl */ `uniform vec3 uColor; uniform float uA; varying vec2 vUv; void main(){ gl_FragColor = vec4(uColor * uA, 1.0); }`;
const ringVert = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const Z = new THREE.Vector3(0, 0, 1);
/** R3F copies the uniforms prop; bind the material to the object we update every frame. */
const bind = (u: Record<string, THREE.IUniform>) => (m: THREE.ShaderMaterial | null) => { if (m) m.uniforms = u; };

function latLonToVec(lat: number, lon: number, r = 1) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

/** Light arcs: every ranked country streams into the UAE (great-circle, lifted). */
const UAE = { lat: 24.4, lon: 54.4 };
const arcVert = `
  varying float vT;
  void main() { vT = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const arcFrag = `
  uniform vec3 uColor; uniform float uTime; uniform float uOpacity; uniform float uSeed; uniform float uGlow;
  varying float vT;
  void main() {
    float x = fract(vT - uTime * 0.32 + uSeed) - 0.5;
    float pulse = exp(-(x * x) / 0.0036);
    float base = 0.38 * smoothstep(0.0, 0.08, vT) * smoothstep(1.0, 0.9, vT);
    float draw = step(vT, clamp(uOpacity * 1.4 - 0.2, 0.0, 1.0));
    // Solid (normal-blended) gold line with a white-hot travelling pulse: reads on
    // both the dark ocean and the bright dotted land.
    float a = clamp(base * 2.2 + pulse, 0.0, 1.0) * uOpacity * draw;
    // Glow sheath (additive, wide, faint) or the solid core.
    if (uGlow > 0.5) { gl_FragColor = vec4(uColor * (base * 0.55 + pulse * 0.9) * uOpacity * draw, 1.0); return; }
    gl_FragColor = vec4(mix(uColor, vec3(0.88, 0.97, 1.0), pulse * 0.8), a);
  }`;

function arcCurve(lat: number, lon: number) {
  const a = latLonToVec(lat, lon, 1.0);
  const b = latLonToVec(UAE.lat, UAE.lon, 1.0);
  const pts: THREE.Vector3[] = [];
  const ang = a.angleTo(b);
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    const p = new THREE.Vector3().copy(a).lerp(b, t).normalize();
    // Lifted well above the surface so short regional arcs still read as arcs.
    p.multiplyScalar(1.0 + Math.sin(Math.PI * t) * (0.16 + ang * 0.5));
    pts.push(p);
  }
  return new THREE.CatmullRomCurve3(pts);
}

function EarthObject({ id }: { id: string }) {
  const size = useThree((s) => s.size);
  const proxy = proxies.get(id)!;
  const { pins, focusLon = 55, focusLat = 18 } = proxy.data as { pins: Pin[]; focusLon?: number; focusLat?: number };
  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const mats = useRef<THREE.ShaderMaterial[]>([]);
  const tex = useMemo(landTexture, []);
  const uni = useMemo(() => ({ uLand: { value: tex }, uTime: { value: 0 }, uOpacity: { value: 0 } }), [tex]);
  const atmo = useMemo(() => ({ uOpacity: { value: 0 } }), []);
  const t = useRef(0);
  const spikeRef = useRef<THREE.LineSegments>(null);

  const spikes = useMemo(() => {
    const max = Math.max(...pins.map((p) => p.value), 1);
    const pos: number[] = [];
    const col: number[] = [];
    const c = new THREE.Color();
    for (const p of pins) {
      const h = 0.12 + 0.42 * (p.value / max);
      // A small cluster of rays per country, like the concept.
      for (let k = 0; k < 7; k++) {
        const jl = p.lat + (Math.sin(k * 2.1) * 2.5);
        const jo = p.lon + (Math.cos(k * 1.7) * 2.5);
        const a = latLonToVec(jl, jo, 1.005);
        const b = latLonToVec(jl, jo, 1.005 + h * (0.55 + 0.45 * Math.abs(Math.sin(k * 1.3))));
        pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
        c.set(p.accent ?? '#9fd0ff');
        col.push(c.r, c.g, c.b, 1, 1, 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return g;
  }, [pins]);
  const arcs = useMemo(
    () =>
      pins
        .filter((p) => Math.abs(p.lat - UAE.lat) + Math.abs(p.lon - UAE.lon) > 4)
        .map((p, i) => {
          const curve = arcCurve(p.lat, p.lon);
          const col = new THREE.Color(i < 5 ? '#3fb4ff' : '#7cc8ff');
          return {
            lat: p.lat, lon: p.lon, top: i < 5,
            geo: new THREE.TubeGeometry(curve, 64, i < 5 ? 0.012 : 0.008, 8, false),
            glow: new THREE.TubeGeometry(curve, 64, i < 5 ? 0.034 : 0.022, 8, false),
            lut: curve.getSpacedPoints(160),
            // Warm gold reads against the blue ocean and continents.
            u: { uColor: { value: col }, uTime: { value: 0 }, uOpacity: { value: 0 }, uSeed: { value: i * 0.137 }, uGlow: { value: 0 } },
            ug: { uColor: { value: col }, uTime: { value: 0 }, uOpacity: { value: 0 }, uSeed: { value: i * 0.137 }, uGlow: { value: 1 } },
          };
        }),
    [pins],
  );
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const dpr = useThree((s) => s.viewport.dpr);

  // Light motes streaming along every arc into the UAE (CPU-driven, a few hundred points).
  const motes = useMemo(() => {
    const per = arcs.map((a) => (a.top ? 64 : 34));
    const n = per.reduce((x, y) => x + y, 0);
    const meta: { arc: number; ph: number; sp: number; sz: number }[] = [];
    arcs.forEach((_, i) => { for (let k = 0; k < per[i]; k++) meta.push({ arc: i, ph: Math.random(), sp: 0.07 + Math.random() * 0.09, sz: 0.6 + Math.random() * 0.9 }); });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(n), 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(n), 1));
    return { g, meta };
  }, [arcs]);
  const moteU = useMemo(() => ({ uPx: { value: 1 } }), []);

  // Slow ring of light dust around the globe.
  const dust = useMemo(() => {
    const n = 900;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), al = new Float32Array(n), sz = new Float32Array(n);
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const r = 1.16 + Math.pow(Math.random(), 1.6) * 0.62, a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = (Math.random() - 0.5) * 0.05 * r; pos[i * 3 + 2] = Math.sin(a) * r;
      c.set(Math.random() < 0.18 ? '#e6f7ff' : '#a8d4ff'); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      al[i] = 0.45 + Math.random() * 0.55; sz[i] = 0.4 + Math.random() * 0.8;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(al, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    return { g, base: al.slice() };
  }, []);
  const dustU = useMemo(() => ({ uPx: { value: 1 } }), []);

  // Particle sphere (same language as the application core): a shell of coloured lights just above
  // the surface, turning on its own axis and twinkling; the Earth hides the far side.
  const shell = useMemo(() => {
    const n = 2400;
    const pal = ['#9fd0ff', '#9fd0ff', '#6fe0ff', '#4f9cff', '#a67cff', '#ffffff'];
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), al = new Float32Array(n), sz = new Float32Array(n);
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, rr = 1.012 + Math.pow(Math.random(), 2) * 0.07, q = Math.sqrt(1 - u * u);
      pos[i * 3] = q * Math.cos(th) * rr; pos[i * 3 + 1] = u * rr; pos[i * 3 + 2] = q * Math.sin(th) * rr;
      c.set(pal[Math.floor(Math.random() * pal.length)]); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      al[i] = 0.35 + Math.random() * 0.65; sz[i] = 0.35 + Math.random() * 0.75;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(al, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    return { g, base: al.slice() };
  }, []);
  const shellU = useMemo(() => ({ uPx: { value: 1 } }), []);
  const shellRef = useRef<THREE.Points>(null);
  const dustRef = useRef<THREE.Points>(null);
  const haloU = useMemo(() => ({ uOpacity: { value: 0 } }), []);

  // Origin pulses (one per arc) and a two-ring ripple at the UAE.
  const rings = useMemo(() => {
    const mk = (lat: number, lon: number, color: string, big: boolean) => {
      const n = latLonToVec(lat, lon, 1).normalize();
      return { pos: n.clone().multiplyScalar(1.004), q: new THREE.Quaternion().setFromUnitVectors(Z, n), u: { uColor: { value: new THREE.Color(color) }, uA: { value: 0 } }, big };
    };
    return [
      ...arcs.map((a) => mk(a.lat, a.lon, '#6cc4ff', false)),
      mk(UAE.lat, UAE.lon, '#bfe8ff', true),
      mk(UAE.lat, UAE.lon, '#3fb4ff', true),
    ];
  }, [arcs]);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const ringGeo = useMemo(() => new THREE.RingGeometry(0.82, 1, 48), []);
  const beaconU = useMemo(() => ({ uColor: { value: new THREE.Color('#bfe8ff') }, uA: { value: 0 } }), []);
  const arcMats = useRef<(THREE.ShaderMaterial | null)[]>([]);
  const spikeMat = useMemo(() => new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), []);
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#a8d4ff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), []);
  const [, force] = useState(0);
  void force;

  useFrame((_, dt) => {
    const g = root.current;
    if (!g) return;
    t.current += dt;
    const r = proxy.el.getBoundingClientRect();
    const morph = proxy.el.closest<HTMLElement>('[data-morph]');
    const op = morph ? parseFloat(morph.style.opacity || getComputedStyle(morph).opacity || '1') : 1;
    const [x, y, z] = screenToWorld(r.left + r.width / 2, r.top + r.height / 2, PRESENCE_DEPTH, size);
    g.position.set(x, y, z);
    const R = screenLengthToWorld(Math.min(r.width, r.height) / 2, PRESENCE_DEPTH, size);
    // Grow in from a point as it forms.
    const e = Math.min(1, op);
    g.scale.setScalar(Math.max(0.0001, R * (0.55 + 0.45 * e)));
    g.visible = op > 0.01 && r.width > 1;
    uni.uTime.value = t.current;
    uni.uOpacity.value = op;
    atmo.uOpacity.value = op;
    spikeMat.opacity = op * (0.8 + 0.2 * Math.sin(t.current * 3));
    ringMat.opacity = op * 0.55;
    if (spin.current) {
      // Face the focus region; gentle sway keeps spikes visible.
      spin.current.rotation.y = THREE.MathUtils.degToRad(-focusLon - 90) + Math.sin(t.current * 0.12) * 0.18 + (1 - e) * 1.2;
      spin.current.rotation.x = THREE.MathUtils.degToRad(focusLat * 0.6);
    }
    const T = reduced ? 0 : t.current;
    const pxR = Math.min(r.width, r.height) / 2;
    moteU.uPx.value = pxR * 0.02 * dpr;
    dustU.uPx.value = pxR * 0.034 * dpr;
    shellU.uPx.value = pxR * 0.03 * dpr;
    if (shellRef.current) { shellRef.current.rotation.y = T * 0.05; shellRef.current.rotation.z = Math.sin(T * 0.07) * 0.08; }
    {
      const A = shell.g.attributes.aAlpha.array as Float32Array;
      for (let i = 0; i < A.length; i++) A[i] = shell.base[i] * op * (0.55 + 0.45 * Math.sin(T * 1.7 + i * 2.39));
      shell.g.attributes.aAlpha.needsUpdate = true;
    }
    haloU.uOpacity.value = op;
    // Motes: advance along each arc's lookup table, fade in/out, warm gold → white-hot at the UAE.
    {
      const P = motes.g.attributes.position.array as Float32Array, C = motes.g.attributes.aColor.array as Float32Array;
      const A = motes.g.attributes.aAlpha.array as Float32Array, S = motes.g.attributes.aSize.array as Float32Array;
      motes.meta.forEach((m, i) => {
        const lut = arcs[m.arc].lut, tt = (m.ph + T * m.sp) % 1, f = tt * (lut.length - 1), k = Math.floor(f), w = f - k;
        const a = lut[k], b = lut[Math.min(lut.length - 1, k + 1)];
        P[i * 3] = a.x + (b.x - a.x) * w; P[i * 3 + 1] = a.y + (b.y - a.y) * w; P[i * 3 + 2] = a.z + (b.z - a.z) * w;
        const hot = Math.pow(tt, 3);
        C[i * 3] = 0.3 + 0.65 * hot; C[i * 3 + 1] = 0.72 + 0.26 * hot; C[i * 3 + 2] = 1;
        // Thin out as they converge on the UAE so the arcs stay readable.
        A[i] = Math.min(1, tt * 8, (1 - tt) * 5) * op * (arcs[m.arc].top ? 0.85 : 0.6) * (1 - hot * 0.45);
        S[i] = m.sz * (0.9 + hot * 0.4);
      });
      motes.g.attributes.position.needsUpdate = true; motes.g.attributes.aColor.needsUpdate = true;
      motes.g.attributes.aAlpha.needsUpdate = true; motes.g.attributes.aSize.needsUpdate = true;
    }
    // Dust: slow orbit with a gentle twinkle.
    if (dustRef.current) dustRef.current.rotation.y = -T * 0.03;
    {
      const A = dust.g.attributes.aAlpha.array as Float32Array;
      for (let i = 0; i < A.length; i++) A[i] = dust.base[i] * op * (0.7 + 0.3 * Math.sin(T * 1.3 + i * 1.7));
      dust.g.attributes.aAlpha.needsUpdate = true;
    }
    // Rings: origins pulse in turn; the UAE ripples continuously.
    rings.forEach((rg, i) => {
      const m = ringRefs.current[i];
      if (!m) return;
      const s = rg.big ? (T / 2.4 + (i === rings.length - 1 ? 0.5 : 0)) % 1 : (T / 3.2 + i * 0.29) % 1;
      m.scale.setScalar(rg.big ? 0.02 + s * 0.1 : 0.012 + s * 0.05);
      rg.u.uA.value = (1 - s) * (1 - s) * (rg.big ? 0.5 : 0.45) * op;
    });
    beaconU.uA.value = op * (0.35 + 0.15 * Math.sin(T * 3.2));
    // Write through the live materials (R3F clones the uniforms prop).
    for (const m of arcMats.current) {
      if (!m) continue;
      m.uniforms.uTime.value = T;
      m.uniforms.uOpacity.value = op;
    }
    for (const m of mats.current) {
      if (!m?.uniforms) continue;
      m.uniforms.uOpacity.value = op;
      if (m.uniforms.uTime) m.uniforms.uTime.value = t.current;
    }
  });

  return (
    <group ref={root}>
      <mesh scale={2.5} position={[0, 0, -0.8]} renderOrder={2}>
        <planeGeometry />
        <shaderMaterial vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`} fragmentShader={atmoFrag} uniforms={atmo} {...additive} ref={(m) => { if (m) mats.current[0] = m; }} />
      </mesh>
      {/* Atmosphere shell hugging the limb */}
      <mesh scale={1.14} renderOrder={3}>
        <sphereGeometry args={[1, 64, 48]} />
        <shaderMaterial ref={bind(haloU)} vertexShader={haloVert} fragmentShader={haloFrag} uniforms={haloU} side={THREE.BackSide} {...additive} />
      </mesh>
      <group ref={spin}>
        <mesh renderOrder={4}>
          <sphereGeometry args={[1, 128, 96]} />
          <shaderMaterial vertexShader={earthVert} fragmentShader={earthFrag} uniforms={uni} transparent depthWrite toneMapped={false} ref={(m) => { if (m) mats.current[1] = m; }} />
        </mesh>
        <lineSegments ref={spikeRef} geometry={spikes} material={spikeMat} renderOrder={6} />
        {arcs.map((a, i) => (
          <mesh key={`g${i}`} geometry={a.glow} renderOrder={7}>
            <shaderMaterial
              ref={(m) => {
                arcMats.current[arcs.length + i] = m;
              }}
              vertexShader={arcVert}
              fragmentShader={arcFrag}
              uniforms={a.ug}
              {...additive}
            />
          </mesh>
        ))}
        {arcs.map((a, i) => (
          <mesh key={i} geometry={a.geo} renderOrder={7}>
            <shaderMaterial
              ref={(m) => {
                arcMats.current[i] = m;
              }}
              vertexShader={arcVert}
              fragmentShader={arcFrag}
              uniforms={a.u}
              transparent
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
        <points geometry={motes.g} renderOrder={9}>
          <shaderMaterial ref={bind(moteU)} vertexShader={moteVert} fragmentShader={moteFrag} uniforms={moteU} {...additive} />
        </points>
        {rings.map((rg, i) => (
          <mesh key={`r${i}`} ref={(m) => { ringRefs.current[i] = m; }} geometry={ringGeo} position={rg.pos} quaternion={rg.q} renderOrder={8}>
            <shaderMaterial ref={bind(rg.u)} vertexShader={ringVert} fragmentShader={ringFrag} uniforms={rg.u} side={THREE.DoubleSide} {...additive} />
          </mesh>
        ))}
        {/* UAE: destination beacon with a halo */}
        <mesh position={latLonToVec(UAE.lat, UAE.lon, 1.012)} renderOrder={8}>
          <sphereGeometry args={[0.022, 16, 16]} />
          <meshBasicMaterial color="#e6f7ff" toneMapped={false} />
        </mesh>
        <mesh position={latLonToVec(UAE.lat, UAE.lon, 1.014)} quaternion={rings[rings.length - 1].q} scale={0.045} geometry={ringGeo} renderOrder={8}>
          <shaderMaterial ref={bind(beaconU)} vertexShader={ringVert} fragmentShader={ringFrag} uniforms={beaconU} side={THREE.DoubleSide} {...additive} />
        </mesh>
      </group>
      {/* Particle sphere: coloured lights just above the surface, on their own slow axis */}
      <group rotation={[0.38, 0, 0.1]}>
        <points ref={shellRef} geometry={shell.g} renderOrder={6}>
          <shaderMaterial ref={bind(shellU)} vertexShader={moteVert} fragmentShader={moteFrag} uniforms={shellU} {...additive} />
        </points>
      </group>
      {/* Light dust in a slow ring around the globe */}
      <group rotation={[0.32, 0.2, 0.12]}>
        <points ref={dustRef} geometry={dust.g} renderOrder={5}>
          <shaderMaterial ref={bind(dustU)} vertexShader={moteVert} fragmentShader={moteFrag} uniforms={dustU} {...additive} />
        </points>
      </group>
      {/* Orbit rings */}
      <mesh rotation={[1.25, 0.2, 0.15]} material={ringMat} renderOrder={5}>
        <torusGeometry args={[1.28, 0.006, 8, 256]} />
      </mesh>
      <mesh rotation={[1.4, -0.35, -0.25]} material={ringMat} renderOrder={5}>
        <torusGeometry args={[1.42, 0.004, 8, 256]} />
      </mesh>
    </group>
  );
}

export function EarthObjects() {
  const sig = useRef('');
  const [, setTick] = useState(0);
  useFrame(() => {
    const v = [...proxies.entries()].filter(([, p]) => p.kind === 'earth').map(([k]) => k).join('|');
    if (v !== sig.current) {
      sig.current = v;
      setTick((x) => x + 1);
    }
  });
  return (
    <>
      {[...proxies.entries()]
        .filter(([, p]) => p.kind === 'earth')
        .map(([id]) => (
          <EarthObject key={id} id={id} />
        ))}
    </>
  );
}
