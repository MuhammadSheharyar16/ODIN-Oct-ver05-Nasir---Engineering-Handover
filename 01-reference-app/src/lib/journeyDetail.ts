import { create } from 'zustand';

/**
 * Journey detail view (V39 Online Visa Journey v4.5, Nasir 27 Oct, from Anupam's feedback):
 * a stage dashboard opens beside the journey and follows the tour stage by stage, until it is
 * closed. Driven by voice in ODIN; the Detail view button is there for the demo.
 *
 *   voice / typed (on V39): "tell me more", "show the details", "more detail on draft applications" …
 *                           "hide the details", "back to the journey", "close details" …
 *   button:                 Detail view, under the stage card
 *   code:                   useJourneyDetail.getState().set(true | false)
 */
export const useJourneyDetail = create<{ on: boolean; set: (on: boolean) => void; toggle: () => void }>((set) => ({
  on: false,
  set: (on) => set({ on }),
  toggle: () => set((s) => ({ on: !s.on })),
}));

const ON = /\b(tell me more|more detail|more details|in detail|show (me )?(the )?details?|detail(ed)? view|deep dive|drill down|break(down| it down))\b/;
const OFF = /\b(hide|close|exit|stop|no more)( the)? details?\b|\bback to (the )?journey\b|\b(less|fewer) details?\b|\bdetail(ed)? view off\b/;

/** 'on' / 'off' when the words ask for the detail view, otherwise null. Off wins. */
export function detailCommand(text: string): 'on' | 'off' | null {
  const t = ` ${text.toLowerCase().replace(/[?!.,]/g, ' ').replace(/\s+/g, ' ')} `;
  if (OFF.test(t)) return 'off';
  if (ON.test(t)) return 'on';
  return null;
}
