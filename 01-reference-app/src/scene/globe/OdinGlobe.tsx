import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { buildBands, buildDust, buildLattice, mulberry32 } from './geometry';
import { PRESENCE_DEPTH, screenLengthToWorld, screenToWorld } from '../../lib/layout';
import { useLayout } from '../../state/layout';
import { odinAudio } from '../../audio/odinAudio';
import { intro } from '../../lib/intro';
import { damp, prefersReducedMotion } from '../../lib/motion';
import { presence } from '../../odin/experience';

/**
 * ODIN presence: a luminous network sphere (approved 2.1 direction).
 * All layers are additive light — no global bloom — so the daylight
 * environment keeps its exposure. Colours authored in display space.
 * `uForm` drives the intro: particles converge from a wide vortex.
 */

const additive = {
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
} as const;

const READING_LENS = /* glsl */ `
  // 1 inside the zone where the readout text sits (front of globe), else 0.
  float readingLens(vec3 mv, vec3 c) {
    vec3 d = mv - c;
    float L = max(length(d), 1e-4);
    vec2 r = d.xy / L;
    float zone = ((r.x / 0.8) * (r.x / 0.8)) + (((r.y + 0.05) / 0.44) * ((r.y + 0.05) / 0.44));
    float front = smoothstep(0.0, 0.5, dot(normalize(d), normalize(-mv)));
    return (1.0 - smoothstep(0.55, 1.0, zone)) * front;
  }
`;

const coreShader = {
  vertex: /* glsl */ `
    varying vec3 vN;
    varying vec3 vV;
    varying vec3 vP;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vN = normalize(normalMatrix * normal);
      vV = normalize(-mv.xyz);
      vP = position;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragment: /* glsl */ `
    uniform float uTime;
    uniform float uEnergy;
    uniform float uForm;
    varying vec3 vN;
    varying vec3 vV;
    varying vec3 vP;
    void main() {
      float facing = max(dot(vN, vV), 0.0);
      float fres = pow(max(1.0 - facing, 0.0), 2.2);
      float swirl = 0.5 + 0.5 * sin(vP.x * 5.0 + uTime * 0.35 + sin(vP.y * 4.0 - uTime * 0.27) * 1.6 + vP.z * 3.0);
      float swirl2 = 0.5 + 0.5 * sin(vP.y * 7.0 - uTime * 0.22 + vP.x * 2.0);
      vec3 deep = vec3(0.006, 0.016, 0.095);
      vec3 mid = vec3(0.026, 0.070, 0.330);
      vec3 col = mix(deep, mid, 0.1 + 0.55 * swirl * swirl2 * (1.0 - fres));
      // Electric blue to violet rim, like the concept art.
      vec3 rim = mix(vec3(0.25, 0.55, 1.0), vec3(0.62, 0.42, 1.0), 0.5 + 0.5 * sin(atan(vN.y, vN.x) * 2.0 + uTime * 0.2));
      col += rim * fres * (1.25 + 0.6 * uEnergy);
      // Glass: soft specular highlight from the upper left (the room's daylight).
      vec3 L = normalize(vec3(-0.45, 0.6, 0.65));
      float spec = pow(max(max(dot(reflect(-L, vN), vV), 0.0), 0.0), 38.0);
      float sheen = pow(max(max(dot(vN, L), 0.0), 0.0), 3.0) * 0.12;
      col += vec3(1.0, 0.97, 0.92) * (spec * 0.55 + sheen);
      // Translucent body: the room shows faintly through the centre, denser at the rim.
      float alpha = mix(0.74, 0.98, smoothstep(0.0, 0.85, fres)) + spec * 0.2;
      gl_FragColor = vec4(col, min(alpha, 1.0) * smoothstep(0.35, 0.95, uForm));
    }
  `,
};

const latticeShader = {
  vertex: /* glsl */ `
    attribute float aT;
    attribute float aPhase;
    attribute float aWarm;
    varying float vT;
    varying float vPhase;
    varying float vWarm;
    varying float vFacing;
    varying float vLens;
    ${READING_LENS}
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vec3 c = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      vFacing = dot(normalize(mv.xyz - c), normalize(-mv.xyz));
      vLens = readingLens(mv.xyz, c);
      vT = aT; vPhase = aPhase; vWarm = aWarm;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragment: /* glsl */ `
    uniform float uTime;
    uniform float uEnergy;
    uniform float uForm;
    varying float vT;
    varying float vPhase;
    varying float vWarm;
    varying float vFacing;
    varying float vLens;
    void main() {
      float front = smoothstep(-0.25, 0.35, vFacing);
      float head = fract(uTime * (0.18 + vPhase * 0.12) + vPhase);
      float pulse = exp(-(((head - vT) * 9.0) * ((head - vT) * 9.0)));
      vec3 blue = vec3(0.16, 0.48, 1.0);
      vec3 warm = vec3(1.0, 0.42, 0.10);
      vec3 col = mix(blue, warm, vWarm);
      float a = (0.12 + 1.15 * pulse * (0.7 + 0.6 * uEnergy)) * mix(0.16, 1.0, front) * (1.0 - 0.82 * vLens);
      a *= smoothstep(0.55, 1.0, uForm);
      gl_FragColor = vec4(col * a, 1.0);
    }
  `,
};

