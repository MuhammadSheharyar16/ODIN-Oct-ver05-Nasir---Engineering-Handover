import { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { proxies } from '../../odin/fx';
import { PRESENCE_DEPTH, screenLengthToWorld, screenToWorld } from '../../lib/layout';

/**
 * Calm glass sphere (proxy kind 'orb'): a deep navy translucent body with a
 * bright fresnel rim, slow flowing light ribbons (great-circle bands drifting
 * on independent axes), a warm glow on the lower rim and a soft halo. Used
 * where the scene's number lives inside the sphere (e.g. In processing now),
 * so the interior stays quiet and the white readout is always legible.
 */

const vert = /* glsl */ `
  varying vec3 vN; varying vec3 vV; varying vec3 vO;
  void main() {
    vO = normalize(position);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;

const frag = /* glsl */ `
  uniform float uTime; uniform float uOpacity; uniform float uBack;
  varying vec3 vN; varying vec3 vV; varying vec3 vO;
  mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
  mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
  float band(vec3 p, vec3 axis, float w) { float d = dot(p, normalize(axis)); return exp(-(d * d) / (w * w)); }
  void main() {
    vec3 n = normalize(vN), v = normalize(vV);
    float facing = clamp(dot(n, v), 0.0, 1.0);
    float fres = pow(1.0 - facing, 2.4);
    // Ribbons live in object space and drift slowly on their own axes.
    vec3 p = rotY(uTime * 0.06) * vO;
    float r = 0.0, g = 0.0;
    vec3 ax[6];
    ax[0] = rotX(0.35 + sin(uTime * 0.05) * 0.2) * vec3(0.25, 1.0, 0.15);
    ax[1] = rotY(1.1 + uTime * 0.04) * vec3(0.9, 0.55, 0.1);
    ax[2] = rotX(-0.6) * rotY(-uTime * 0.035) * vec3(-0.6, 0.8, 0.45);
    ax[3] = rotY(2.3 - uTime * 0.03) * vec3(0.2, 0.35, 1.0);
    ax[4] = rotX(1.2 + uTime * 0.025) * vec3(0.7, -0.4, 0.6);
    ax[5] = rotY(0.4 + uTime * 0.05) * vec3(-0.85, 0.25, 0.5);
    for (int i = 0; i < 6; i++) {
      float w = 0.010 + 0.006 * float(i % 3);
      r += band(p, ax[i], w) * (0.65 + 0.35 * sin(uTime * 0.4 + float(i) * 1.7));
      g += band(p, ax[i], w * 10.0) * 0.2;
    }
    // Quiet centre for the readout: ribbons fade toward the middle of the disc.
    float edge = mix(0.18, 1.0, pow(1.0 - facing, 0.9));
    r *= edge; g *= edge;
    // Deeper blue body (the lights and readout sit on it).
    vec3 deep = vec3(0.012, 0.036, 0.14);
    vec3 mid = vec3(0.045, 0.15, 0.46);
    vec3 body = mix(deep, mid, pow(1.0 - facing, 1.6));
    vec3 ribbon = mix(vec3(0.32, 0.62, 1.0), vec3(0.88, 0.95, 1.0), clamp(r, 0.0, 1.0));
    // Back faces (seen through the glass) are dimmer so depth reads.
    float side = mix(1.0, 0.45, uBack);
    vec3 col = body * (1.0 - uBack * 0.6) + ribbon * (r * 0.75 + g) * side;
    // Rim: cool blue all round, warm sunset glow on the lower edge.
    float low = smoothstep(0.1, -0.85, n.y);
    col += vec3(0.55, 0.76, 1.0) * fres * 1.05 * side;
    col += vec3(1.0, 0.78, 0.5) * fres * low * 0.9 * side;
    // Soft specular highlight, upper left.
    vec3 h = normalize(vec3(-0.45, 0.6, 0.66));
    col += vec3(1.0) * pow(clamp(dot(n, h), 0.0, 1.0), 40.0) * 0.55 * (1.0 - uBack);
    // More glass than solid (21 Oct): the room shows through the body; the rim stays bright.
    float alpha = clamp(mix(0.66, 0.95, fres) * (1.0 - uBack * 0.6) + r * 0.2, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha * uOpacity);
  }`;

const haloFrag = /* glsl */ `
  uniform float uOpacity; varying vec2 vUv;
  void main(){ float d = length(vUv - 0.5) * 2.0; float g = smoothstep(1.0, 0.66, d) * smoothstep(0.5, 0.68, d);
    gl_FragColor = vec4(vec3(0.45, 0.7, 1.0) * g * 0.75 * uOpacity, 1.0); }`;

function OrbObject({ id }: { id: string }) {
  const size = useThree((s) => s.size);
  const proxy = proxies.get(id)!;
  const root = useRef<THREE.Group>(null);
  const mats = useRef<(THREE.ShaderMaterial | null)[]>([]);
  const t = useRef(0);
  const uFront = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 0 }, uBack: { value: 0 } }), []);
  const uBack = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 0 }, uBack: { value: 1 } }), []);
  const uHalo = useMemo(() => ({ uOpacity: { value: 0 } }), []);

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
    g.scale.setScalar(Math.max(0.0001, R * (0.85 + 0.15 * Math.min(1, op))));
    g.visible = op > 0.01 && r.width > 1;
    for (const m of mats.current) {
      if (!m) continue;
      m.uniforms.uOpacity.value = op;
      if (m.uniforms.uTime) m.uniforms.uTime.value = t.current;
    }
  });

  const blend = { transparent: true, depthWrite: false, toneMapped: false } as const;
  return (
    <group ref={root}>
      <mesh scale={2.6} position={[0, 0, -1.2]} renderOrder={2}>
        <planeGeometry />
        <shaderMaterial ref={(m) => { mats.current[0] = m; }} vertexShader="varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }" fragmentShader={haloFrag} uniforms={uHalo} blending={THREE.AdditiveBlending} {...blend} />
      </mesh>
      <mesh renderOrder={3}>
        <sphereGeometry args={[1, 96, 72]} />
        <shaderMaterial ref={(m) => { mats.current[1] = m; }} vertexShader={vert} fragmentShader={frag} uniforms={uBack} side={THREE.BackSide} {...blend} />
      </mesh>
      <mesh renderOrder={4}>
        <sphereGeometry args={[1, 96, 72]} />
        <shaderMaterial ref={(m) => { mats.current[2] = m; }} vertexShader={vert} fragmentShader={frag} uniforms={uFront} side={THREE.FrontSide} {...blend} />
      </mesh>
    </group>
  );
}

export function OrbObjects() {
  const sig = useRef('');
  const [, setTick] = useState(0);
  useFrame(() => {
    const v = [...proxies.entries()].filter(([, p]) => p.kind === 'orb').map(([k]) => k).join('|');
    if (v !== sig.current) { sig.current = v; setTick((x) => x + 1); }
  });
  return <>{[...proxies.entries()].filter(([, p]) => p.kind === 'orb').map(([id]) => <OrbObject key={id} id={id} />)}</>;
}
