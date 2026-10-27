import { useEffect, useRef } from 'react';
import type { JourneySpec } from '../../../odin/types';
import { useOdinLayout } from '../../bridge';
import { useExperience } from '../../../odin/experience';
import { startSpeechPreview } from '../../../audio/odinAudio';
import { prefersReducedMotion } from '../../../lib/motion';
import { FLOOR_CX, FLOOR_FOOTPRINT, floorScale, mountFloorJourney } from './floorJourney';
import './floor.css';

/**
 * Online visa journey laid on the ODIN interior floor (wide screens). The
 * director pushes the camera onto the floor for this scene (envFit.floorView);
 * the traveller tours the route and ODIN narrates each stage as it arrives.
 */
export function JourneyFloor({ spec }: { spec: JourneySpec }) {
  const host = useRef<HTMLDivElement>(null);
  const { width, height, mic } = useOdinLayout();
  const floorBottom = mic.y - mic.h / 2;

  useEffect(() => {
    const el = host.current;
    if (!el || !spec.floor) return;
    const sceneId = () => el.closest<HTMLElement>('[data-scene]')?.dataset.scene;
    const isActive = () => {
      const st = useExperience.getState();
      return st.active?.id === sceneId() && st.leaving === undefined;
    };
    const ctl = mountFloorJourney(el, spec.floor, {
      width,
      height,
      floorBottom,
      reduced: prefersReducedMotion(),
      isActive,
      // The opening stop is spoken by the director as the scene's answer.
      onArrive: (_id, say, first) => {
        if (!first) startSpeechPreview(say);
      },
      dwellFor: (say) => say.split(/\s+/).length * 330 + 900,
    });
    return () => ctl.destroy();
  }, [spec, width, height, floorBottom]);

  const sy = floorScale(height, floorBottom);
  const sx = Math.min(sy, width / 1920);
  const f = FLOOR_FOOTPRINT;
  return (
    <div className="fj" data-surface>
      <div ref={host} className="fj__host" />
      {/* Footprint for ODIN's floor spectrum (not drawn). */}
      <span
        className="fj__aura"
        data-aura="floor"
        data-rise="0.015"
        style={{ left: width / 2 + (f.x0 - FLOOR_CX) * sx, top: f.y0 * sy, width: (f.x1 - f.x0) * sx, height: (f.y1 - f.y0) * sy }}
      />
    </div>
  );
}