const pointsShader = {
  vertex: /* glsl */ `
    uniform float uTime;
    uniform float uScale;
    uniform float uEnergy;
    uniform float uForm;
    attribute float aSize;
    attribute float aWarm;
    attribute float aAlong;
    attribute float aBand;
    attribute float aPhase;
    varying float vWarm;
    varying float vGlow;
    varying float vFacing;
    varying float vLens;
    varying float vForm;
    ${READING_LENS}
    void main() {
      // Intro: converge from a wide, rotating vortex onto the sphere.
      float seed = fract(sin(dot(position, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
      float f = clamp(uForm * 1.3 - seed * 0.3, 0.0, 1.0);
      f = 1.0 - pow(max(1.0 - f, 0.0), 3.0);
      float spinA = (1.0 - f) * (2.6 + seed * 1.5);
      mat2 rot = mat2(cos(spinA), -sin(spinA), sin(spinA), cos(spinA));
      vec3 scattered = normalize(position + vec3(seed - 0.5, fract(seed * 7.0) - 0.5, fract(seed * 13.0) - 0.5) * 0.7) * (2.4 + seed * 3.0);
      scattered.xz = rot * scattered.xz;
      vec3 p = mix(scattered, position, f);
      vForm = f;

      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      vec3 c = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      vFacing = mix(1.0, dot(normalize(mv.xyz - c), normalize(-mv.xyz)), f);
      vLens = readingLens(mv.xyz, c) * f;
      float head = fract(uTime * 0.11 + aBand * 3.7);
      float travel = exp(-(((head - aAlong) * 7.0) * ((head - aAlong) * 7.0)));
      float twinkle = 0.55 + 0.45 * sin(uTime * (1.3 + aPhase * 2.1) + aPhase * 40.0);
      vGlow = mix(twinkle, 0.5 + 1.5 * travel, step(0.0001, aBand + aAlong));
      vGlow *= 0.8 + 0.6 * uEnergy;
      vWarm = aWarm;
      gl_PointSize = aSize * uScale * (0.85 + 0.35 * vGlow);
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragment: /* glsl */ `
    uniform float uBackFade;
    uniform float uForm;
    varying float vWarm;
    varying float vGlow;
    varying float vFacing;
    varying float vLens;
    varying float vForm;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d);
      a *= a;
      float front = mix(uBackFade, 1.0, smoothstep(-0.3, 0.3, vFacing));
      vec3 cool = vec3(0.16, 0.46, 1.0);
      vec3 warm = vec3(1.0, 0.40, 0.08);
      vec3 col = mix(cool, warm, vWarm) * (0.5 + 0.85 * vGlow);
      col += vec3(1.0, 0.92, 0.85) * smoothstep(0.14, 0.0, d) * 0.18 * vGlow;
      float appear = smoothstep(0.0, 0.25, uForm);
      gl_FragColor = vec4(col * a * front * (1.0 - 0.8 * vLens) * appear, 1.0);
    }
  `,
};

const glowShader = {
  vertex: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragment: /* glsl */ `
    uniform vec3 uColor;
    uniform float uIntensity;
    uniform float uInner;
    uniform float uTime;
    uniform float uRipple;
    uniform float uRing;
    varying vec2 vUv;
    void main() {
      float d = length(vUv - 0.5) * 2.0;
      float halo = smoothstep(1.0, uInner, d);
      halo = ((halo) * (halo));
      // Ring mode: light only the band just outside the inner radius (true rim).
      if (uRing > 0.5) halo *= smoothstep(uInner - 0.1, uInner, d);
      // Speaking: concentric ripples spread across the floor ring.
      float rings = uRipple * pow(max(0.5 + 0.5 * sin(d * 26.0 - uTime * 5.0), 0.0), 6.0) * smoothstep(1.0, 0.25, d) * smoothstep(0.05, 0.25, d);
      vec3 rc = mix(vec3(0.45, 0.6, 1.0), vec3(0.72, 0.45, 1.0), d);
      gl_FragColor = vec4(uColor * halo * uIntensity + rc * rings * 0.9, 1.0);
    }
  `,
};

const beamShader = {
  vertex: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragment: /* glsl */ `
    uniform float uTime;
    uniform float uIntensity;
    uniform float uRise;
    varying vec2 vUv;
    void main() {
      // Rises from the floor (vUv.y = 0) upward during the intro.
      float rise = smoothstep(uRise, uRise - 0.12, vUv.y);
      float x = abs(vUv.x - 0.5) * 2.0;
      float core = exp(-x * x * 70.0);
      float soft = exp(-x * x * 7.0) * 0.4;
      float ends = 0.5 + 0.5 * (smoothstep(0.35, 0.0, vUv.y) + smoothstep(0.7, 1.0, vUv.y));
      float flicker = 0.9 + 0.1 * sin(uTime * 7.0 + vUv.y * 30.0);
      // Fine vertical data streaks inside the beam.
      float streaks = 0.75 + 0.25 * sin(vUv.x * 140.0 + sin(vUv.y * 3.0 + uTime) * 2.0);
      vec3 col = mix(vec3(0.38, 0.66, 1.0), vec3(0.88, 0.96, 1.0), core);
      gl_FragColor = vec4(col * (core + soft * streaks) * ends * flicker * uIntensity * rise, 1.0);
    }
  `,
};

const raysShader = {
  vertex: /* glsl */ `
    attribute float aTop;
    attribute float aHue;
    varying float vTop;
    varying float vHue;
    void main() { vTop = aTop; vHue = aHue; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragment: /* glsl */ `
    uniform float uIntensity;
    varying float vTop;
    varying float vHue;
    void main() {
      vec3 a = vec3(0.7, 0.88, 1.0);
      vec3 b = mix(vec3(1.0, 0.72, 0.95), vec3(0.62, 0.55, 1.0), vHue);
      vec3 col = mix(a, b, vTop);
      gl_FragColor = vec4(col * pow(max(1.0 - vTop, 0.0), 1.25) * 1.35 * uIntensity, 1.0);
    }
  `,
};

