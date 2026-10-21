import { frameMapper, type Box, type HomeLayout } from '../lib/homeLayout';
import type { SceneAnswer } from './types';
import { glanceOrb } from '../lib/glance';

/**
 * Runtime composer: places a scene's components for the current device.
 * Templates define slots per layout mode; any answer that uses those slots
 * is laid out automatically. Slots not available on a device are dropped
 * (the spoken answer still carries the information).
 */
export type SceneLayout = {
  title: Box | null;
  slots: Record<string, Box>;
  /** Globe target for this scene (screen px). */
  presence: { x: number; y: number; r: number; form: number };
};

type SlotMap = Record<string, [number, number, number, number]>;

const T: Record<SceneAnswer['template'], Record<HomeLayout['mode'], { title: [number, number, number, number] | null; slots: SlotMap }>> = {
  journey: {
    wide: { title: [960, 84, 1100, 90], slots: { tl: [290, 232, 480, 130], tr: [1630, 232, 480, 130], main: [960, 575, 1860, 480] } },
    portrait: { title: [540, 150, 960, 100], slots: { tl: [285, 270, 470, 120], tr: [795, 270, 470, 120], main: [540, 790, 1000, 880] } },
    compact: { title: [215, 112, 400, 56], slots: { tl: [115, 170, 196, 64], tr: [315, 170, 196, 64], main: [215, 450, 412, 480] } },
    short: { title: [466, 40, 520, 34], slots: { main: [466, 196, 910, 240] } },
  },
  // Time matrix: full-screen composition on wide; other devices reuse the stage slot.
  matrix: {
    wide: { title: [960, 84, 1100, 90], slots: { stage: [960, 540, 1920, 1080] } },
    portrait: { title: [540, 150, 960, 100], slots: { stage: [540, 760, 1020, 1000] } },
    compact: { title: [215, 112, 400, 56], slots: { stage: [215, 445, 418, 500] } },
    short: { title: [466, 40, 520, 34], slots: { stage: [466, 200, 910, 250] } },
  },
  // Home-style board (wide); other devices use the focus arrangement.
  board: {
    wide: { title: [960, 84, 1100, 90], slots: { main: [960, 540, 1920, 1080] } },
    portrait: { title: [540, 150, 960, 100], slots: { hero: [540, 590, 960, 600], left1: [290, 1010, 470, 170], left2: [790, 1010, 470, 170] } },
    compact: { title: [215, 112, 400, 56], slots: { hero: [215, 360, 412, 420], left1: [113, 625, 200, 108], left2: [317, 625, 200, 108] } },
    short: { title: [466, 40, 520, 34], slots: { hero: [466, 196, 470, 250], left1: [130, 140, 230, 108], left2: [130, 256, 230, 108] } },
  },
  // Online journey on the floor: full-screen on wide displays; phones/portrait fall back to the journey layout.
  floor: {
    wide: { title: [960, 76, 1100, 84], slots: { main: [960, 540, 1920, 1080] } },
    portrait: { title: [540, 150, 960, 100], slots: { tl: [285, 270, 470, 120], tr: [795, 270, 470, 120], main: [540, 790, 1000, 880] } },
    compact: { title: [215, 112, 400, 56], slots: { tl: [115, 170, 196, 64], tr: [315, 170, 196, 64], main: [215, 450, 412, 480] } },
    short: { title: [466, 40, 520, 34], slots: { main: [466, 196, 910, 240] } },
  },
  // Online journey v2 (glass jar board): full-screen on wide, the board carries its own heading.
  jars: {
    wide: { title: null, slots: { main: [960, 540, 1920, 1080] } },
    portrait: { title: [540, 150, 960, 100], slots: { tl: [285, 270, 470, 120], tr: [795, 270, 470, 120], main: [540, 790, 1000, 880] } },
    compact: { title: [215, 112, 400, 56], slots: { tl: [115, 170, 196, 64], tr: [315, 170, 196, 64], main: [215, 450, 412, 480] } },
    short: { title: [466, 40, 520, 34], slots: { main: [466, 196, 910, 240] } },
  },
  // Application Outcomes v2 (galaxy) and v1 (donut + core + cards): one full composition on wide; other devices use the board's own layouts.
  galaxy: {
    wide: { title: [960, 84, 1100, 90], slots: { main: [960, 540, 1920, 1080] } },
    portrait: { title: [540, 150, 960, 100], slots: { main: [540, 770, 1000, 1080] } },
    compact: { title: [215, 112, 400, 56], slots: { main: [215, 448, 400, 518] } },
    short: { title: [466, 40, 520, 34], slots: { main: [466, 186, 900, 236] } },
  },
  // VAS Revenue v2: full-screen composition on wide; other devices reuse the stage slot.
  revenue: {
    wide: { title: [960, 84, 1100, 90], slots: { stage: [960, 540, 1920, 1080] } },
    portrait: { title: [540, 150, 960, 100], slots: { stage: [540, 760, 1020, 1000] } },
    compact: { title: [215, 112, 400, 56], slots: { stage: [215, 445, 418, 500] } },
    short: { title: [466, 40, 520, 34], slots: { stage: [466, 200, 910, 250] } },
  },
  // Applications v2: full-screen composition on wide; other devices reuse the stage slot.
  appcore: {
    wide: { title: [960, 84, 1100, 90], slots: { stage: [960, 540, 1920, 1080] } },
    portrait: { title: [540, 150, 960, 100], slots: { stage: [540, 760, 1020, 1000] } },
    compact: { title: [215, 112, 400, 56], slots: { stage: [215, 445, 418, 500] } },
    short: { title: [466, 40, 520, 34], slots: { stage: [466, 200, 910, 250] } },
  },
  outcomes: {
    wide: { title: [960, 84, 1100, 90], slots: { main: [960, 540, 1920, 1080] } },
    portrait: { title: [540, 150, 960, 100], slots: { main: [540, 770, 1000, 1080] } },
    compact: { title: [215, 112, 400, 56], slots: { main: [215, 448, 400, 518] } },
    short: { title: [466, 40, 520, 34], slots: { main: [466, 186, 900, 236] } },
  },
  focus: {
    wide: {
      title: [960, 84, 1100, 90],
      slots: { hero: [960, 480, 700, 600], left1: [300, 330, 400, 190], left2: [300, 600, 400, 190], right: [1620, 470, 420, 540], wide: [960, 480, 1500, 600] },
    },
    portrait: {
      title: [540, 150, 960, 100],
      slots: { hero: [540, 590, 960, 600], left1: [290, 1010, 470, 170], left2: [790, 1010, 470, 170], right: [540, 1010, 960, 260], wide: [540, 690, 1000, 980] },
    },
    compact: {
      title: [215, 112, 400, 56],
      slots: { hero: [215, 360, 412, 420], left1: [113, 625, 200, 108], left2: [317, 625, 200, 108], wide: [215, 420, 412, 560] },
    },
    short: { title: [466, 40, 520, 34], slots: { hero: [466, 196, 470, 250], left1: [130, 140, 230, 108], left2: [130, 256, 230, 108], right: [800, 196, 240, 250], wide: [466, 196, 900, 250] } },
  },
  // Full-width band between the title and the summary (Top countries v1 leaderboards / v2 skyline).
  band: {
    wide: { title: [960, 84, 1100, 90], slots: { main: [960, 500, 1840, 716] } },
    portrait: { title: [540, 150, 960, 100], slots: { main: [540, 745, 1000, 990] } },
    compact: { title: [215, 112, 400, 56], slots: { main: [215, 448, 400, 518] } },
    short: { title: [466, 40, 520, 34], slots: { main: [466, 186, 900, 236] } },
  },
  // Stage with the title lifted and a taller stage (VAS Revenue v1: bigger core).
  stageTall: {
    wide: { title: [960, 58, 1100, 80], slots: { stage: [960, 500, 1840, 760] } },
    portrait: { title: [540, 150, 960, 100], slots: { stage: [540, 760, 1020, 1000] } },
    compact: { title: [215, 112, 400, 56], slots: { stage: [215, 445, 418, 500] } },
    short: { title: [466, 40, 520, 34], slots: { stage: [466, 200, 910, 250] } },
  },
  stage: {
    wide: { title: [960, 84, 1100, 90], slots: { stage: [960, 512, 1840, 690] } },
    portrait: { title: [540, 150, 960, 100], slots: { stage: [540, 760, 1020, 1000] } },
    compact: { title: [215, 112, 400, 56], slots: { stage: [215, 445, 418, 500] } },
    short: { title: [466, 40, 520, 34], slots: { stage: [466, 200, 910, 250] } },
  },
  ringCards: {
    // Cards at Home-capsule size around the ring; the split as one row of pills under it.
    wide: { title: [960, 92, 1100, 90], slots: { tl: [400, 330, 440, 154], bl: [400, 528, 440, 154], main: [960, 430, 720, 560], tr: [1520, 330, 440, 154], br: [1520, 528, 440, 154], legend: [960, 790, 1480, 78] } },
    portrait: { title: [540, 150, 960, 100], slots: { main: [540, 540, 860, 520], legend: [540, 880, 960, 160], tl: [290, 1060, 470, 150], tr: [790, 1060, 470, 150], bl: [290, 1225, 470, 150], br: [790, 1225, 470, 150] } },
    compact: { title: [215, 112, 400, 56], slots: { main: [215, 312, 412, 290], legend: [215, 575, 412, 205] } },
    short: { title: [466, 40, 520, 34], slots: { main: [300, 205, 400, 260], legend: [700, 205, 440, 190] } },
  },
  // Glance answer: the KPI sits inside ODIN's globe at the centre; two facts beside it (below on narrow screens).
  glance: {
    wide: { title: [960, 84, 1100, 90], slots: { hero: [960, 560, 1500, 720] } },
    portrait: { title: [540, 150, 960, 100], slots: { hero: [540, 760, 1000, 1000] } },
    compact: { title: [215, 112, 400, 56], slots: { hero: [215, 430, 412, 560] } },
    short: { title: [466, 40, 520, 34], slots: { hero: [466, 200, 900, 260] } },
  },
  notice: {
    wide: { title: [960, 84, 1100, 90], slots: { hero: [960, 470, 820, 460] } },
    portrait: { title: [540, 150, 960, 100], slots: { hero: [540, 640, 960, 600] } },
    compact: { title: [215, 112, 400, 56], slots: { hero: [215, 400, 412, 440] } },
    short: { title: [466, 40, 520, 34], slots: { hero: [466, 196, 640, 250] } },
  },
};

