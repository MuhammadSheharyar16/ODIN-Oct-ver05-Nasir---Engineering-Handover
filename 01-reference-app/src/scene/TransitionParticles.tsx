import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { fx, type FxRect } from '../odin/fx';
import { PRESENCE_DEPTH, visibleHeightAt } from '../lib/layout';

/**
 * Particle morph (tier T5): particles sampled on the outline and body of the
 * outgoing components stream along curves through ODIN and settle onto the
 * outline of the incoming components, then fade as the real UI resolves.
 * All motion is computed on the GPU from a single progress uniform.
 */

const COUNT = 4200;

const vertex = /* glsl */ `
  uniform float uT;          // seconds since burst
  uniform float uDur;
  uniform vec2 uViewport;    // CSS px
  uniform float uUpp;        // world units per CSS px at the particle depth
  uniform float uDepth;
  uniform float uDpr;
  uniform float uStyle;
  uniform vec2 uVia;
  attribute vec2 aFrom;
  attribute vec2 aVia;
  attribute vec2 aTo;
  attribute vec3 aColor;
  attribute vec2 aSeed;      // x: delay share, y: size/noise seed
  varying vec3 vColor;
  varying float vAlpha;

  vec2 bezier(vec2 a, vec2 b, vec2 c, float t) {
    float u = 1.0 - t;
    return u * u * a + 2.0 * u * t * b + t * t * c;
  }

  vec2 rot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

  void main() {
    int style = int(uStyle + 0.5);
    float delay = aSeed.x * 0.35 * uDur;
    if (style == 2) delay = (aFrom.x / uViewport.x) * 0.45 * uDur + aSeed.x * 0.08 * uDur;   // sweep left→right
    if (style == 3) delay = (1.0 - aFrom.y / uViewport.y) * 0.3 * uDur + aSeed.x * 0.12 * uDur; // rise bottom-first
    float life = uDur * 0.65;
    float t = clamp((uT - delay) / life, 0.0, 1.0);
    float e = t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(max(-2.0 * t + 2.0, 0.0), 3.0) / 2.0;
    float mid = sin(e * 3.14159);
    vec2 p;
    if (style == 1) {
      // Vortex: spiral around ODIN, drawn in then flung out to the new shapes.
      vec2 a = aFrom - uVia, b = aTo - uVia;
      float r = mix(length(a), length(b), e) * (1.0 - mid * 0.75);
      float ang = mix(atan(a.y, a.x), atan(b.y, b.x), e) + mid * (4.5 + aSeed.y * 2.0) * (aSeed.x > 0.5 ? 1.0 : -1.0);
      p = uVia + vec2(cos(ang), sin(ang)) * r;
    } else if (style == 2) {
      // Wave: a travelling sine front sweeping across the stage.
      p = mix(aFrom, aTo, e);
      p.y += mid * sin(p.x * 0.012 + uT * 7.0 + aSeed.y * 3.0) * (60.0 + aSeed.y * 70.0);
    } else if (style == 3) {
      // Rise: particles lift like embers, then settle into place.
      p = mix(aFrom, aTo, e) + vec2(sin(aSeed.y * 30.0 + uT * 3.0) * 24.0 * mid, -mid * (160.0 + aSeed.y * 260.0));
    } else if (style == 4) {
      // Scatter: burst outward from each old shape, then converge.
      vec2 dir = normalize(aFrom - uViewport * 0.5 + vec2(0.001));
      vec2 ctrl = aFrom + rot(dir, (aSeed.y - 0.5) * 1.6) * (220.0 + aSeed.x * 380.0);
      p = bezier(aFrom, ctrl, aTo, e);
    } else if (style == 5) {
      // Helix: twin strands braid from old to new.
      vec2 d = aTo - aFrom;
      vec2 n = normalize(vec2(-d.y, d.x) + vec2(0.001));
      p = mix(aFrom, aTo, e) + n * sin(e * 18.84 + (aSeed.x > 0.5 ? 3.14159 : 0.0)) * mid * (36.0 + aSeed.y * 30.0);
    } else {
      p = bezier(aFrom, aVia, aTo, e);
      float sw = mid * (18.0 + aSeed.y * 40.0);
      p += vec2(cos(aSeed.y * 40.0 + uT * 6.0), sin(aSeed.y * 31.0 + uT * 5.0)) * sw;
    }
    vec3 world = vec3((p.x - uViewport.x * 0.5) * uUpp, -(p.y - uViewport.y * 0.5) * uUpp, -uDepth);
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
    gl_PointSize = (1.6 + aSeed.y * 2.6) * (1.0 + mid * 1.4) * uDpr;
    vAlpha = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.82, 1.0, t)) * step(0.0001, t);
    vColor = mix(aColor, vec3(0.85, 0.93, 1.0), mid * 0.5);
  }
`;

const fragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor * a * a * vAlpha * 1.4, 1.0);
  }
