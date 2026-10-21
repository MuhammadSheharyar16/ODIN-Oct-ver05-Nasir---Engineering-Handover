import { useEffect, useMemo, useRef } from 'react';
import { backdropMode } from '../lib/backdrop';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useStage } from '../state/store';
import { damp, prefersReducedMotion } from '../lib/motion';
import { CAMERA_FOV, IMAGE_ASPECT, OVERSCAN, envView } from '../lib/envFit';
import { intro } from '../lib/intro';
import { envParallax } from '../lib/layout';

/**
 * The canonical daylight environment as two real depth layers:
 * the exterior waterfront plate behind, the interior arch (true alpha in the
 * opening) in front. Pixels are used as supplied — no regrading. Both planes
 * are scaled proportionally to depth so that, at rest, they project to the
 * same screen rectangle as the original composite; camera drift then gives
 * genuine parallax. The sky drifts; skyline, sun and water stay put.
 */

export const INTERIOR_DEPTH = 10;
export const EXTERIOR_DEPTH = 15;
/** Water horizon in the exterior plate, UV space (0 = bottom). */
const HORIZON_V = 0.385;

function pickVariant() {
  const px = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
  if (px > 2600) return 3840;
  if (px > 1700) return 2560;
  return 1600;
}

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D map;
  uniform sampler2D mapBlur;
  uniform float uTime;
  uniform float uBlur;        // 0 = sharp, 1 = fully receded
  uniform float uDim;         // 1 = original exposure
  uniform float uSaturation;
  uniform float uShimmer;     // water shimmer (exterior only)
  uniform float uClouds;      // cloud drift (exterior only)
  uniform float uReveal;      // intro: 0 dark & soft → 1 as supplied
  uniform float uDof;         // depth-of-field lens blur radius in UV (0 = off): a light, real blur, not the receded plate
  varying vec2 vUv;

  // Skyline silhouette of the exterior plate (UV y of the highest building
  // per column band). Measured from the master; sky lies above it.
  float skyline(float x) {
    float v = 0.443;
    v = x >= 0.480 ? 0.469 : v;
    v = x >= 0.565 ? 0.546 : v;
    v = x >= 0.675 ? 0.469 : v;
    v = x >= 0.689 ? 0.618 : v;
    v = x >= 0.748 ? 0.530 : v;
    v = x >= 0.842 ? 0.449 : v;
    v = x >= 0.875 ? 0.490 : v;
    return v;
  }
  float skyMask(vec2 uv) {
    float edge = skyline(uv.x) + 0.012;
    float m = smoothstep(edge, edge + 0.035, uv.y);
    // Keep the sun disc steady.
    float sun = smoothstep(0.035, 0.075, distance(uv * vec2(1.634, 1.0), vec2(0.869 * 1.634, 0.512)));
    return m * mix(0.25, 1.0, sun);
  }

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }

  vec4 clouds(vec2 uv) {
    vec4 base = texture2D(map, uv);
    float m = skyMask(uv);
    if (m <= 0.0) return base;
    // Two-phase flow (crossfaded offsets, noise-desynchronised) gives a
    // continuous slow drift without a seamless texture.
    float n = vnoise(uv * vec2(4.0, 9.0));
    float ph = uTime / 26.0 + n * 0.65;
    float f1 = fract(ph);
    float f2 = fract(ph + 0.5);
    float amp = 0.018;
    vec2 warp = vec2(0.0, sin(uv.x * 7.0 + uTime * 0.05) * 0.0012);
    vec2 uv1 = uv - vec2((f1 - 0.5) * amp, 0.0) + warp;
    vec2 uv2 = uv - vec2((f2 - 0.5) * amp, 0.0) + warp;
    float w1 = 1.0 - abs(2.0 * f1 - 1.0);
    // Never pull building pixels into the sky.
    float k1 = skyMask(uv1), k2 = skyMask(uv2);
    vec4 c1 = mix(base, texture2D(map, uv1), k1);
    vec4 c2 = mix(base, texture2D(map, uv2), k2);
    vec4 flowed = c1 * w1 + c2 * (1.0 - w1);
    return mix(base, flowed, m);
  }

  void main() {
    vec2 uv = vUv;
    if (uShimmer > 0.0) {
      float below = clamp((${HORIZON_V.toFixed(3)} - uv.y) / ${HORIZON_V.toFixed(3)}, 0.0, 1.0);
      float w = below * below * uShimmer;
      uv.x += sin(uv.y * 820.0 + uTime * 1.4) * 0.00055 * w;
      uv.y += sin(uv.x * 540.0 - uTime * 0.9) * 0.00035 * w;
    }
    vec4 sharp = uClouds > 0.0 ? clouds(uv) : texture2D(map, uv);
    if (uDof > 0.0) {
      // Two rings of taps around the centre (golden-angle offsets), weighted towards the centre.
      vec4 acc = sharp * 2.0;
      float wsum = 2.0;
      for (int i = 0; i < 12; i++) {
        float fi = float(i);
        float a = fi * 2.39996;
        float rr = (i < 6 ? 0.5 : 1.0) * uDof;
        vec2 o = vec2(cos(a), sin(a) * 1.634) * rr;
        float w = i < 6 ? 1.2 : 0.8;
        acc += texture2D(map, uv + o) * w;
        wsum += w;
      }
      sharp = acc / wsum;
    }
    vec4 soft = texture2D(mapBlur, vUv);
    float blur = max(uBlur, 1.0 - uReveal);
    vec4 c = mix(sharp, soft, smoothstep(0.0, 1.0, blur));
    float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
    c.rgb = mix(vec3(l), c.rgb, uSaturation) * uDim * mix(0.0, 1.0, pow(uReveal, 0.7));
    gl_FragColor = c;
    #include <colorspace_fragment>
  }
