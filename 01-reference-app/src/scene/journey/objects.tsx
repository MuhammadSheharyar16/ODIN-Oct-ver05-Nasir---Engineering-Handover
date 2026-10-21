import { useMemo, type ReactNode } from 'react';
import { RoundedBox } from '@react-three/drei';
import { CrystalIcon, hasCrystal } from './CrystalIcon';
import * as THREE from 'three';

/**
 * Procedural glass objects for journey steps. Units: pedestal radius = 1,
 * pedestal top at y = 0; objects float roughly between y 0.2 and 1.3.
 * Materials are glossy, clear-coated and softly self-lit by the step accent
 * so they read as luminous glass in daylight without global bloom.
 */

export type ObjectKind =
  | 'submit' | 'payment' | 'review' | 'upload' | 'biometric' | 'calendar' | 'documents' | 'checkin' | 'approved' | 'rejected'
  | 'docStack' | 'passports';

function useMats(accent: string) {
  return useMemo(() => {
    const a = new THREE.Color(accent);
    const glass = new THREE.MeshPhysicalMaterial({
      color: a.clone().multiplyScalar(0.85),
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      emissive: a,
      emissiveIntensity: 0.62,
      envMapIntensity: 1.8,
      transparent: true,
    });
    const white = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#dfe9ff').lerp(a, 0.18),
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      emissive: a.clone().lerp(new THREE.Color('#ffffff'), 0.55),
      emissiveIntensity: 0.22,
      envMapIntensity: 1.3,
      transparent: true,
    });
    const glow = new THREE.MeshBasicMaterial({ color: a.clone().lerp(new THREE.Color('#ffffff'), 0.35), transparent: true, toneMapped: false });
    const hot = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, toneMapped: false });
    const dark = new THREE.MeshPhysicalMaterial({ color: a.clone().multiplyScalar(0.25), roughness: 0.3, clearcoat: 1, emissive: a, emissiveIntensity: 0.15, transparent: true });
    const gold = new THREE.MeshPhysicalMaterial({ color: '#f1c66b', metalness: 0.9, roughness: 0.25, transparent: true });
    return { glass, white, glow, hot, dark, gold };
  }, [accent]);
}

const extrude = (shape: THREE.Shape, depth: number, bevel = 0.02) =>
  new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 24 });

function arrowShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0.5);
  s.lineTo(0.38, 0.08);
  s.lineTo(0.14, 0.08);
  s.lineTo(0.14, -0.45);
  s.lineTo(-0.14, -0.45);
  s.lineTo(-0.14, 0.08);
  s.lineTo(-0.38, 0.08);
  s.closePath();
  return s;
}

function checkShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.42, 0.02);
  s.lineTo(-0.27, 0.17);
  s.lineTo(-0.1, 0.0);
  s.lineTo(0.3, 0.4);
  s.lineTo(0.45, 0.25);
  s.lineTo(-0.1, -0.3);
  s.closePath();
  return s;
}

function crossShape() {
  const s = new THREE.Shape();
  const w = 0.11;
  const l = 0.38;
  const pts = [
    [w, 0], [l, l - w], [l - w, l], [0, w], [-l + w, l], [-l, l - w], [-w, 0], [-l, -l + w], [-l + w, -l], [0, -w], [l - w, -l], [l, -l + w],
  ];
  s.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) s.lineTo(x, y);
  s.closePath();
  return s;
}

function useCanvasTexture(draw: (ctx: CanvasRenderingContext2D, s: number) => void, size = 256) {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    draw(ctx, size);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Lines of text on a document, as thin bars. */
function DocLines({ w, h, mat, rows = 5, z = 0.03 }: { w: number; h: number; mat: THREE.Material; rows?: number; z?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <mesh key={i} position={[(i === 0 ? -w * 0.12 : 0) + (i % 3 === 2 ? -w * 0.1 : 0), h * 0.32 - (i * h * 0.64) / (rows - 1), z]} material={mat}>
          <boxGeometry args={[w * (i === 0 ? 0.5 : i % 3 === 2 ? 0.5 : 0.72), h * 0.045, 0.01]} />
        </mesh>
      ))}
    </>
  );
}

