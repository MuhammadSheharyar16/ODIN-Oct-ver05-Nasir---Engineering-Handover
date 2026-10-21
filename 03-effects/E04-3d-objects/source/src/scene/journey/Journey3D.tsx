import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { JourneySpec } from '../../odin/types';
import { proxies } from '../../odin/fx';
import { PRESENCE_DEPTH, screenLengthToWorld, screenToWorld } from '../../lib/layout';
import { journeyGeometry, journeyGeometryVertical } from '../../ui/scene/components/journeyGeometry';
import { JourneyObject, type ObjectKind } from './objects';

/**
 * 3D journey: chrome pedestals with glowing accent rims, floating glass step
 * objects, and a luminous light path (core + glow + pulses + sparkles) that
 * branches to approved / rejected. Lives in a local space where 1 unit =
 * journey box width; the whole group follows its DOM proxy every frame.
 */

const TILT = 0.42; // look down onto pedestal tops
/** Object size relative to pedestal radius (concept: objects dominate their pedestal). */
const OBJECT_SCALE = 1.45;

const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false } as const;

const haloShader = {
  vertex: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragment: `
    uniform vec3 uColor; uniform float uOpacity; uniform float uTime;
    varying vec2 vUv;
    void main(){
      float d = length(vUv - 0.5) * 2.0;
      float glow = pow(max(smoothstep(1.0, 0.0, d), 0.0), 2.2);
      float ring = exp(-(((d - 0.62) / 0.06) * ((d - 0.62) / 0.06))) * (0.75 + 0.25 * sin(uTime * 2.0));
      gl_FragColor = vec4(uColor * (glow * 0.9 + ring * 0.8) * uOpacity, 1.0);
    }`,
};

const topShader = {
  vertex: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragment: `
    uniform vec3 uColor; uniform float uOpacity; uniform float uTime;
    varying vec2 vUv;
    void main(){
      float d = length(vUv - 0.5) * 2.0;
      float core = smoothstep(1.0, 0.0, d);
      float ripple = pow(max(0.5 + 0.5 * sin(d * 16.0 - uTime * 2.2), 0.0), 10.0) * smoothstep(1.0, 0.25, d) * 0.6;
      float edge = exp(-(((d - 0.9) / 0.06) * ((d - 0.9) / 0.06)));
      vec3 c = uColor * (core * core * 0.55 + ripple + edge * 1.1) + vec3(0.9, 0.95, 1.0) * pow(max(core, 0.0), 6.0) * 0.35;
      gl_FragColor = vec4(c * uOpacity, 1.0);
    }`,
};

/** Soft contact shadow + floor occlusion so pedestals sit on the floor, not float. */
const shadowFrag = `
  uniform float uOpacity;
  varying vec2 vUv;
  void main(){
    float d = length((vUv - 0.5) * vec2(2.0, 2.0));
    float a = pow(max(smoothstep(1.0, 0.25, d), 0.0), 1.6) * 0.5 + ((smoothstep(0.62, 0.3, d)) * (smoothstep(0.62, 0.3, d))) * 0.35;
    gl_FragColor = vec4(vec3(0.02, 0.03, 0.07), a * uOpacity);
  }`;

/** Accent reflection streak on the polished floor, below each pedestal. */
const reflFrag = `
  uniform vec3 uColor; uniform float uOpacity; uniform float uTime;
  varying vec2 vUv;
  void main(){
    float x = abs(vUv.x - 0.5) * 2.0;
    float fall = pow(max(vUv.y, 0.0), 1.8);
    float a = smoothstep(1.0, 0.0, x) * fall * (0.85 + 0.15 * sin(uTime * 1.3 + vUv.y * 9.0));
    gl_FragColor = vec4(uColor * a * 0.28 * uOpacity, 1.0);
  }`;