export function composeScene(answer: SceneAnswer, home: HomeLayout): SceneLayout {
  const { mode, box } = frameMapper(home.width, home.height);
  const t = T[answer.template][mode];
  const slots: Record<string, Box> = {};
  const floorWide = (answer.template === 'floor' || answer.template === 'jars' || answer.template === 'galaxy' || answer.template === 'outcomes' || answer.template === 'revenue' || answer.template === 'appcore' || answer.template === 'board' || answer.template === 'matrix') && mode === 'wide';
  // Portrait/compact focus scenes with a "right" panel move it into the support row.
  for (const p of answer.components) {
    let def = t.slots[p.slot];
    if (!def && (mode === 'portrait' || mode === 'compact') && p.slot === 'right') def = t.slots.left1;
    if (def) slots[p.spec.key] = box(...def);
    // Floor journey covers the viewport exactly (positions are mapped to the floor artwork).
    if (floorWide && (p.slot === 'main' || ((answer.template === 'matrix' || answer.template === 'revenue' || answer.template === 'appcore') && p.slot === 'stage'))) slots[p.spec.key] = { x: home.width / 2, y: home.height / 2, w: home.width, h: home.height };
  }
  // Portrait: when a right panel exists, supports share one row with it.
  if (mode === 'portrait' && answer.template === 'focus' && answer.components.some((p) => p.slot === 'right')) {
    for (const p of answer.components) {
      if (p.slot === 'left1') slots[p.spec.key] = box(220, 1010, 380, 170);
      if (p.slot === 'left2') slots[p.spec.key] = box(220, 1200, 380, 170);
      if (p.slot === 'right') slots[p.spec.key] = box(740, 1105, 580, 360);
    }
  }
  if (mode === 'compact' && answer.template === 'focus' && answer.components.some((p) => p.slot === 'right')) {
    // Phones: hero + two support cards; the detail panel is carried by ODIN's spoken answer.
    for (const p of answer.components) if (p.slot === 'right') delete slots[p.spec.key];
    for (const p of answer.components) if (p.slot === 'left2') slots[p.spec.key] = box(317, 625, 200, 108);
  }

  let presence = { x: home.ring.x, y: home.ring.y - home.globe.r * 0.6, r: home.globe.r * 0.55, form: 0 };
  if (answer.presence === 'core') {
    const main = slots.donut;
    if (main) presence = { x: main.x, y: main.y, r: Math.min(main.w, main.h) * 0.2, form: 1 };
    const g = slots.glance;
    if (g) { const o = glanceOrb(g, home); presence = { x: o.x, y: o.y, r: o.r, form: 1 }; }
  }
  return { title: t.title ? box(...t.title) : null, slots, presence };
}