function Submit({ accent }: { accent: string }) {
  const m = useMats(accent);
  const arrow = useMemo(() => extrude(arrowShape(), 0.08, 0.03), []);
  return (
    <group position={[0, 0.12, 0]} rotation={[0, -0.35, 0]}>
      {/* Laptop */}
      <RoundedBox args={[1.25, 0.06, 0.82]} radius={0.03} position={[0, 0.03, 0.05]} material={m.white} />
      <group position={[0, 0.06, -0.34]} rotation={[-0.28, 0, 0]}>
        <RoundedBox args={[1.25, 0.8, 0.05]} radius={0.04} position={[0, 0.4, 0]} material={m.white} />
        <mesh position={[0, 0.41, 0.028]} material={m.glass}>
          <planeGeometry args={[1.12, 0.66]} />
        </mesh>
        <group position={[-0.18, 0.42, 0.04]}>
          <DocLines w={0.5} h={0.42} mat={m.hot} rows={5} />
        </group>
      </group>
      {/* Floating documents */}
      <group position={[0.18, 0.72, 0.2]} rotation={[0, 0.2, 0.08]}>
        <RoundedBox args={[0.5, 0.64, 0.03]} radius={0.02} position={[-0.12, 0.04, -0.04]} material={m.glass} />
        <RoundedBox args={[0.5, 0.64, 0.03]} radius={0.02} material={m.white} />
        <DocLines w={0.5} h={0.64} mat={m.glass} rows={5} />
      </group>
      {/* Upload arrow badge */}
      <group position={[0.55, 0.55, 0.42]} scale={0.42}>
        <mesh material={m.glass}>
          <cylinderGeometry args={[0.62, 0.62, 0.14, 48]} />
        </mesh>
        <mesh geometry={arrow} position={[0, 0.09, -0.04]} rotation={[-Math.PI / 2, 0, 0]} material={m.hot} />
      </group>
    </group>
  );
}

function Payment({ accent }: { accent: string }) {
  const m = useMats(accent);
  const Card = ({ mat }: { mat: THREE.Material }) => (
    <group>
      <RoundedBox args={[1.1, 0.7, 0.045]} radius={0.06} material={mat} />
      <mesh position={[0, 0.18, 0.026]} material={m.dark}>
        <boxGeometry args={[1.1, 0.13, 0.005]} />
      </mesh>
      <mesh position={[-0.33, -0.04, 0.03]} material={m.gold}>
        <boxGeometry args={[0.2, 0.15, 0.02]} />
      </mesh>
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[0.05 + k * 0.17, -0.22, 0.026]} material={m.hot}>
          <boxGeometry args={[0.12, 0.04, 0.005]} />
        </mesh>
      ))}
    </group>
  );
  return (
    <group position={[0, 0.62, 0]} rotation={[-0.15, -0.4, 0.05]}>
      <group position={[-0.16, 0.12, -0.12]} rotation={[0, 0, 0.14]}>
        <Card mat={m.white} />
      </group>
      <Card mat={m.glass} />
    </group>
  );
}

function Review({ accent }: { accent: string }) {
  const m = useMats(accent);
  return (
    <group position={[0, 0.62, 0]} rotation={[0, -0.3, 0]}>
      <RoundedBox args={[0.82, 1.0, 0.05]} radius={0.04} position={[-0.12, 0, 0]} material={m.white} />
      <group position={[-0.12, 0.05, 0]}>
        <DocLines w={0.82} h={1.0} mat={m.glass} rows={6} />
      </group>
      {/* Magnifier */}
      <group position={[0.3, -0.12, 0.22]} rotation={[0, 0, -0.5]}>
        <mesh material={m.glass}>
          <torusGeometry args={[0.27, 0.06, 20, 64]} />
        </mesh>
        <mesh material={m.white}>
          <circleGeometry args={[0.24, 48]} />
        </mesh>
        <mesh position={[0, -0.47, 0]} material={m.glass}>
          <capsuleGeometry args={[0.06, 0.3, 8, 16]} />
        </mesh>
      </group>
    </group>
  );
}

function Upload({ accent }: { accent: string }) {
  const m = useMats(accent);
  const arrow = useMemo(() => extrude(arrowShape(), 0.12, 0.03), []);
  const puffs: [number, number, number, number][] = [
    [0, 0.12, 0, 0.42], [-0.38, -0.02, 0.02, 0.3], [0.38, -0.02, 0.02, 0.32], [-0.18, -0.12, 0.12, 0.3], [0.2, -0.13, 0.12, 0.3], [0.0, -0.16, 0.18, 0.28],
  ];
  return (
    <group position={[0, 0.66, 0]}>
      {puffs.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} material={m.white}>
          <sphereGeometry args={[r, 40, 28]} />
        </mesh>
      ))}
      <mesh geometry={arrow} position={[0, -0.02, 0.36]} scale={0.62} material={m.glass} />
    </group>
  );
}