const bloomFrag = `
  uniform vec3 uColor; uniform float uOpacity; uniform float uTime;
  varying vec2 vUv;
  void main(){
    float d = length(vUv - 0.5) * 2.0;
    float g = pow(max(smoothstep(1.0, 0.0, d), 0.0), 2.6) * (0.85 + 0.15 * sin(uTime * 1.6));
    gl_FragColor = vec4(uColor * g * 0.55 * uOpacity, 1.0);
  }`;

const tubeShader = {
  vertex: `
    varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
  fragment: `
    uniform vec3 uA; uniform vec3 uB; uniform float uTime; uniform float uOpacity; uniform float uCore; uniform float uSpeed; uniform float uDraw;
    varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main(){
      if (vUv.x > uDraw) discard;
      float facing = abs(dot(normalize(vN), normalize(vV)));
      float body = uCore > 0.5 ? pow(max(facing, 0.0), 0.6) : pow(max(facing, 0.0), 3.0) * 0.6;
      float p1 = exp(-(((fract(vUv.x * 2.0 - uTime * uSpeed) - 0.5) / 0.035) * ((fract(vUv.x * 2.0 - uTime * uSpeed) - 0.5) / 0.035)));
      float p2 = exp(-(((fract(vUv.x * 3.0 - uTime * uSpeed * 0.7 + 0.37) - 0.5) / 0.025) * ((fract(vUv.x * 3.0 - uTime * uSpeed * 0.7 + 0.37) - 0.5) / 0.025)));
      vec3 col = mix(uA, uB, vUv.x);
      vec3 c = col * body * (uCore > 0.5 ? 1.7 : 0.8) + vec3(1.0) * (p1 + p2 * 0.7) * body * (uCore > 0.5 ? 1.8 : 0.5);
      gl_FragColor = vec4(c * uOpacity, 1.0);
    }`,
};

const sparkShader = {
  vertex: `
    uniform float uTime; uniform float uScale;
    attribute float aSeed; attribute vec3 aColor;
    varying float vA; varying vec3 vC;
    void main(){
      vec3 p = position + vec3(0.0, sin(uTime * (0.6 + aSeed) + aSeed * 30.0) * 0.004, 0.0);
      vA = pow(max(0.5 + 0.5 * sin(uTime * (1.5 + aSeed * 3.0) + aSeed * 50.0), 0.0), 3.0);
      vC = aColor;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = uScale * (0.6 + aSeed * 1.4);
      gl_Position = projectionMatrix * mv;
    }`,
  fragment: `
    uniform float uOpacity; varying float vA; varying vec3 vC;
    void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4((vC + 0.4) * a * a * vA * uOpacity, 1.0); }`,
};

export type Station = { kind: ObjectKind | 'none'; accent: string; x: number; y: number; r: number; i: number; compact?: boolean; stack?: number; objectScale?: number; noBloom?: boolean };

const ICON_TO_OBJECT: Record<string, ObjectKind> = {
  submit: 'submit', payment: 'payment', review: 'review', upload: 'upload', biometric: 'biometric',
  calendar: 'calendar', documents: 'documents', checkin: 'checkin',
};

export function Pedestal({ st, reveal, time }: { st: Station; reveal: React.MutableRefObject<number[]>; time: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const obj = useRef<THREE.Group>(null);
  const haloMat = useRef<THREE.ShaderMaterial>(null);
  const topMat = useRef<THREE.ShaderMaterial>(null);
  const accent = useMemo(() => new THREE.Color(st.accent), [st.accent]);
  const chrome = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: '#eef2f8', metalness: 0.72, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 2.2, transparent: true }),
    [],
  );
  const chromeDark = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: '#c3ccda', metalness: 0.65, roughness: 0.3, envMapIntensity: 1.8, transparent: true }),
    [],
  );
  const topGlass = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: accent.clone().multiplyScalar(0.18), roughness: 0.08, metalness: 0.2, clearcoat: 1, envMapIntensity: 1.2, emissive: accent, emissiveIntensity: 0.18, transparent: true }),
    [accent],
  );
  const rim = useMemo(() => new THREE.MeshBasicMaterial({ color: accent.clone().lerp(new THREE.Color('#ffffff'), 0.2), transparent: true, toneMapped: false }), [accent]);
  const halo = useMemo(() => ({ uColor: { value: accent.clone() }, uOpacity: { value: 0 }, uTime: { value: 0 } }), [accent]);
  const top = useMemo(() => ({ uColor: { value: accent.clone() }, uOpacity: { value: 0 }, uTime: { value: 0 } }), [accent]);
  const lastOp = useRef(-1);
  const bloomMat = useRef<THREE.ShaderMaterial>(null);
  const bloom = useMemo(() => ({ uColor: { value: accent.clone() }, uOpacity: { value: 0 }, uTime: { value: 0 } }), [accent]);
  const shadowMat = useRef<THREE.ShaderMaterial>(null);
  const reflMat = useRef<THREE.ShaderMaterial>(null);
  const shadowU = useMemo(() => ({ uOpacity: { value: 0 } }), []);
  const reflU = useMemo(() => ({ uColor: { value: accent.clone() }, uOpacity: { value: 0 }, uTime: { value: 0 } }), [accent]);

  // Glass objects draw after the spectrum so its curtain sits behind them.
  useEffect(() => {
    obj.current?.traverse((o) => {
      if (o.renderOrder === 0) o.renderOrder = 1.45;
    });
  }, [st.kind]);

  useFrame(() => {
    const rv = reveal.current[st.i] ?? 0;
    const g = group.current;
    if (!g) return;
    g.visible = rv > 0.005;
    const e = 1 - Math.pow(1 - rv, 3);
    g.scale.setScalar(st.r * (0.6 + 0.4 * e));
    if (obj.current) {
      const t = time.current;
      obj.current.position.y = (1 - e) * -0.8 + Math.sin(t * 1.1 + st.i * 1.7) * 0.05;
      obj.current.rotation.y = Math.sin(t * 0.45 + st.i) * 0.22;
    }
    if (shadowMat.current) shadowMat.current.uniforms.uOpacity.value = rv;
    if (reflMat.current) {
      reflMat.current.uniforms.uOpacity.value = rv;
      reflMat.current.uniforms.uTime.value = time.current + st.i;
    }
    if (haloMat.current) {
      haloMat.current.uniforms.uOpacity.value = rv;
      haloMat.current.uniforms.uTime.value = time.current;
    }
    if (bloomMat.current) {
      bloomMat.current.uniforms.uOpacity.value = rv;
      bloomMat.current.uniforms.uTime.value = time.current + st.i * 0.7;
    }
    if (topMat.current) {
      topMat.current.uniforms.uOpacity.value = rv;
      topMat.current.uniforms.uTime.value = time.current + st.i;
    }
    if (Math.abs(lastOp.current - rv) > 0.01) {
      lastOp.current = rv;
      g.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | undefined;
        if (m && !(m instanceof THREE.ShaderMaterial)) {
          // Keep each material's authored opacity as its ceiling while revealing.
          if (m.userData.baseOpacity === undefined) m.userData.baseOpacity = m.opacity;
          m.opacity = rv * m.userData.baseOpacity;
        }
      });
    }
  });

  return (
    <group ref={group} position={[st.x, st.y, 0]}>
      {/* Grounding: reflection streak on the floor below (screen-facing) */}
      <mesh position={[0, -0.62, -0.05]} scale={[1.7, 0.9, 1]} renderOrder={1.3}>
        <planeGeometry />
        <shaderMaterial ref={reflMat} vertexShader={haloShader.vertex} fragmentShader={reflFrag} uniforms={reflU} {...additive} />
      </mesh>
      <group rotation={[TILT, 0, 0]}>
        {/* Contact shadow where the pedestal meets the floor */}
        <mesh position={[0, -0.355, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[2.7, 2.7, 1]} renderOrder={1.3}>
          <planeGeometry />
          <shaderMaterial ref={shadowMat} vertexShader={haloShader.vertex} fragmentShader={shadowFrag} uniforms={shadowU} transparent depthWrite={false} toneMapped={false} />
        </mesh>
        {/* Floor glow + light ring */}
        <mesh position={[0, -0.36, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={3.4} renderOrder={2}>
          <planeGeometry />
          <shaderMaterial ref={haloMat} vertexShader={haloShader.vertex} fragmentShader={haloShader.fragment} uniforms={halo} {...additive} />
        </mesh>
        {/* Two-tier chrome pedestal */}
        <mesh renderOrder={1.4} position={[0, -0.25, 0]} material={chromeDark}>
          <cylinderGeometry args={[1.08, 1.12, 0.2, 96]} />
        </mesh>
        <mesh renderOrder={1.4} position={[0, -0.12, 0]} material={chrome}>
          <cylinderGeometry args={[1.0, 1.06, 0.1, 96]} />
        </mesh>
        <mesh position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]} material={rim}>
          <torusGeometry args={[0.98, 0.028, 16, 128]} />
        </mesh>
        <mesh renderOrder={1.4} position={[0, -0.03, 0]} material={chrome}>
          <cylinderGeometry args={[0.9, 0.95, 0.06, 96]} />
        </mesh>
        <mesh renderOrder={1.4} position={[0, 0.0015, 0]} rotation={[-Math.PI / 2, 0, 0]} material={topGlass}>
          <circleGeometry args={[0.9, 96]} />
        </mesh>
        <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={1.78} renderOrder={3}>
          <circleGeometry args={[0.5, 96]} />
          <shaderMaterial ref={topMat} vertexShader={topShader.vertex} fragmentShader={topShader.fragment} uniforms={top} {...additive} />
        </mesh>
        <mesh position={[0, 0.0, 0]} rotation={[Math.PI / 2, 0, 0]} material={rim}>
          <torusGeometry args={[0.78, 0.012, 12, 128]} />
        </mesh>
        {/* Floating object (counter-tilt so it stands upright) */}
        <group rotation={[-TILT * 0.75, 0, 0]}>
          <mesh position={[0, 0.85, -0.25]} scale={3.2} renderOrder={2} visible={st.kind !== 'none' && !st.noBloom}>
            <planeGeometry />
            <shaderMaterial ref={bloomMat} vertexShader={haloShader.vertex} fragmentShader={bloomFrag} uniforms={bloom} {...additive} />
          </mesh>
          <group ref={obj}>
            <group scale={(st.objectScale ?? (st.kind === 'approved' || st.kind === 'rejected' ? 1.25 : st.kind === 'checkin' ? 1.05 : OBJECT_SCALE)) * (st.compact ? 0.72 : 1)}>
              {st.kind !== 'none' && <JourneyObject kind={st.kind} accent={st.accent} stack={st.stack} />}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

function Path({ points, a, b, width, reveal, time, scale }: { points: THREE.Vector3[]; a: string; b: string; width: number; reveal: React.MutableRefObject<number>; time: React.MutableRefObject<number>; scale: React.MutableRefObject<number> }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.4), [points]);
  const core = useMemo(() => new THREE.TubeGeometry(curve, 260, width, 12, false), [curve, width]);
  const glow = useMemo(() => new THREE.TubeGeometry(curve, 200, width * 4.2, 12, false), [curve, width]);
  const mk = (isCore: boolean) => ({
    uA: { value: new THREE.Color(a) }, uB: { value: new THREE.Color(b) }, uTime: { value: 0 }, uOpacity: { value: 0 }, uCore: { value: isCore ? 1 : 0 }, uSpeed: { value: 0.35 }, uDraw: { value: 0 },
  });
  const uCore = useMemo(() => mk(true), [a, b]); // eslint-disable-line react-hooks/exhaustive-deps
  const uGlow = useMemo(() => mk(false), [a, b]); // eslint-disable-line react-hooks/exhaustive-deps
  const coreMat = useRef<THREE.ShaderMaterial>(null);
  const glowMat = useRef<THREE.ShaderMaterial>(null);

  const sparks = useMemo(() => {
    const n = 220;
    const pos: number[] = [];
    const seed: number[] = [];
    const col: number[] = [];
    const ca = new THREE.Color(a);
    const cb = new THREE.Color(b);
    for (let i = 0; i < n; i++) {
      const t = Math.random();
      const p = curve.getPoint(t);
      const off = new THREE.Vector3((Math.random() - 0.5) * width * 14, (Math.random() - 0.2) * width * 10, (Math.random() - 0.5) * width * 10);
      pos.push(p.x + off.x, p.y + off.y, p.z + off.z);
      seed.push(Math.random());
      const c = ca.clone().lerp(cb, t);
      col.push(c.r, c.g, c.b);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
    g.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    return g;
  }, [curve, width, a, b]);
  const sparkMat = useRef<THREE.ShaderMaterial>(null);
  const uSpark = useMemo(() => ({ uTime: { value: 0 }, uScale: { value: 4 }, uOpacity: { value: 0 } }), []);
  const dpr = useThree((s) => s.viewport.dpr);

  useFrame(() => {
    const rv = reveal.current;
    for (const m of [coreMat.current, glowMat.current]) {
      if (!m) continue;
      m.uniforms.uTime.value = time.current;
      m.uniforms.uOpacity.value = Math.min(1, rv * 1.4);
      m.uniforms.uDraw.value = Math.min(1.001, rv * 1.15);
    }
    if (sparkMat.current) {
      sparkMat.current.uniforms.uTime.value = time.current;
      sparkMat.current.uniforms.uOpacity.value = rv;
      sparkMat.current.uniforms.uScale.value = Math.max(2, scale.current * 0.004) * dpr;
    }
  });

  return (
    <group>
      <mesh geometry={glow} renderOrder={4}>
        <shaderMaterial ref={glowMat} vertexShader={tubeShader.vertex} fragmentShader={tubeShader.fragment} uniforms={uGlow} {...additive} />
      </mesh>
      <mesh geometry={core} renderOrder={5}>
        <shaderMaterial ref={coreMat} vertexShader={tubeShader.vertex} fragmentShader={tubeShader.fragment} uniforms={uCore} {...additive} />
      </mesh>
      <points geometry={sparks} renderOrder={6}>
        <shaderMaterial ref={sparkMat} vertexShader={sparkShader.vertex} fragmentShader={sparkShader.fragment} uniforms={uSpark} {...additive} />
      </points>
    </group>
  );
}

function JourneyObject3D({ id }: { id: string }) {
  const size = useThree((s) => s.size);
  const proxy = proxies.get(id)!;
  const { spec, vertical } = proxy.data as { spec: JourneySpec; vertical: boolean };
  const root = useRef<THREE.Group>(null);
  const [aspect, setAspect] = useState(() => {
    const r = proxy.el.getBoundingClientRect();
    return r.width > 0 ? r.height / r.width : 0.26;
  });
  const reveal = useRef<number[]>([]);
  const pathReveal = useRef(0);
  const time = useRef(0);
  const pxWidth = useRef(1000);

  const layout = useMemo(() => {
    const g = vertical ? journeyGeometryVertical(spec.stages.length) : journeyGeometry(spec.stages.length);
    const L = (p: { x: number; y: number }) => ({ x: p.x / 100 - 0.5, y: -(p.y / 100 - 0.5) * aspect });
    const r = (g.pedW / 100) * 0.5;
    const ro = (g.outPedW / 100) * 0.5;
    const stations: Station[] = spec.stages.map((s, i) => ({ ...L(g.stages[i]), r, accent: s.accent, kind: ICON_TO_OBJECT[s.icon] ?? 'documents', i, compact: vertical }));
    const n = stations.length;
    stations.push({ ...L(g.approved), r: ro, accent: '#33d69a', kind: 'approved', i: n });
    stations.push({ ...L(g.rejected), r: ro, accent: '#ff4f63', kind: 'rejected', i: n + 1 });
    // Path runs along the floor in front of the pedestals.
    const floorY = (st: Station) => st.y - st.r * 0.48;
    const front = (st: Station) => st.r * 0.25;
    const main = stations.slice(0, n).map((st) => new THREE.Vector3(st.x, floorY(st), front(st)));
    const br = L(g.branch);
    const branchPt = new THREE.Vector3(br.x, vertical ? br.y : floorY(stations[n - 1]) + 0.004, front(stations[n - 1]));
    main.push(branchPt);
    const ap = stations[n];
    const rj = stations[n + 1];
    const approvedPts = [branchPt.clone(), new THREE.Vector3((branchPt.x + ap.x) / 2, (branchPt.y + floorY(ap)) / 2 + 0.01, front(ap)), new THREE.Vector3(ap.x, floorY(ap), front(ap))];
    const rejectedPts = [branchPt.clone(), new THREE.Vector3((branchPt.x + rj.x) / 2, (branchPt.y + floorY(rj)) / 2 - 0.01, front(rj)), new THREE.Vector3(rj.x, floorY(rj), front(rj))];
    return { stations, main, approvedPts, rejectedPts, width: r * 0.05, mainA: spec.stages[0].accent, mainB: spec.stages[n - 1].accent };
  }, [spec, aspect, vertical]);

  useFrame((_, dt) => {
    const g = root.current;
    if (!g) return;
    time.current += dt;
    const rect = proxy.el.getBoundingClientRect();
    const morph = proxy.el.closest<HTMLElement>('[data-morph]');
    const op = morph ? parseFloat(morph.style.opacity || getComputedStyle(morph).opacity || '1') : 1;
    if (rect.width > 1) {
      const asp = rect.height / rect.width;
      if (Math.abs(asp - aspect) / aspect > 0.03) setAspect(asp);
    }
    const [x, y, z] = screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2, PRESENCE_DEPTH, size);
    g.position.set(x, y, z);
    g.scale.setScalar(Math.max(0.0001, screenLengthToWorld(rect.width, PRESENCE_DEPTH, size)));
    g.visible = op > 0.01 && rect.width > 1;
    pxWidth.current = rect.width;
    // Staggered build: pedestals rise left→right, the light path draws through them.
    const n = layout.stations.length;
    for (let i = 0; i < n; i++) {
      const target = Math.max(0, Math.min(1, op * 1.7 - (i / n) * 0.7));
      reveal.current[i] = target;
    }
    pathReveal.current = Math.max(0, Math.min(1, op * 1.6 - 0.25));
  });

  return (
    <group ref={root}>
      <Path points={layout.main} a={layout.mainA} b={layout.mainB} width={layout.width} reveal={pathReveal} time={time} scale={pxWidth} />
      <Path points={layout.approvedPts} a={layout.mainB} b="#33d69a" width={layout.width} reveal={pathReveal} time={time} scale={pxWidth} />
      <Path points={layout.rejectedPts} a={layout.mainB} b="#ff4f63" width={layout.width} reveal={pathReveal} time={time} scale={pxWidth} />
      {layout.stations.map((st) => (
        <Pedestal key={`${st.kind}-${st.i}`} st={st} reveal={reveal} time={time} />
      ))}
    </group>
  );
}

export function JourneyObjects() {
  const seen = useRef(-1);
  const [, setTick] = useState(0);
  useFrame(() => {
    const v = [...proxies.keys()].join('|');
    const h = v.length + v.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    if (h !== seen.current) {
      seen.current = h;
      setTick((t) => t + 1);
    }
  });
  return (
    <>
      {[...proxies.entries()]
        .filter(([, p]) => p.kind === 'pedestal')
        .map(([id]) => (
          <JourneyObject3D key={id} id={id} />
        ))}
    </>
  );
}
