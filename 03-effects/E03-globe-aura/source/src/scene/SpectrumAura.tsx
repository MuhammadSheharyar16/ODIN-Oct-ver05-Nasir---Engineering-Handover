import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BIN_COUNT, odinAudio } from '../audio/odinAudio';
import { auraSnap, auraTarget } from '../lib/aura';
import { PRESENCE_DEPTH, screenLengthToWorld, screenToWorld } from '../lib/layout';
import { damp } from '../lib/motion';
import { floorRing } from '../lib/floorRing';

/**
 * ODIN speaking spectrum. Driven only by ODIN's OUTPUT audio. Two forms that
 * morph into each other:
 *  - wrap: hugs one object's silhouette (rounded-box SDF: circle, capsule or
 *    card) with concentric vibrating rings, radial spikes and a waveform;
 *  - floor: a perspective ring laid on the floor around a whole composition
 *    (journey, row of jars) with a voice curtain rising behind it and a soft
 *    reflection in front, so ODIN reads as speaking about everything at once.
 */

const AURA_DEPTH = PRESENCE_DEPTH + 0.6;

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const fragment = /* glsl */ `
  uniform vec2 uPlanePx;
  uniform vec2 uHalf;
  uniform float uRadius;
  uniform float uLevel;
  uniform float uPresence;
  uniform float uTime;
  uniform float uS;
  uniform float uGain;
  uniform sampler2D uBins;
  uniform float uMode;
  uniform float uFlat;   // 1 on journey pages: the voice lines at the home screen's strength (rings, glow, gain) plus a full curtain
  uniform float uRise;
  varying vec2 vUv;

  float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  float bin(float a) { return texture2D(uBins, vec2(0.03 + clamp(a, 0.0, 1.0) * 0.94, 0.5)).r; }

  vec3 palette(float a) {
    vec3 cool = vec3(0.52, 0.80, 1.0);
    vec3 violet = vec3(0.70, 0.52, 1.0);
    vec3 pink = vec3(1.0, 0.70, 0.95);
    return mix(mix(cool, violet, a), pink, 0.25 * sin(uTime * 0.7 + a * 6.0) + 0.25);
  }

  // Floor form: ellipse rings + rising curtain + reflection.
  vec3 floorForm(vec2 p, float lvl, float S) {
    vec2 h = max(uHalf, vec2(1.0));
    vec2 q = p / h;
    float er = length(q);
    vec2 g = q / (h * max(er, 1e-4));
    float d = (er - 1.0) / max(length(g), 1e-4);          // ≈ px distance to the ellipse
    float th = atan(q.y, q.x);
    float u = clamp(p.x / h.x * 0.5 + 0.5, 0.0, 1.0);      // left → right across the composition
    float b = bin(abs(u * 2.0 - 1.0));
    // Perspective: rings thin toward the back (top) of the floor ellipse.
    float persp = mix(0.55, 1.0, clamp(0.5 - q.y * 0.5, 0.0, 1.0));
    float rings = 0.0;
    for (int k = 0; k < 4; k++) {
      float fk = float(k);
      float wob = 0.6 + 0.4 * sin(th * (7.0 + fk * 3.0) + uTime * (3.0 + fk * 1.1) + u * 9.0);
      float rk = (fk * 13.0 - 6.0) * S * persp + b * lvl * (10.0 + fk * 9.0) * S * wob * persp;
      float w = (1.2 + fk * 0.5) * S * persp;
      rings += exp(-(((d - rk) / w) * ((d - rk) / w))) * (1.0 - fk * 0.24);
    }
    rings *= mix(0.62, 1.15, uFlat);
    // Floor wash inside the ring.
    float wash = smoothstep(1.0, 0.0, er) * 0.06 * (0.4 + 0.6 * lvl);
    // Curtain: spectrum bars rising from the back arc, behind the objects.
    float xn = clamp(p.x / h.x, -1.0, 1.0);
    float taper = sqrt(max(0.0, 1.0 - xn * xn));
    float yBack = h.y * taper;
    float col = floor(p.x / (7.0 * S));
    float cb = bin(fract(abs(col) * 0.0137 + 0.11) * 0.6 + abs(xn) * 0.4);
    float H = 8.0 * S + uRise * (0.2 + 0.8 * cb) * (0.35 + 0.65 * lvl) * (0.3 + 0.7 * taper);
    float above = p.y - yBack;
    float barMask = step(fract(p.x / (7.0 * S)), 0.36) * step(0.0, above) * step(above, H) * step(abs(p.x), h.x);
    float curtain = barMask * pow(max(1.0 - clamp(above / max(H, 1.0), 0.0, 1.0), 0.0), 0.7) * (0.35 + 0.65 * taper);
    // Reflection: short faint bars below the front arc.
    float below = -yBack - p.y;
    float refl = step(fract(p.x / (7.0 * S)), 0.36) * step(0.0, below) * step(below, H * 0.35) * step(abs(p.x), h.x)
               * (1.0 - clamp(below / max(H * 0.35, 1.0), 0.0, 1.0)) * 0.22;
    float glow = exp(-abs(d) / (22.0 * S)) * (0.18 + 0.4 * lvl) * (1.0 + 0.4 * uFlat);
    vec3 c = palette(u);
    // Flat floor (journeys): the curtain and its reflection carry ODIN's voice at full strength.
    float I = rings + glow * 0.45 + wash + (curtain * (0.85 + 0.75 * uFlat) + refl * (1.0 + 1.2 * uFlat)) * (0.3 + 0.7 * lvl);
    return c * I + vec3(1.0) * rings * (0.22 + 0.06 * uFlat);
  }

  void main() {
    vec2 p = (vUv - 0.5) * uPlanePx;
    float d = sdRoundBox(p, uHalf, uRadius);
    float ang = atan(p.y, p.x);
    float a = abs(ang) / 3.14159265;        // mirror-symmetric around the object
    float b = bin(a);
    float lvl = uLevel;
    float S = uS;

    // Concentric rings that ride the voice.
    float rings = 0.0;
    for (int k = 0; k < 4; k++) {
      float fk = float(k);
      float wob = 0.6 + 0.4 * sin(ang * (5.0 + fk * 2.0) + uTime * (4.0 + fk * 1.3));
      float rk = (9.0 + fk * 16.0) * S + b * lvl * (20.0 + fk * 12.0) * S * wob;
      float w = (1.3 + fk * 0.6) * S;
      rings += exp(-(((d - rk) / w) * ((d - rk) / w))) * (1.0 - fk * 0.18);
    }
    float glow = exp(-max(d, 0.0) / (42.0 * S)) * (0.35 + 0.65 * lvl);

    // Radial spikes around the silhouette.
    float N = 128.0;
    float t = ang / 6.28318530 + 0.5;
    float idx = floor(t * N);
    float sf = fract(t * N);
    float bs = bin(abs(idx / N * 2.0 - 1.0));
    float L = (4.0 + bs * lvl * 110.0) * S;
    float line = smoothstep(0.36, 0.5, sf) * smoothstep(0.64, 0.5, sf);
    float along = d - 6.0 * S;
    float spike = line * step(0.0, along) * (1.0 - smoothstep(0.0, L, along)) * (0.5 + 0.5 * bs);

    // Horizontal waveform extending left and right of the object.
    float side = max(abs(p.x) - uHalf.x - 4.0 * S, 0.0);
    float reach = max(uPlanePx.x * 0.5 - uHalf.x, 1.0);
    float bx = clamp(side / reach, 0.0, 1.0);
    float bb = bin(fract(side / (180.0 * S)));
    float barH = (1.5 + bb * lvl * 64.0 * (1.0 - bx)) * S;
    float bars = step(fract(abs(p.x) / (6.5 * S)), 0.42) * step(abs(p.y), barH) * step(0.001, side) * pow(max(1.0 - bx, 0.0), 1.4);
    float hairline = exp(-((p.y / (0.8 * S)) * (p.y / (0.8 * S)))) * step(0.001, side) * (1.0 - bx) * 0.5;

    vec3 col = palette(a);
    float outside = smoothstep(-2.0 * S, 2.0 * S, d);
    float I = (rings * 1.15 + glow * 0.55 + spike * 1.0) * outside + (bars * 0.9 + hairline) * lvl;
    vec3 wrap = col * I + vec3(1.0) * rings * outside * 0.25;
    vec3 c = uMode < 0.01 ? wrap : mix(wrap, floorForm(p, lvl, S), uMode);
    gl_FragColor = vec4(c * uPresence * uGain, 1.0);
  }
`;