function Biometric({ accent }: { accent: string }) {
  const m = useMats(accent);
  const tex = useCanvasTexture((ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineWidth = s * 0.022;
    const cx = s / 2;
    const cy = s * 0.56;
    for (let k = 0; k < 7; k++) {
      const r = s * (0.06 + k * 0.05);
      const gap = 0.35 + (k % 2) * 0.25;
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI * (1 + gap * 0.25), Math.PI * (2 - gap * 0.1) + (k % 3) * 0.2);
      ctx.stroke();
      if (k > 1) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI * 0.05 + (k % 2) * 0.2, Math.PI * (0.62 - k * 0.03));
        ctx.stroke();
      }
    }
  });
  const printMat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, color: '#eaf2ff' }), [tex]);
  const corner = (sx: number, sy: number) => (
    <group position={[sx * 0.46, sy * 0.46, 0.05]} scale={[sx, sy, 1]}>
      <mesh position={[-0.06, 0, 0]} material={m.hot}>
        <boxGeometry args={[0.16, 0.035, 0.02]} />
      </mesh>
      <mesh position={[0, -0.06, 0]} material={m.hot}>
        <boxGeometry args={[0.035, 0.16, 0.02]} />
      </mesh>
    </group>
  );
  return (
    <group position={[0, 0.68, 0]} rotation={[-0.1, -0.25, 0]}>
      <RoundedBox args={[1.05, 1.05, 0.08]} radius={0.12} material={m.glass} />
      <mesh position={[0, 0, 0.045]} material={printMat}>
        <planeGeometry args={[0.82, 0.82]} />
      </mesh>
      {corner(1, 1)}
      {corner(-1, 1)}
      {corner(1, -1)}
      {corner(-1, -1)}
    </group>
  );
}

function Calendar({ accent }: { accent: string }) {
  const m = useMats(accent);
  const check = useMemo(() => extrude(checkShape(), 0.06, 0.02), []);
  return (
    <group position={[0, 0.66, 0]} rotation={[0, -0.32, 0]}>
      <RoundedBox args={[1.0, 0.95, 0.12]} radius={0.08} material={m.white} />
      <RoundedBox args={[1.0, 0.24, 0.13]} radius={0.06} position={[0, 0.36, 0.005]} material={m.glass} />
      {[-0.26, 0.26].map((x) => (
        <mesh key={x} position={[x, 0.5, 0]} material={m.dark}>
          <capsuleGeometry args={[0.035, 0.12, 6, 12]} />
        </mesh>
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-0.28 + (i % 3) * 0.28, 0.1 - Math.floor(i / 3) * 0.2, 0.07]} material={i === 4 ? m.glow : m.glass}>
          <boxGeometry args={[0.13, 0.11, 0.02]} />
        </mesh>
      ))}
      <mesh geometry={check} position={[0.32, -0.32, 0.12]} scale={0.6} material={m.hot} />
    </group>
  );
}

function Documents({ accent }: { accent: string }) {
  const m = useMats(accent);
  const check = useMemo(() => extrude(checkShape(), 0.06, 0.02), []);
  const folder = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.55, -0.4);
    s.lineTo(0.55, -0.4);
    s.lineTo(0.55, 0.3);
    s.lineTo(-0.05, 0.3);
    s.lineTo(-0.15, 0.4);
    s.lineTo(-0.55, 0.4);
    s.closePath();
    return extrude(s, 0.06, 0.03);
  }, []);
  return (
    <group position={[0, 0.66, 0]} rotation={[0, -0.3, 0]}>
      <mesh geometry={folder} position={[0, 0, -0.08]} material={m.glass} />
      <RoundedBox args={[0.8, 0.62, 0.02]} radius={0.02} position={[0, 0.08, 0.0]} rotation={[0, 0, 0.05]} material={m.white} />
      <RoundedBox args={[1.1, 0.6, 0.06]} radius={0.04} position={[0, -0.1, 0.06]} material={m.glass} />
      <group position={[0.36, -0.26, 0.16]} scale={0.32}>
        <mesh material={m.hot}>
          <cylinderGeometry args={[0.62, 0.62, 0.12, 48]} />
        </mesh>
        <mesh geometry={check} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.glass} />
      </group>
    </group>
  );
}

