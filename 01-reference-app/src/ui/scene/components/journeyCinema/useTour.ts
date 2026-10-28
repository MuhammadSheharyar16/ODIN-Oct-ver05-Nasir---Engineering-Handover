import { useEffect, useState, type RefObject } from 'react';
import { useExperience } from '../../../../odin/experience';
import { startSpeechPreview } from '../../../../audio/odinAudio';
import type { FloorData } from '../floorJourney';
import type { CardStage } from './data';

export const TRAVEL_MS = 1500;

/**
 * The floor tour shared by V33 and V34: the application stops at each stage of a
 * route, ODIN speaks the first two loops (`speakStages`, V33), then it keeps cycling
 * the routes quietly. V34 speaks only the summary (the CEO's time), so its stages
 * light up and animate in silence.
 * Pauses while the scene is not the active answer. `dwellRef` (V35 slideshow) can hold a
 * silent stop longer without restarting the tour.
 */
export function useTour(host: RefObject<HTMLElement | null>, routes: CardStage[][], data: FloorData, reduced: boolean, speakStages = true, dwellRef?: RefObject<number>) {
  const [tour, setTour] = useState({ route: 0, stop: 0, travel: false });
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const sceneId = () => el.closest<HTMLElement>('[data-scene]')?.dataset.scene;
    const isActive = () => {
      const st = useExperience.getState();
      return st.active?.id === sceneId() && st.leaving === undefined;
    };
    let r = 0, stop = 0, spoken = 0, timer = 0, alive = true;
    const wait = (ms: number, fn: () => void) => {
      const until = performance.now() + ms;
      const tick = () => {
        if (!alive) return;
        if (!isActive()) { timer = window.setTimeout(() => wait(until - performance.now(), fn), 300); return; }
        const left = until - performance.now();
        if (left <= 0) fn(); else timer = window.setTimeout(tick, Math.min(left, 300));
      };
      tick();
    };
    const arrive = (first: boolean) => {
      const id = routes[r][stop];
      setTour({ route: r, stop, travel: false });
      const speak = speakStages && spoken < 2 && isActive();
      // The opening stop is spoken by the director as the scene's answer.
      if (speak && !first) startSpeechPreview(data[id].say);
      const dwell = speak ? Math.max(2600, data[id].say.split(/\s+/).length * 330 + 900) : dwellRef?.current ?? 2200;
      wait(dwell, next);
    };
    const next = () => {
      if (stop >= routes[r].length - 1) {
        wait(900, () => { spoken++; r = (r + 1) % routes.length; stop = 0; arrive(false); });
        return;
      }
      setTour({ route: r, stop, travel: true });
      wait(reduced ? 200 : TRAVEL_MS, () => { stop++; arrive(false); });
    };
    arrive(true);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [host, routes, data, reduced, speakStages, dwellRef]);

  const route = routes[tour.route];
  return { tour, route, active: tour.travel ? null : route[tour.stop] };
}
