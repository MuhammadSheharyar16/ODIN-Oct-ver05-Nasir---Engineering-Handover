import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useStage } from '../state/store';

/**
 * Cinematic finish (Phase 1 premium pass): selective bloom on light sources
 * only (threshold above the photographic background) and a soft vignette. The fine film grain is a
 * static CSS layer over the canvas (`.stage-grain`, ver05.3 performance P4): animated grain changed
 * every pixel every frame, so the canvas could never rest and every glass blur above it was redone.
 * Bloom runs at half resolution. Disable with `?fx=0` for low-end devices or comparisons.
 */
export const POSTFX_ON = typeof location === 'undefined' || new URLSearchParams(location.search).get('fx') !== '0';

/**
 * Colour accuracy under the composer: our custom GLSL shaders author colours as
 * display (sRGB) values. The composer renders into a linear target and encodes
 * to sRGB at the end, which would lift those colours (navy → pale). For plain
 * ShaderMaterials (not postprocessing's own passes, not shaders that already
 * handle colour space) decode the output to linear first, so the final encode
 * reproduces exactly what was authored. Output is clamped to 0–1 first, as the
 * screen would clip it (unclamped decode of additive >1 values blows out bloom).
 */
if (POSTFX_ON) {
  const proto = THREE.ShaderMaterial.prototype as THREE.ShaderMaterial & { __odinCs?: boolean };
  if (!proto.__odinCs) {
    proto.__odinCs = true;
    proto.onBeforeCompile = function (this: THREE.ShaderMaterial, shader) {
      if (this.constructor !== THREE.ShaderMaterial) return;
      // Additive glows (aura, halos, arcs) were tuned as light added in display
      // space; they keep that look. Only opaque/normal surfaces need the decode.
      if (this.blending === THREE.AdditiveBlending) return;
      const fs = shader.fragmentShader;
      if (fs.includes('colorspace_fragment') || !fs.includes('gl_FragColor')) return;
      const end = fs.lastIndexOf('}');
      shader.fragmentShader = `${fs.slice(0, end)}  gl_FragColor.rgb = sRGBTransferEOTF(vec4(clamp(gl_FragColor.rgb, 0.0, 1.0), 1.0)).rgb;\n${fs.slice(end)}`;
    };
  }
}

export function PostFX() {
  const tier = useStage((s) => s.tier);
  if (!POSTFX_ON || tier === 'low') return null;
  return (
    // No MSAA / half-float targets: they fail on some GPUs (black canvas). SMAA restores edges.
    <EffectComposer multisampling={0}>
      {/* Threshold sits above the daylight plate so only light sources glow; keeps cards and text crisp. */}
      <Bloom mipmapBlur resolutionScale={0.5} luminanceThreshold={0.985} luminanceSmoothing={0.04} intensity={0.32} radius={0.6} />
      <Vignette offset={0.36} darkness={0.32} blendFunction={BlendFunction.NORMAL} />
      <SMAA />
    </EffectComposer>
  );
}