function Orb({ accent, kind }: { accent: string; kind: 'approved' | 'rejected' | 'checkin' }) {
  const m = useMats(accent);
  const icon = useMemo(() => extrude(kind === 'rejected' ? crossShape() : checkShape(), 0.1, 0.03), [kind]);
  return (
    <group position={[0, 0.62, 0]}>
      <mesh material={m.glass}>
        <sphereGeometry args={[0.52, 64, 48]} />
      </mesh>
      <mesh scale={1.12} material={m.glow}>
        <torusGeometry args={[0.5, 0.03, 16, 96]} />
      </mesh>
      <mesh geometry={icon} position={[0, 0, 0.42]} scale={0.95} material={m.hot} />
    </group>
  );
}

/** A glowing stack of application sheets; height grows with `stack` (0..1). */
function DocStack({ accent, stack = 0.5 }: { accent: string; stack?: number }) {
  const m = useMats(accent);
  const n = Math.max(3, Math.round(4 + stack * 18));
  return (
    <group position={[0, 0.05, 0]} rotation={[0, -0.35, 0]}>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position={[Math.sin(i * 1.7) * 0.03, 0.05 + i * 0.075, Math.cos(i * 2.3) * 0.03]} rotation={[0, Math.sin(i * 0.9) * 0.08, 0]}>
          <RoundedBox args={[0.92, 0.05, 0.66]} radius={0.015} material={i % 2 ? m.glass : m.white} />
        </group>
      ))}
      <group position={[0, 0.12 + n * 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <DocLines w={0.92} h={0.66} mat={m.glass} rows={5} z={0.0} />
      </group>
    </group>
  );
}

/** Fanned visa booklets with a globe emblem. */
function Passports({ accent }: { accent: string }) {
  const m = useMats(accent);
  const emblem = useCanvasTexture((ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = s * 0.02;
    ctx.font = `700 ${s * 0.16}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('VISA', s / 2, s * 0.32);
    const cx = s / 2, cy = s * 0.62, r = s * 0.17;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.45, r, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
  });
  const emb = useMemo(() => new THREE.MeshBasicMaterial({ map: emblem, transparent: true, toneMapped: false }), [emblem]);
  return (
    <group position={[0, 0.66, 0]}>
      {[-2, -1, 0].map((k) => (
        <group key={k} position={[k * 0.09, 0.04 - k * 0.02, k * 0.06]} rotation={[0, 0, k * 0.16]}>
          <RoundedBox args={[0.66, 0.9, 0.03]} radius={0.02} material={m.white} />
          <DocLines w={0.66} h={0.9} mat={m.glass} rows={6} z={0.02} />
        </group>
      ))}
      <group position={[0.12, -0.04, 0.12]} rotation={[0, -0.12, -0.06]}>
        <RoundedBox args={[0.62, 0.86, 0.07]} radius={0.04} material={m.glass} />
        <mesh position={[0, 0, 0.04]} material={emb}>
          <planeGeometry args={[0.56, 0.56]} />
        </mesh>
      </group>
    </group>
  );
}

/** v1 procedural objects, kept for comparison (`?objects=v1`). */
const LEGACY = typeof location !== 'undefined' && new URLSearchParams(location.search).get('objects') === 'v1';

export function JourneyObject({ kind, accent, stack }: { kind: ObjectKind; accent: string; stack?: number }): ReactNode {
  if (!LEGACY && hasCrystal(kind)) return <CrystalIcon kind={kind} accent={accent} />;
  switch (kind) {
    case 'docStack':
      return <DocStack accent={accent} stack={stack} />;
    case 'passports':
      return <Passports accent={accent} />;
    case 'submit':
      return <Submit accent={accent} />;
    case 'payment':
      return <Payment accent={accent} />;
    case 'review':
      return <Review accent={accent} />;
    case 'upload':
      return <Upload accent={accent} />;
    case 'biometric':
      return <Biometric accent={accent} />;
    case 'calendar':
      return <Calendar accent={accent} />;
    case 'documents':
      return <Documents accent={accent} />;
    case 'checkin':
    case 'approved':
    case 'rejected':
      return <Orb accent={accent} kind={kind} />;
  }
}
