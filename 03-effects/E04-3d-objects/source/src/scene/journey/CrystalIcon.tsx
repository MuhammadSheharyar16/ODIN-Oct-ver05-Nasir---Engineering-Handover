import { createElement, useEffect, useMemo, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  BadgeCheck, CalendarCheck, CloudUpload, CreditCard, FileUp, Fingerprint, FolderCheck, ScanSearch, type LucideIcon,
} from 'lucide-react';

/**
 * Premium stage object (Phase 1 v2): a crystal tile — refractive glass with an
 * accent-tinted body and bevelled edges — holding a luminous inlaid icon, on a
 * chrome back plate. Icons come from the same Lucide set as the 2D UI, so 2D
 * and 3D stay consistent and crisp at any resolution.
 * Units: pedestal radius = 1, pedestal top at y = 0.
 */

const ICONS: Record<string, LucideIcon> = {
  submit: FileUp, payment: CreditCard, review: ScanSearch, upload: CloudUpload,
  biometric: Fingerprint, calendar: CalendarCheck, documents: FolderCheck, checkin: BadgeCheck,
};

export const hasCrystal = (kind: string) => kind in ICONS;

const cache = new Map<string, Promise<{ core: THREE.Texture; glow: THREE.Texture }>>();

function iconTextures(kind: string, accent: string) {
  const id = `${kind}${accent}`;
  if (!cache.has(id)) {
    cache.set(
      id,
      new Promise((resolve) => {
        const svg = renderToStaticMarkup(createElement(ICONS[kind], { size: 24, color: '#ffffff', strokeWidth: 1.9 }));
        const img = new Image();
        img.onload = () => {
          const S = 512;
          const mk = (glow: boolean) => {
            const c = document.createElement('canvas');
            c.width = c.height = S;
            const ctx = c.getContext('2d')!;
            const pad = S * 0.16;
            if (glow) {
              ctx.filter = `blur(${S * 0.035}px)`;
              ctx.globalAlpha = 0.95;
              ctx.drawImage(img, pad, pad, S - pad * 2, S - pad * 2);
              ctx.filter = `blur(${S * 0.012}px)`;
              ctx.drawImage(img, pad, pad, S - pad * 2, S - pad * 2);
              ctx.globalCompositeOperation = 'source-in';
              ctx.filter = 'none';
              ctx.fillStyle = accent;
              ctx.fillRect(0, 0, S, S);
            } else {
              ctx.drawImage(img, pad, pad, S - pad * 2, S - pad * 2);
            }
            const t = new THREE.CanvasTexture(c);
            t.colorSpace = THREE.SRGBColorSpace;
            t.anisotropy = 8;
            return t;
          };
          resolve({ core: mk(false), glow: mk(true) });
        };
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      }),
    );
  }
  return cache.get(id)!;
}

export function CrystalIcon({ kind, accent }: { kind: string; accent: string }) {
  const [tex, setTex] = useState<{ core: THREE.Texture; glow: THREE.Texture } | null>(null);
  useEffect(() => {
    let live = true;
    iconTextures(kind, accent).then((t) => live && setTex(t));
    return () => {
      live = false;
    };
  }, [kind, accent]);

  const m = useMemo(() => {
    const a = new THREE.Color(accent);
    return {
      // Vivid accent glass: refractive, lit from within, iridescent clear-coat.
      crystal: new THREE.MeshPhysicalMaterial({
        color: a.clone().lerp(new THREE.Color('#ffffff'), 0.2),
        roughness: 0.05,
        metalness: 0,
        transmission: 0.72,
        thickness: 0.9,
        ior: 1.5,
        attenuationColor: a.clone(),
        attenuationDistance: 0.7,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        iridescence: 0.4,
        iridescenceIOR: 1.35,
        specularIntensity: 1,
        envMapIntensity: 2.4,
        emissive: a,
        emissiveIntensity: 0.42,
        transparent: true,
      }),
      // Luminous accent back plate (deep glass, not dark chrome).
      chrome: new THREE.MeshPhysicalMaterial({
        color: a.clone().multiplyScalar(0.55), metalness: 0.3, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.04,
        emissive: a, emissiveIntensity: 0.55, envMapIntensity: 1.8, transparent: true,
      }),
      rim: new THREE.MeshBasicMaterial({ color: a.clone().lerp(new THREE.Color('#ffffff'), 0.3), transparent: true, toneMapped: false }),
    };
  }, [accent]);

  const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false } as const;
  return (
    <group position={[0, 0.64, 0]} rotation={[0, -0.26, 0]} scale={0.78}>
      {/* Chrome back plate with accent light seam */}
      <RoundedBox args={[1.3, 1.3, 0.12]} radius={0.22} smoothness={6} position={[0, 0, -0.26]} material={m.chrome} />
      <RoundedBox args={[1.22, 1.22, 0.02]} radius={0.2} smoothness={6} position={[0, 0, -0.195]} material={m.rim} />
      {/* Inner luminous icon (seen through the crystal) */}
      {tex && (
        <>
          <mesh position={[0, 0, -0.06]} scale={1.55} renderOrder={1.46}>
            <planeGeometry />
            <meshBasicMaterial map={tex.glow} {...add} color={new THREE.Color('#ffffff')} />
          </mesh>
          <mesh position={[0, 0, 0.0]} scale={1.2} renderOrder={1.47}>
            <planeGeometry />
            <meshBasicMaterial map={tex.core} {...add} color={new THREE.Color('#ffffff')} />
          </mesh>
        </>
      )}
      {/* Crystal tile */}
      <RoundedBox args={[1.2, 1.2, 0.42]} radius={0.2} smoothness={8} material={m.crystal} />
      {/* Engraved highlight on the front face */}
      {tex && (
        <mesh position={[0, 0, 0.215]} scale={1.18} renderOrder={1.48}>
          <planeGeometry />
          <meshBasicMaterial map={tex.core} {...add} opacity={0.55} />
        </mesh>
      )}
    </group>
  );
}
