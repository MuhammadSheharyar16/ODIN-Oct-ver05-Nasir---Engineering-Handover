import { beginUtterance, endUtterance, makeUtterance } from '../state/caption';

/**
 * ODIN's OUTPUT audio features, read every frame by the globe and the
 * speaking spectrum. Filled by a real Web Audio analyser once TTS playback is
 * connected (Phase 3). Until then `startSpeechPreview` drives it with a
 * clearly-flagged simulation (`simulated = true`) for design review only.
 */
export const BIN_COUNT = 64;

export const odinAudio = {
  level: 0,
  bins: new Float32Array(BIN_COUNT),
  speaking: false,
  simulated: false,
};

let raf = 0;
let start = 0;
let endTimer = 0;

function hash(n: number) {
  return Math.abs(Math.sin(n * 127.1) * 43758.5453) % 1;
}

/** Speech-like envelope: syllables ~4.5 Hz, phrase gaps, two formant bumps. */
function simulate(now: number) {
  const t = (now - start) / 1000;
  const phrase = 0.5 + 0.5 * Math.sin(t * 0.9);
  const gap = Math.sin(t * 0.55) > -0.82 ? 1 : 0.08;
  const syl = Math.pow(Math.max(0, Math.sin(t * Math.PI * 4.6 + Math.sin(t * 2.3) * 1.4)), 0.65);
  const target = gap * (0.32 + 0.68 * syl) * (0.75 + 0.25 * phrase);
  odinAudio.level += (target - odinAudio.level) * 0.35;
  for (let i = 0; i < BIN_COUNT; i++) {
    const f1 = Math.exp(-Math.pow((i - 10) / 7, 2));
    const f2 = 0.65 * Math.exp(-Math.pow((i - 26 - Math.sin(t * 3) * 4) / 9, 2));
    const f3 = 0.35 * Math.exp(-Math.pow((i - 44) / 10, 2));
    const jitter = 0.7 + 0.3 * hash(i + Math.floor(t * 18) * 3.1);
    const v = (f1 + f2 + f3) * jitter * odinAudio.level;
    odinAudio.bins[i] += (Math.min(1, v) - odinAudio.bins[i]) * 0.4;
  }
}

function decay() {
  odinAudio.level *= 0.86;
  for (let i = 0; i < BIN_COUNT; i++) odinAudio.bins[i] *= 0.84;
}

/**
 * Simulated ODIN speech for design review: plays `text` as a caption with
 * estimated word timing and a speech-like audio envelope, then stops.
 */
export function startSpeechPreview(text: string) {
  stopSpeech();
  const u = makeUtterance(text);
  beginUtterance(u);
  window.clearTimeout(endTimer);
  endTimer = window.setTimeout(stopSpeech, u.durationMs);
  odinAudio.speaking = true;
  odinAudio.simulated = true;
  start = performance.now();
  cancelAnimationFrame(raf);
  const loop = (now: number) => {
    if (odinAudio.speaking) simulate(now);
    else decay();
    if (odinAudio.speaking || odinAudio.level > 0.002) raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}

export function stopSpeech() {
  window.clearTimeout(endTimer);
  if (odinAudio.speaking) endUtterance();
  odinAudio.speaking = false;
  odinAudio.simulated = false;
}
