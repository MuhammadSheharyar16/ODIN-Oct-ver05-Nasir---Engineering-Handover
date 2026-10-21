import { create } from 'zustand';

/**
 * What ODIN is saying. The summary strip renders this text; the voice plays
 * it. One source for both, so spoken and displayed words always match.
 *
 * Word timing: with ElevenLabs, use the character alignment returned with the
 * audio (`wordStarts`). Until then timing is estimated from a speaking rate.
 */
export type Utterance = {
  id: number;
  text: string;
  words: string[];
  /** Start time of each word in ms from utterance start. */
  wordStarts: number[];
  durationMs: number;
};

type CaptionState = {
  current: Utterance | null;
  /** performance.now() when the current utterance started playing. */
  startedAt: number;
  speaking: boolean;
};

export const useCaption = create<CaptionState>(() => ({ current: null, startedAt: 0, speaking: false }));

let seq = 0;

/** Estimate per-word timing (≈2.7 words/s, small pauses after punctuation). */
export function makeUtterance(text: string): Utterance {
  const words = text.trim().split(/\s+/);
  const wordStarts: number[] = [];
  let t = 0;
  for (const w of words) {
    wordStarts.push(t);
    t += 250 + w.length * 22 + (/[.,;:]$/.test(w) ? 260 : 0);
  }
  return { id: ++seq, text, words, wordStarts, durationMs: t + 200 };
}

export function beginUtterance(u: Utterance) {
  useCaption.setState({ current: u, startedAt: performance.now(), speaking: true });
}

export function endUtterance() {
  useCaption.setState({ speaking: false });
}
