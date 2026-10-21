import { useMemo, useReducer, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { DonutSpec } from '../odin/types';
import { proxies, proxyVersion } from '../odin/fx';
import { PRESENCE_DEPTH, screenLengthToWorld, screenToWorld } from '../lib/layout';
import { DONUT_TILT, segmentAngles } from '../ui/scene/components/donutGeometry';

/**
 * 3D glass status donut. Each segment is an extruded, bevelled annular
 * sector with an emissive glass shader (fresnel rim, light streaks on the
 * top face, darker walls). Follows its DOM proxy's live rect/opacity.
 */

const INNER = 0.6;
const DEPTH = 0.17;

const vertex = /* glsl */ `
  varying vec3 vN;
  varying vec3 vObjN;
  varying vec3 vV;
  varying vec3 vP;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vObjN = normal;
    vV = normalize(-mv.xyz);
    vP = position;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uSeed;
  uniform float uClean;
  varying vec3 vN;
  varying vec3 vObjN;
  varying vec3 vV;
  varying vec3 vP;
  void main() {
    float top = smoothstep(0.6, 0.9, vObjN.z);
    float fres = ((1.0 - max(dot(normalize(vN), normalize(vV)), 0.0)) * (1.0 - max(dot(normalize(vN), normalize(vV)), 0.0)));
    float r = length(vP.xy);
    float radial = smoothstep(${INNER.toFixed(2)}, 1.0, r);
    float ang = atan(vP.y, vP.x);
    // Vertical light streaks rising inside the glass (top face), gently animated.
    float streak = pow(max(0.5 + 0.5 * sin(ang * 140.0 + uSeed * 10.0), 0.0), 18.0);
    float rise = smoothstep(0.0, 1.0, fract(radial * 1.6 - uTime * 0.12 + uSeed));
    vec3 base = uColor;
    vec3 topCol = mix(base * 0.65, base * 1.25 + 0.12, radial) + (streak * rise * 0.55 * base + vec3(streak * rise * 0.15)) * (1.0 - uClean);
    // Clean variant: smooth glossy enamel — soft inner-to-outer gradient, a light band and an upper-left sheen.
    float band = pow(max(1.0 - abs(radial - 0.62) * 3.2, 0.0), 3.0);
    float sheen = smoothstep(0.35, 1.0, dot(normalize(vP.xy + 1e-4), normalize(vec2(-0.55, 0.8))));
    vec3 gloss = mix(base * 0.78, base * 1.12 + 0.06, radial) + vec3(0.55) * band * 0.22 + vec3(1.0) * sheen * 0.16;
    topCol = mix(topCol, gloss, uClean);
    vec3 wallCol = base * (0.35 + 0.35 * (vP.z / ${DEPTH.toFixed(2)}));
    vec3 col = mix(wallCol, topCol, top);
    col += mix(base, vec3(1.0), 0.45) * fres * 0.9;
    float alpha = mix(0.82, 0.94, top) * uOpacity;
    gl_FragColor = vec4(col, alpha);
  }
`;

const haloFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float ring = exp(-(((d - 0.78) / 0.16) * ((d - 0.78) / 0.16)));
    gl_FragColor = vec4(uColor * ring * 0.55 * uOpacity, 1.0);
  }
`;

function sectorGeometry(start: number, end: number) {
  // Screen angles (y down, clockwise) → 3D (y up): negate.
  const a0 = -end;
  const a1 = -start;
  const pad = Math.min(0.025, (a1 - a0) * 0.12);
  const s = new THREE.Shape();
  s.absarc(0, 0, 1, a0 + pad, a1 - pad, false);
  s.absarc(0, 0, INNER, a1 - pad * 1.4, a0 + pad * 1.4, true);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 3, curveSegments: 96 });
  g.computeVertexNormals();
  return g;
}

function DonutObject({ id }: { id: string }) {
  const size = useThree((s) => s.size);
  const group = useRef<THREE.Group>(null);
  const proxy = proxies.get(id)!;
  const spec = proxy.data as DonutSpec;
  const segs = useMemo(() => {
    const angles = segmentAngles(spec);
    return spec.segments.map((seg, i) => ({
      geo: sectorGeometry(angles[i].start, angles[i].end),
      mid: -angles[i].mid,
      uniforms: { uColor: { value: new THREE.Color(seg.accent) }, uOpacity: { value: 0 }, uTime: { value: 0 }, uSeed: { value: i * 0.37 }, uClean: { value: spec.clean ? 1 : 0 } },
    }));
  }, [spec]);
  const halo = useMemo(() => ({ uColor: { value: new THREE.Color('#7fb6ff') }, uOpacity: { value: 0 } }), []);
  const haloMat = useRef<THREE.ShaderMaterial>(null);
  const segRefs = useRef<(THREE.Mesh | null)[]>([]);
  const t = useRef(0);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    t.current += dt;
    const r = proxy.el.getBoundingClientRect();
    const morph = proxy.el.closest<HTMLElement>('[data-morph]');
    const op = morph ? parseFloat(morph.style.opacity || getComputedStyle(morph).opacity || '1') : 1;
    const [x, y, z] = screenToWorld(r.left + r.width / 2, r.top + r.height / 2, PRESENCE_DEPTH, size);
    g.position.set(x, y, z);
    const R = screenLengthToWorld(r.width / 2, PRESENCE_DEPTH, size);
    g.scale.setScalar(Math.max(0.0001, R));
    g.visible = op > 0.01 && r.width > 1;
    segs.forEach((s, i) => {
      const m = segRefs.current[i];
      // Write through the live material (R3F copies the uniforms object).
      const un = (m?.material as THREE.ShaderMaterial | undefined)?.uniforms;
      if (un) {
        un.uOpacity.value = op;
        un.uTime.value = t.current;
      }
      if (m) {
        // Exploded slightly, each segment breathing on its own.
        const e = 0.035 + 0.008 * Math.sin(t.current * 1.3 + i * 1.7);
        m.position.set(Math.cos(s.mid) * e, Math.sin(s.mid) * e, 0);
      }
    });
    if (haloMat.current) haloMat.current.uniforms.uOpacity.value = op;
  });

  return (
    <group ref={group}>
      <mesh scale={2.7} position={[0, 0, -0.2]} renderOrder={1.6}>
        <planeGeometry />
        <shaderMaterial
          ref={haloMat}
          vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
          fragmentShader={haloFrag}
          uniforms={halo}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {/* Clean variant faces the viewer (slight tilt only), like a front-on gauge. */}
      <group rotation={[spec.clean ? -0.16 : -DONUT_TILT, 0, 0]}>
        {segs.map((s, i) => (
          <mesh
            key={i}
            ref={(m) => {
              segRefs.current[i] = m;
            }}
            geometry={s.geo}
            renderOrder={9}
          >
            <shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={s.uniforms} transparent depthWrite toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Renders a 3D object for every registered DOM proxy of kind 'donut'. */
export function ProxyObjects() {
  const scene = useThree((s) => s.scene);
  if (import.meta.env.DEV) (window as unknown as { __odinScene: unknown }).__odinScene = scene;
  const seen = useRef(proxyVersion.value);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  useFrame(() => {
    if (seen.current !== proxyVersion.value) {
      seen.current = proxyVersion.value;
      bump();
    }
  });
  return (
    <>
      {[...proxies.entries()]
        .filter(([, p]) => p.kind === 'donut')
        .map(([id]) => (
          <DonutObject key={id} id={id} />
        ))}
    </>
  );
}