`;

/** Depth-of-field lens blur radius (UV) on the exterior: a few px, like a lens focused on the room. */
const DOF_RADIUS = 0.0016;

type LayerProps = {
  name: 'exterior' | 'interior';
  depth: number;
  transparent?: boolean;
  effects?: boolean;
  focusBlur: number;
  focusDim: number;
  focusSaturation: number;
};

function Layer({ name, depth, transparent, effects, focusBlur, focusDim, focusSaturation }: LayerProps) {
  // Small variant first so the scene appears immediately; hi-res swaps in after.
  const [small, blurTexture] = useTexture([`/env/${name}-1600.webp`, `/env/${name}-blur.webp`]);
  const viewport = useThree((s) => s.size);
  const reduced = useMemo(prefersReducedMotion, []);
  const focusRef = useRef(0);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useMemo(() => {
    for (const t of [small, blurTexture]) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      t.needsUpdate = true;
    }
  }, [small, blurTexture]);

  useEffect(() => {
    const variant = pickVariant();
    if (variant === 1600) return;
    let cancelled = false;
    new THREE.TextureLoader().load(`/env/${name}-${variant}.webp`, (hi) => {
      if (cancelled) return hi.dispose();
      hi.colorSpace = THREE.SRGBColorSpace;
      hi.anisotropy = 8;
      const u = materialRef.current?.uniforms;
      if (u) u.map.value = hi;
    });
    return () => {
      cancelled = true;
    };
  }, [name]);

  const uniforms = useMemo(
    () => ({
      map: { value: small },
      mapBlur: { value: blurTexture },
      uTime: { value: 0 },
      uBlur: { value: 0 },
      uDim: { value: 1 },
      uSaturation: { value: 1 },
      uShimmer: { value: effects && !reduced ? 1 : 0 },
      uClouds: { value: effects && !reduced ? 1 : 0 },
      uReveal: { value: 0 },
      uDof: { value: 0 },
    }),
    [small, blurTexture, effects, reduced],
  );

  const scale = useMemo(() => {
    const visibleH = 2 * depth * Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
    const aspect = viewport.width / viewport.height;
    let h = visibleH * OVERSCAN;
    let w = h * IMAGE_ASPECT;
    if (aspect > IMAGE_ASPECT) {
      w = visibleH * aspect * OVERSCAN;
      h = w / IMAGE_ASPECT;
    }
    return [w, h, 1] as const;
  }, [depth, viewport.width, viewport.height]);

  // Backdrop blur (src/lib/backdrop.ts): 'none' sharp (default) · 'dof' exterior lens blur · 'full' both layers
  // receded (the previous style). Eased so a change never pops. Dimming is separate: off unless ?dim=1.
  const dofAmt = useRef(0), fullAmt = useRef(0);
  const undimmed = useMemo(() => typeof location === 'undefined' || new URLSearchParams(location.search).get('dim') !== '1', []);

  useFrame((_, dt) => {
    // Write through the live material: the renderer binds the uniforms object
    // the program was compiled with, which may differ from a re-memoised one.
    const u = materialRef.current?.uniforms;
    if (!u) return;
    const target = useStage.getState().focus;
    focusRef.current = damp(focusRef.current, target, 3.2, dt);
    const f = focusRef.current;
    u.uTime.value += dt;
    const mode = backdropMode();
    dofAmt.current = damp(dofAmt.current, mode === 'dof' ? 1 : 0, 6, dt);
    fullAmt.current = damp(fullAmt.current, mode === 'full' ? 1 : 0, 6, dt);
    u.uBlur.value = fullAmt.current * focusBlur;
    u.uDof.value = name === 'exterior' ? DOF_RADIUS * dofAmt.current : 0;
    u.uDim.value = undimmed ? 1 : 1 - f * (1 - focusDim);
    u.uSaturation.value = undimmed ? 1 : 1 - f * (1 - focusSaturation);
    u.uReveal.value = intro.env;
    // Camera push: scale the artwork and bring row `cy` to the screen centre.
    const m = meshRef.current;
    if (m) {
      const v = envView.cur;
      m.scale.set(scale[0] * v.zoom, scale[1] * v.zoom, 1);
      // Room parallax: moving the plane by −p reads exactly like the camera moving by +p (depth-correct).
      m.position.y = (v.cy - 0.5) * scale[1] * v.zoom - envParallax.y;
      m.position.x = -(v.cx - 0.5) * scale[0] * v.zoom - envParallax.x;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -depth]} scale={scale} renderOrder={transparent ? 1 : 0}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent={transparent}
        depthWrite={!transparent}
        toneMapped={false}
      />
    </mesh>
  );
}

export function EnvironmentLayers() {
  useFrame((_, dt) => {
    const c = envView.cur, t = envView.target;
    c.zoom = damp(c.zoom, t.zoom, 2.4, dt);
    c.cy = damp(c.cy, t.cy, 2.4, dt);
    c.cx = damp(c.cx, t.cx, 2.4, dt);
  });
  return (
    <group>
      <Layer name="exterior" depth={EXTERIOR_DEPTH} effects focusBlur={0.85} focusDim={0.78} focusSaturation={0.82} />
      <Layer
        name="interior"
        depth={INTERIOR_DEPTH}
        transparent
        focusBlur={0.45}
        focusDim={0.72}
        focusSaturation={0.85}
      />
    </group>
  );
}
