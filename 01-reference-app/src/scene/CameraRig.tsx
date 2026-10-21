import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { damp, prefersReducedMotion } from '../lib/motion';
import { envParallax } from '../lib/layout';
import { intro } from '../lib/intro';
import { envView } from '../lib/envFit';

/**
 * Gentle parallax on the ROOM only: a slow breathing drift plus a small
 * response to the pointer, applied to the environment layers (envParallax).
 * The camera stays still, so UI — HTML and 3D objects alike — never moves
 * with the cursor. Translation only, deliberately small amplitudes.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const reduced = useMemo(prefersReducedMotion, []);
  const pointer = useRef({ x: 0, y: 0 });
  const t = useRef(0);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((_, dt) => {
    // Intro dolly: ease forward into the room.
    camera.position.z = (1 - intro.camera) * 1.1;
    if (reduced) return;
    t.current += dt;
    const driftX = Math.sin(t.current * 0.11) * 0.05;
    const driftY = Math.sin(t.current * 0.07 + 1.3) * 0.025;
    // Anchored while the camera is pushed onto the floor: DOM overlays sit on the artwork.
    const free = envView.target.zoom < 1.01 ? 1 : 0;
    const tx = (driftX + pointer.current.x * 0.07) * free;
    const ty = (driftY - pointer.current.y * 0.035) * free;
    envParallax.x = damp(envParallax.x, tx, 1.6, dt);
    envParallax.y = damp(envParallax.y, ty, 1.6, dt);
    camera.position.x = 0;
    camera.position.y = 0;
  });

  return null;
}