const RAYS = 72;

export function OdinGlobe() {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const layout = useLayout((s) => s.home);
  const reduced = useMemo(prefersReducedMotion, []);
  const spin = useRef<THREE.Group>(null);
  const energy = useRef(0);

  const floor = useMemo(() => screenToWorld(layout.ring.x, layout.ring.y, PRESENCE_DEPTH, size), [layout, size]);
  const floorHalf = useMemo(() => screenLengthToWorld(layout.ring.halfWidth, PRESENCE_DEPTH, size), [layout, size]);
  /** Live presence (screen px + form), eased toward the director's target. */
  const cur = useRef({ x: layout.globe.x, y: layout.globe.y, r: layout.globe.r, form: 1 });
  const body = useRef<THREE.Group>(null);
  const beamMesh = useRef<THREE.Mesh>(null);
  const raysOn = useRef(1);

  const lattice = useMemo(() => buildLattice(280, 3, 7), []);
  const bands = useMemo(() => buildBands(14, 700, 11), []);
  const dust = useMemo(() => buildDust(1300, 1.0, 1.14, 3), []);
  const nodes = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const rand = mulberry32(5);
    const pos: number[] = [];
    const ph: number[] = [];
    const sz: number[] = [];
    const wm: number[] = [];
    for (const n of lattice.nodes) {
      pos.push(n.x * 1.006, n.y * 1.006, n.z * 1.006);
      ph.push(rand());
      sz.push(1.4 + rand() * 2.6);
      wm.push(rand() < 0.35 ? 1 : 0);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aPhase', new THREE.Float32BufferAttribute(ph, 1));
    g.setAttribute('aSize', new THREE.Float32BufferAttribute(sz, 1));
    g.setAttribute('aWarm', new THREE.Float32BufferAttribute(wm, 1));
    return g;
  }, [lattice]);

  // Light rays rise from the upper silhouette (camera-facing, never spinning).
  const rays = useMemo(() => {
    const rand = mulberry32(19);
    const xs = Array.from({ length: RAYS }, (_, i) => {
      const u = i / (RAYS - 1);
      return (u * 2 - 1) * 0.78 + (rand() - 0.5) * 0.018;
    });
    const seeds = xs.map(() => rand());
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(RAYS * 6), 3));
    lineGeo.setAttribute('aTop', new THREE.Float32BufferAttribute(xs.flatMap(() => [0, 1]), 1));
    lineGeo.setAttribute('aHue', new THREE.Float32BufferAttribute(seeds.flatMap((s) => [s, s]), 1));
    const tipGeo = new THREE.BufferGeometry();
    tipGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(RAYS * 3), 3));
    tipGeo.setAttribute('aSize', new THREE.Float32BufferAttribute(seeds.map((s) => 2.2 + s * 2.8), 1));
    tipGeo.setAttribute('aWarm', new THREE.Float32BufferAttribute(seeds.map((s) => (s > 0.8 ? 1 : 0)), 1));
    tipGeo.setAttribute('aPhase', new THREE.Float32BufferAttribute(seeds, 1));
    return { xs, seeds, lineGeo, tipGeo };
  }, []);

  const u = useMemo(() => {
    const pts = (backFade: number) => ({
      uTime: { value: 0 },
      uScale: { value: 1 },
      uEnergy: { value: 0 },
      uForm: { value: 0 },
      uBackFade: { value: backFade },
    });
    return {
      core: { uTime: { value: 0 }, uEnergy: { value: 0 }, uForm: { value: 0 } },
      lattice: { uTime: { value: 0 }, uEnergy: { value: 0 }, uForm: { value: 0 } },
      bands: pts(0.12),
      dust: pts(0.2),
      nodes: pts(0.2),
      tips: pts(1),
      halo: { uColor: { value: new THREE.Color(0.32, 0.5, 1.0) }, uIntensity: { value: 0.2 }, uInner: { value: 0.3 }, uTime: { value: 0 }, uRipple: { value: 0 }, uRing: { value: 0 } },
      rim: { uColor: { value: new THREE.Color(0.55, 0.6, 1.0) }, uIntensity: { value: 0.55 }, uInner: { value: 0.86 }, uTime: { value: 0 }, uRipple: { value: 0 }, uRing: { value: 1 } },
      floor: { uColor: { value: new THREE.Color(0.35, 0.62, 1.0) }, uIntensity: { value: 0.9 }, uInner: { value: 0.04 }, uTime: { value: 0 }, uRipple: { value: 0 }, uRing: { value: 0 } },
      beam: { uTime: { value: 0 }, uIntensity: { value: 1.0 }, uRise: { value: 0 } },
      rays: { uIntensity: { value: 0 } },
    };
  }, []);

  const materials = useRef<Record<string, THREE.ShaderMaterial | null>>({});
  const bind = (key: string) => (m: THREE.ShaderMaterial | null) => {
    materials.current[key] = m;
  };
  const time = useRef(0);
  const rayLine = useRef<THREE.LineSegments>(null);
  const rayTips = useRef<THREE.Points>(null);

  useFrame((_, dt) => {
    const step = reduced ? 0 : dt;
    time.current += step;
    const t = time.current;
    energy.current = damp(energy.current, odinAudio.level, 10, dt);
    const e = energy.current;

    // Presence: follow Home layout, or the scene target set by the director.
    const tgt = presence.followHome ? { x: layout.globe.x, y: layout.globe.y, r: layout.globe.r, form: 1 } : presence.target;
    const c = cur.current;
    c.x = damp(c.x, tgt.x, 3.4, dt);
    c.y = damp(c.y, tgt.y, 3.4, dt);
    c.r = damp(c.r, tgt.r, 3.4, dt);
    c.form = damp(c.form, tgt.form, tgt.form < c.form ? 2.6 : 2.0, dt);
    const [gx, gy, gz] = screenToWorld(c.x, c.y, PRESENCE_DEPTH, size);
    const R = screenLengthToWorld(c.r, PRESENCE_DEPTH, size);
    if (body.current) {
      body.current.position.set(gx, gy, gz);
      body.current.scale.setScalar(Math.max(0.0001, R));
      body.current.visible = c.form > 0.003;
    }
    // Beam from the globe's underside down to the floor ring.
    if (beamMesh.current) {
      const top = gy - R * 0.96;
      const h = Math.max(0.001, top - floor[1]);
      beamMesh.current.position.set(gx, top - h / 2, gz);
      beamMesh.current.scale.set(R * 0.38, h, 1);
      beamMesh.current.visible = c.form > 0.02 && top > floor[1] && presence.followHome;
    }
    const pointScale = (c.r / 228) * dpr;
    const form = intro.globe * c.form;

    for (const [key, m] of Object.entries(materials.current)) {
      if (!m) continue;
      const un = m.uniforms;
      if (un.uTime) un.uTime.value = t;
      if (un.uEnergy) un.uEnergy.value = e;
      if (un.uForm) un.uForm.value = form;
      if (un.uScale) un.uScale.value = pointScale * (key === 'dust' ? 1.6 : key === 'tips' ? 3.0 : key === 'nodes' ? 2.6 : 3.9);
      if (un.uRipple) un.uRipple.value = key === 'floor' ? e * intro.beam : 0;
    }
    const halo = materials.current.halo?.uniforms;
    if (halo) halo.uIntensity.value = (0.2 + e * 0.25) * form;
    const rim = materials.current.rim?.uniforms;
    if (rim) rim.uIntensity.value = (0.55 + e * 0.35) * form;
    const beam = materials.current.beam?.uniforms;
    if (beam) {
      beam.uRise.value = intro.beam * 1.15;
      beam.uIntensity.value = c.form;
    }
    const floorU = materials.current.floor?.uniforms;
    if (floorU) floorU.uIntensity.value = 0.9 * intro.beam * (0.45 + 0.55 * c.form);
    const raysU = materials.current.rays?.uniforms;
    raysOn.current = damp(raysOn.current, presence.followHome ? 1 : 0, 3, dt);
    if (raysU) raysU.uIntensity.value = intro.energy * c.form * raysOn.current;
    if (spin.current) spin.current.rotation.y += step * (0.05 + (1 - form) * 0.6);

    // Ray heights: calm shimmer at idle; ODIN's own output level lifts them.
    const line = rayLine.current?.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    const tips = rayTips.current?.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (line && tips) {
      for (let i = 0; i < RAYS; i++) {
        const x = rays.xs[i];
        const s = rays.seeds[i];
        const env = Math.pow(1 - Math.min(1, Math.abs(x) / 0.8), 0.9);
        const idle = 0.32 + 0.28 * (0.5 + 0.5 * Math.sin(t * (0.5 + s * 0.8) + s * 20));
        const bin = odinAudio.bins[Math.floor(Math.abs(x) * 40)] ?? 0;
        const speak = e * 0.5 + bin * 1.1;
        const h = (idle + speak) * env * (0.45 + s * 0.95) * intro.energy * c.form * raysOn.current;
        const baseY = Math.sqrt(Math.max(0, 1 - x * x)) * 0.97;
        line.setXYZ(i * 2, x, baseY, 0.02);
        line.setXYZ(i * 2 + 1, x, baseY + h, 0.02);
        tips.setXYZ(i, x, baseY + h, 0.02);
      }
      line.needsUpdate = true;
      tips.needsUpdate = true;
    }
  });

  return (
    <>
      <mesh ref={beamMesh} renderOrder={3}>
        <planeGeometry />
        <shaderMaterial ref={bind('beam')} vertexShader={beamShader.vertex} fragmentShader={beamShader.fragment} uniforms={u.beam} {...additive} />
      </mesh>
      <mesh position={floor} scale={[floorHalf * 2.3, floorHalf * 0.42, 1]} renderOrder={3}>
        <planeGeometry />
        <shaderMaterial ref={bind('floor')} vertexShader={glowShader.vertex} fragmentShader={glowShader.fragment} uniforms={u.floor} {...additive} />
      </mesh>

      {/* Globe body in unit-radius space; position/scale driven per frame. */}
      <group ref={body}>
        <mesh position={[0, 0, -1.2]} scale={3.4} renderOrder={2}>
          <planeGeometry />
          <shaderMaterial ref={bind('halo')} vertexShader={glowShader.vertex} fragmentShader={glowShader.fragment} uniforms={u.halo} {...additive} />
        </mesh>
        <group rotation={[0.34, 0, -0.12]}>
          <group ref={spin}>
            <mesh renderOrder={4}>
              <sphereGeometry args={[1, 96, 64]} />
              <shaderMaterial ref={bind('core')} vertexShader={coreShader.vertex} fragmentShader={coreShader.fragment} uniforms={u.core} transparent depthWrite={false} toneMapped={false} />
            </mesh>
            <lineSegments geometry={lattice.geometry} renderOrder={5}>
              <shaderMaterial ref={bind('lattice')} vertexShader={latticeShader.vertex} fragmentShader={latticeShader.fragment} uniforms={u.lattice} {...additive} />
            </lineSegments>
            <points geometry={bands} renderOrder={6}>
              <shaderMaterial ref={bind('bands')} vertexShader={pointsShader.vertex} fragmentShader={pointsShader.fragment} uniforms={u.bands} {...additive} />
            </points>
            <points geometry={nodes} renderOrder={6}>
              <shaderMaterial ref={bind('nodes')} vertexShader={pointsShader.vertex} fragmentShader={pointsShader.fragment} uniforms={u.nodes} {...additive} />
            </points>
            <points geometry={dust} renderOrder={6}>
              <shaderMaterial ref={bind('dust')} vertexShader={pointsShader.vertex} fragmentShader={pointsShader.fragment} uniforms={u.dust} {...additive} />
            </points>
          </group>
        </group>
        <mesh scale={2.25} renderOrder={7}>
          <planeGeometry />
          <shaderMaterial ref={bind('rim')} vertexShader={glowShader.vertex} fragmentShader={glowShader.fragment} uniforms={u.rim} {...additive} />
        </mesh>
        <lineSegments ref={rayLine} geometry={rays.lineGeo} renderOrder={8}>
          <shaderMaterial ref={bind('rays')} vertexShader={raysShader.vertex} fragmentShader={raysShader.fragment} uniforms={u.rays} {...additive} />
        </lineSegments>
        <points ref={rayTips} geometry={rays.tipGeo} renderOrder={8}>
          <shaderMaterial ref={bind('tips')} vertexShader={pointsShader.vertex} fragmentShader={pointsShader.fragment} uniforms={u.tips} {...additive} />
        </points>
      </group>
    </>
  );
}