`;

function rand(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** A point on a rect: mostly on the outline, some in the body. */
function samplePoint(r: FxRect, k: number): [number, number] {
  const a = rand(k * 3.1);
  const b = rand(k * 7.7);
  if (rand(k * 1.3) < 0.7) {
    const per = 2 * (r.w + r.h);
    let d = a * per;
    const x0 = r.x - r.w / 2;
    const y0 = r.y - r.h / 2;
    if (d < r.w) return [x0 + d, y0];
    d -= r.w;
    if (d < r.h) return [x0 + r.w, y0 + d];
    d -= r.h;
    if (d < r.w) return [x0 + r.w - d, y0 + r.h];
    d -= r.w;
    return [x0, y0 + r.h - d];
  }
  return [r.x + (a - 0.5) * r.w * 0.9, r.y + (b - 0.5) * r.h * 0.9];
}

function pickWeighted(rects: FxRect[], k: number) {
  const total = rects.reduce((s, r) => s + r.w + r.h, 0) || 1;
  let v = rand(k * 5.3) * total;
  for (const r of rects) {
    v -= r.w + r.h;
    if (v <= 0) return r;
  }
  return rects[rects.length - 1];
}

export function TransitionParticles() {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const pts = useRef<THREE.Points>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const version = useRef(0);

  const { geo, uniforms } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(COUNT * 3), 3));
    g.setAttribute('aFrom', new THREE.Float32BufferAttribute(new Float32Array(COUNT * 2), 2));
    g.setAttribute('aVia', new THREE.Float32BufferAttribute(new Float32Array(COUNT * 2), 2));
    g.setAttribute('aTo', new THREE.Float32BufferAttribute(new Float32Array(COUNT * 2), 2));
    g.setAttribute('aColor', new THREE.Float32BufferAttribute(new Float32Array(COUNT * 3), 3));
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(new Float32Array(COUNT * 2), 2));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    return {
      geo: g,
      uniforms: {
        uT: { value: 999 },
        uDur: { value: fx.duration },
        uViewport: { value: new THREE.Vector2(1, 1) },
        uUpp: { value: 1 },
        uDepth: { value: PRESENCE_DEPTH - 0.4 },
        uDpr: { value: 1 },
        uStyle: { value: 0 },
        uVia: { value: new THREE.Vector2() },
      },
    };
  }, []);

  useFrame(() => {
    // Write through the live material (R3F copies the uniforms object).
    const uniforms = mat.current?.uniforms;
    if (!uniforms) return;
    uniforms.uViewport.value.set(size.width, size.height);
    uniforms.uUpp.value = visibleHeightAt(PRESENCE_DEPTH - 0.4) / size.height;
    uniforms.uDpr.value = dpr;
    if (version.current !== fx.version) {
      version.current = fx.version;
      const from = fx.from.length ? fx.from : [{ x: fx.via.x, y: fx.via.y, w: 40, h: 40, accent: '#7fb6ff' }];
      const to = fx.to.length ? fx.to : [{ x: fx.via.x, y: fx.via.y, w: 40, h: 40, accent: '#7fb6ff' }];
      const aFrom = geo.getAttribute('aFrom') as THREE.BufferAttribute;
      const aVia = geo.getAttribute('aVia') as THREE.BufferAttribute;
      const aTo = geo.getAttribute('aTo') as THREE.BufferAttribute;
      const aColor = geo.getAttribute('aColor') as THREE.BufferAttribute;
      const aSeed = geo.getAttribute('aSeed') as THREE.BufferAttribute;
      const col = new THREE.Color();
      const salt = fx.version * 1000;
      for (let i = 0; i < COUNT; i++) {
        const k = i + salt;
        const rf = pickWeighted(from, k);
        const rt = pickWeighted(to, k + 0.5);
        const [fx0, fy0] = samplePoint(rf, k);
        const [tx, ty] = samplePoint(rt, k + 0.25);
        // Arc through ODIN with a little spread so streams braid.
        const spread = 60 + rand(k * 2.2) * 120;
        aFrom.setXY(i, fx0, fy0);
        aVia.setXY(i, fx.via.x + (rand(k * 4.4) - 0.5) * spread, fx.via.y + (rand(k * 6.6) - 0.5) * spread * 0.6);
        aTo.setXY(i, tx, ty);
        col.set(rand(k * 9.1) < 0.5 ? rf.accent : rt.accent);
        aColor.setXYZ(i, col.r, col.g, col.b);
        aSeed.setXY(i, rand(k * 8.8), rand(k * 3.3));
      }
      for (const a of [aFrom, aVia, aTo, aColor, aSeed]) a.needsUpdate = true;
    }
    const t = (performance.now() - fx.startedAt) / 1000;
    uniforms.uT.value = t;
    uniforms.uStyle.value = fx.style;
    uniforms.uVia.value.set(fx.via.x, fx.via.y);
    if (pts.current) pts.current.visible = t >= 0 && t < fx.duration + 0.2;
  });

  return (
    <points ref={pts} geometry={geo} frustumCulled={false} renderOrder={20}>
      <shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}
