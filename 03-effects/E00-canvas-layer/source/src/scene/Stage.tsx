import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import { JourneyObjects } from './journey/Journey3D';
import { PlinthObjects } from './plinth/Plinths3D';
import { EarthObjects } from './earth/Earth3D';
import { OrbObjects } from './orb/GlassOrb3D';
import * as THREE from 'three';
import { CAMERA_FOV } from '../lib/envFit';
import { useStage } from '../state/store';
import { CameraRig } from './CameraRig';
import { EnvironmentLayers } from './EnvironmentLayers';
import { OdinGlobe } from './globe/OdinGlobe';
import { SpectrumAura } from './SpectrumAura';
import { TransitionParticles } from './TransitionParticles';
import { ProxyObjects } from './Donut3D';
import { PostFX } from './PostFX';

/** Rendered once the environment textures have resolved. */
function EnvReady() {
  useEffect(() => {
    useStage.setState({ envReady: true });
  }, []);
  return null;
}

/** The single persistent WebGL canvas behind all ODIN compositions. */
const DPR = { high: 2, medium: 1.5, low: 1 } as const;
const DOWN = { high: 'medium', medium: 'low', low: 'low' } as const;
const UP = { low: 'medium', medium: 'high', high: 'high' } as const;

export function Stage() {
  const tier = useStage((s) => s.tier);
  const shift = (map: typeof DOWN | typeof UP) => {
    const st = useStage.getState();
    if (!st.tierLocked) useStage.setState({ tier: map[st.tier] });
  };
  return (
    <Canvas
      className="stage-canvas"
      dpr={[1, Math.min(DPR[tier], typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)]}
      camera={{ fov: CAMERA_FOV, position: [0, 0, 0], near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.NoToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
    >
      <color attach="background" args={['#0b1424']} />
      {/* Adaptive quality: drop a tier below ~45 fps, climb back above ~58 fps. */}
      <PerformanceMonitor bounds={() => [45, 58]} flipflops={4} onDecline={() => shift(DOWN)} onIncline={() => shift(UP)} />
      <Suspense fallback={null}>
        <EnvironmentLayers />
        <EnvReady />
      </Suspense>
      <SpectrumAura />
      <OdinGlobe />
      <ProxyObjects />
      <JourneyObjects />
      <PlinthObjects />
      <EarthObjects />
      <OrbObjects />
      {/* Studio reflections for glass/chrome objects (procedural, offline; not visible as background). */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="ring" intensity={0.55} color="#e9eef8" position={[0, 0, 0]} scale={40} />
        <Lightformer form="rect" intensity={3.2} color="#fff4e2" position={[-4, 5, 3]} scale={[10, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2.2} color="#d9ebff" position={[5, 2, 2]} scale={[6, 8, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={1.6} color="#ffffff" position={[0, 3, -5]} scale={6} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#9fc4ff" position={[0, -4, 2]} scale={[12, 3, 1]} target={[0, 0, 0]} />
      </Environment>
      <hemisphereLight args={['#fff2dd', '#5a6c90', 0.9]} />
      <directionalLight position={[-3, 5, 4]} intensity={1.6} color="#fff1dc" />
      <directionalLight position={[4, 1, 3]} intensity={0.6} color="#cfe3ff" />
      <TransitionParticles />
      <CameraRig />
      {/* Own boundary: effect resources may suspend; never block the scene. */}
      <Suspense fallback={null}>
        <PostFX />
      </Suspense>
    </Canvas>
  );
}
