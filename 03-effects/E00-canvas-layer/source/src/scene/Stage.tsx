import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
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
import { onTick } from '../lib/ticker';
import { gpuInfo, isLite } from '../lib/environment';
import { odinAudio } from '../audio/odinAudio';
import { presence } from '../odin/experience';
import { fx } from '../odin/fx';
import { intro } from '../lib/intro';
import { envView } from '../lib/envFit';

/** Rendered once the environment textures have resolved. */
function EnvReady() {
  useEffect(() => {
    useStage.setState({ envReady: true });
  }, []);
  return null;
}

/**
 * Drives the canvas from the shared 60 fps ticker (ver05.3 performance, P3). While something in
 * the 3D scene moves (ODIN speaking, the globe on screen, a transition, a scene change, the camera
 * or room easing, the pointer moving the parallax) it renders every tick; when the screen is calm
 * only the room's slow breathing drift and water shimmer remain, so it renders every third tick
 * (20 fps), which cannot be seen at that speed but lets the browser reuse the glass blurs above.
 */
const IDLE_EVERY = 3;
// Lite mode (software WebGL): 30 fps while something moves, 10 fps when calm, fewer pixels.
const LITE = isLite();
const BUSY_EVERY = LITE ? 2 : 1;
const CALM_EVERY = LITE ? 6 : IDLE_EVERY;
function Driver() {
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    let busyUntil = 0, lastFx = -1, n = 0, t0 = -1;
    const bump = (ms: number) => { busyUntil = Math.max(busyUntil, performance.now() + ms); };
    const unsub = useStage.subscribe(() => bump(3500));
    const onPointer = () => bump(2500);
    window.addEventListener('pointermove', onPointer, { passive: true });
    const settled = () => {
      const c = envView.cur, t = envView.target;
      return Math.abs(c.zoom - t.zoom) < 1e-3 && Math.abs(c.cx - t.cx) < 1e-3 && Math.abs(c.cy - t.cy) < 1e-3;
    };
    const stop = onTick((now) => {
      if (t0 < 0) t0 = now;
      if (fx.version !== lastFx) { lastFx = fx.version; bump(fx.duration * 1000 + 1500); }
      const why = { recent: now < busyUntil, speaking: odinAudio.speaking || odinAudio.level > 0.002, globe: presence.followHome || presence.target.form > 0.02, intro: intro.env < 1, camera: !settled() };
      const busy = why.recent || why.speaking || why.globe || why.intro || why.camera;
      if (import.meta.env.DEV) (window as unknown as { __odinRender: unknown }).__odinRender = { busy, ...why, env: intro.env, form: presence.target.form, view: { ...envView.cur }, target: { ...envView.target } };
      n++;
      if (busy ? n % BUSY_EVERY === 0 : n % CALM_EVERY === 0) advance((now - t0) / 1000 + 1 / 60);
    });
    return () => { stop(); unsub(); window.removeEventListener('pointermove', onPointer); };
  }, [advance]);
  return null;
}

/**
 * The single persistent WebGL canvas behind all ODIN compositions.
 * Pixel density by tier, capped by a pixel budget (P6): about 4 million device pixels, so a
 * large retina screen renders at ~1.45x rather than 2x (the room plates are photographs and all
 * text is HTML, so nothing gets visibly softer).
 */
const DPR = { high: 2, medium: 1.5, low: 1 } as const;
const PIXEL_BUDGET = LITE ? 0.8e6 : 4e6;
const budgetDpr = () => typeof window === 'undefined' ? 1 : Math.max(LITE ? 0.6 : 1, Math.sqrt(PIXEL_BUDGET / Math.max(1, window.innerWidth * window.innerHeight)));

export function Stage() {
  // No WebGL at all (a virtual desktop without GPU or software rendering): the room as a still picture.
  if (gpuInfo().webgl === 'none') return <StaticRoom />;
  return <StageCanvas />;
}

/** The ODIN room without WebGL: exterior and interior plates, layered like the 3D room at rest. */
function StaticRoom() {
  const base = import.meta.env.BASE_URL;
  return (
    <div className="stage-canvas stage-static" aria-hidden>
      <img src={`${base}env/exterior-1600.webp`} alt="" />
      <img src={`${base}env/interior-1600.webp`} alt="" onLoad={() => useStage.setState({ envReady: true })} onError={() => useStage.setState({ envReady: true })} />
    </div>
  );
}

function StageCanvas() {
  const tier = useStage((s) => s.tier);
  return (
    <Canvas
      className="stage-canvas"
      frameloop="never"
      dpr={[1, Math.min(DPR[tier], budgetDpr(), typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)]}
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
      {/* Rendering is driven by the shared ticker (P3); quality is set by tier and pixel budget (P6). */}
      <Driver />
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
