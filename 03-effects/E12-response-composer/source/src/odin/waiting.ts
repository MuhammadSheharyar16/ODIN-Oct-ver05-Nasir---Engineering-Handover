import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { startSpeechPreview } from '../audio/odinAudio';

/**
 * "ODIN is working": what ODIN says and shows while an answer is on its way.
 * Real latency comes from the AI and data services; for the demo `?latency=`
 * sets it (seconds) so the team can choose the target time:
 *   ?latency=12              ODIN thinks for 12 s, checking in as it waits, then answers.
 *   ?latency=12&progressive  the screen appears at once; each number shows a loader
 *                            and arrives in turn over 12 s.
 * Spec for the AI team (phrases, timings): docs/waiting-spec.md.
 */
export type CheckIn = { at: number; say: string; note: string };

/** Spoken check-ins (seconds after the question). At 60 s ODIN retries once. */
export const CHECK_INS: CheckIn[] = [
  { at: 10, say: 'One moment, please. I’m gathering the latest figures.', note: 'Gathering the latest figures…' },
  { at: 15, say: 'Thank you for your patience. I’m confirming the figures.', note: 'Confirming the figures…' },
  { at: 20, say: 'This one needs a little more time. Almost there.', note: 'Almost there…' },
  { at: 30, say: 'Thank you for waiting. The data is taking a little longer than usual.', note: 'A little longer than usual…' },
  { at: 45, say: 'I’m still working on it, and I’ll have it for you shortly.', note: 'Still working on it…' },
  { at: 60, say: 'My apologies, this is taking longer than it should. Allow me to try once more.', note: 'Trying once more…' },
];
export const RETRY_AT_S = 60;
/** After the retry, the demo answer arrives this long after (the retry succeeds). */
export const RETRY_ANSWER_S = 3;

type Waiting = {
  /** Mic-bar line while waiting (null = the default "Thinking…"). */
  note: string | null;
  /** performance.now() when the data arrives (progressive loading); 0 = already here. */
  dataAt: number;
};
export const useWaiting = create<Waiting>(() => ({ note: null, dataAt: 0 }));

export function demoLatency(search = typeof location !== 'undefined' ? location.search : '') {
  const p = new URLSearchParams(search);
  const raw = p.get('latency');
  const s = raw ? parseFloat(raw) * (/ms$/.test(raw) ? 0.001 : 1) : 0;
  const capped = Number.isFinite(s) && s > 0 ? (s > RETRY_AT_S ? RETRY_AT_S + RETRY_ANSWER_S : s) : 0;
  return { ms: Math.round(capped * 1000), progressive: p.has('progressive') };
}

/** Check-ins due before `ms` (and the retry when the wait passes 60 s). */
export const checkInsWithin = (ms: number) => CHECK_INS.filter((c) => c.at * 1000 < ms);

/**
 * Wait `ms`, speaking each due check-in. `alive()` false (a new question) stops it.
 * Returns a promise and a cancel for the timers.
 */
export function waitWithCheckIns(ms: number, alive: () => boolean) {
  const timers: number[] = [];
  const cancel = () => { timers.forEach(clearTimeout); useWaiting.setState({ note: null }); };
  const done = new Promise<void>((resolve) => {
    for (const c of checkInsWithin(ms)) {
      timers.push(window.setTimeout(() => {
        if (!alive()) return cancel();
        useWaiting.setState({ note: c.note });
        startSpeechPreview(c.say);
      }, c.at * 1000));
    }
    timers.push(window.setTimeout(() => { useWaiting.setState({ note: null }); resolve(); }, ms));
  });
  return { done, cancel };
}

/** Progressive loading: false until the data is in (plus `extraMs`, so numbers arrive in turn). */
export function useArrived(extraMs = 0) {
  const dataAt = useWaiting((s) => s.dataAt);
  const [ready, setReady] = useState(() => dataAt + extraMs <= performance.now());
  useEffect(() => {
    const wait = dataAt + extraMs - performance.now();
    if (!dataAt || wait <= 0) { setReady(true); return; }
    setReady(false);
    const id = window.setTimeout(() => setReady(true), wait);
    return () => window.clearTimeout(id);
  }, [dataAt, extraMs]);
  return ready;
}