export function SpectrumAura() {
  const size = useThree((s) => s.size);
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const cur = useRef({ x: auraTarget.x, y: auraTarget.y, hw: auraTarget.hw, hh: auraTarget.hh, radius: auraTarget.radius, mode: 0, rise: 0 });
  const presence = useRef(0);

  const binsTex = useMemo(() => {
    const t = new THREE.DataTexture(new Uint8Array(BIN_COUNT), BIN_COUNT, 1, THREE.RedFormat, THREE.UnsignedByteType);
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearFilter;
    t.needsUpdate = true;
    return t;
  }, []);

  const uniforms = useMemo(
    () => ({
      uPlanePx: { value: new THREE.Vector2(1, 1) },
      uHalf: { value: new THREE.Vector2(1, 1) },
      uRadius: { value: 1 },
      uLevel: { value: 0 },
      uPresence: { value: 0 },
      uTime: { value: 0 },
      uS: { value: 1 },
      uGain: { value: 1 },
      uBins: { value: binsTex },
      uMode: { value: 0 },
      uRise: { value: 0 },
      uFlat: { value: 0 },
    }),
    [binsTex],
  );

  useFrame((_, dt) => {
    const m = mesh.current;
    const un = mat.current?.uniforms;
    if (!m || !un) return;
    // Ease the wrapped shape toward the focused object (shape morph).
    const c = cur.current;
    const k = 6;
    // A new screen (snap) or a hidden aura: be exactly where ODIN speaks, no travelling in.
    if (auraSnap.pending || presence.current < 0.04) {
      auraSnap.pending = false;
      Object.assign(c, { x: auraTarget.x, y: auraTarget.y, hw: auraTarget.hw, hh: auraTarget.hh, radius: auraTarget.radius, mode: auraTarget.mode, rise: auraTarget.rise });
    }
    c.x = damp(c.x, auraTarget.x, k, dt);
    c.y = damp(c.y, auraTarget.y, k, dt);
    c.hw = damp(c.hw, auraTarget.hw, k, dt);
    c.hh = damp(c.hh, auraTarget.hh, k, dt);
    c.radius = damp(c.radius, auraTarget.radius, k, dt);
    c.mode = damp(c.mode, auraTarget.mode, 4, dt);
    c.rise = damp(c.rise, auraTarget.rise, k, dt);

    presence.current = damp(presence.current, odinAudio.speaking || odinAudio.level > 0.02 ? 1 : 0, 4, dt);
    // Ring scale follows the object's smaller side, capped so large panels
    // (journey, compare) get a tight, elegant edge rather than a flood.
    const Sw = Math.min(1.1, Math.max(0.45, Math.min(c.hw, c.hh) / 228));
    const Sf = Math.min(1.05, Math.max(0.55, c.hw / 760));
    const S = Sw + (Sf - Sw) * c.mode;
    const margin = Math.min(320, Math.max(120, 260 * S));
    const planeW = Math.min(size.width * 1.4, c.hw * 2 + margin * 2);
    // Floor form also needs room for the rising curtain above the back arc.
    const planeH = c.hh * 2 + margin * 2 + c.mode * c.rise * 2.2;

    const [wx, wy, wz] = screenToWorld(c.x, c.y, AURA_DEPTH, size);
    m.position.set(wx, wy, wz);
    m.scale.set(screenLengthToWorld(planeW, AURA_DEPTH, size), screenLengthToWorld(planeH, AURA_DEPTH, size), 1);
    m.visible = presence.current > 0.002;

    const data = binsTex.image.data as Uint8Array;
    for (let i = 0; i < BIN_COUNT; i++) data[i] = Math.min(255, odinAudio.bins[i] * 255);
    binsTex.needsUpdate = true;

    un.uPlanePx.value.set(planeW, planeH);
    un.uHalf.value.set(c.hw, c.hh);
    un.uRadius.value = Math.min(c.radius, c.hw, c.hh);
    un.uLevel.value = damp(un.uLevel.value, odinAudio.level, 14, dt);
    un.uPresence.value = presence.current;
    un.uTime.value += dt;
    un.uS.value = S;
    un.uMode.value = c.mode;
    un.uFlat.value = damp(un.uFlat.value, floorRing.hidden ? 1 : 0, 6, dt);
    un.uRise.value = c.rise;
    // Large panels get a quieter edge so content stays the subject; the floor form keeps full voice.
    const wrapGain = Math.min(1, Math.max(0.42, 300 / Math.max(c.hw, c.hh)));
    // On the flat journey floor the voice gets the full gain of the home screen.
    un.uGain.value = wrapGain + (0.78 + 0.22 * un.uFlat.value - wrapGain) * c.mode;
  });

  return (
    <mesh ref={mesh} renderOrder={1.2}>
      <planeGeometry />
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}
