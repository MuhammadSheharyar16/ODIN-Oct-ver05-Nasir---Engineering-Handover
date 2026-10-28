/**
 * Shared journey layout (percent of the journey box). The WebGL pedestals,
 * objects and light path and the DOM cards all read from here, so they line up.
 */
export type Pt = { x: number; y: number };

export function journeyGeometry(n: number) {
  // Stages + a two-column outcome fork, all standing on one floor line.
  const colW = 100 / (n + 1.95);
  // Pedestals sit on the floor along a gentle arc (mid stages slightly closer).
  const stages: Pt[] = Array.from({ length: n }, (_, i) => {
    const t = n > 1 ? i / (n - 1) : 0.5;
    return { x: colW * (i + 0.5), y: 80 + 4 * Math.sin(Math.PI * t) };
  });
  // Outcome fork on the floor: approved set back, rejected stepping forward.
  const approved: Pt = { x: 100 - colW * 1.27, y: 75 };
  const rejected: Pt = { x: 100 - colW * 0.43, y: 88 };
  const last = stages[n - 1];
  const branch: Pt = { x: last.x + (approved.x - last.x) * 0.55, y: last.y - 1 };
  return { colW, stages, approved, rejected, branch, pedW: colW * 0.66, outPedW: colW * 0.52 };
}

/** Phones / portrait: pedestals stacked in a left column, outcomes in a bottom row. */
export function journeyGeometryVertical(n: number) {
  const top = 13;
  const bottom = 79;
  const stages: Pt[] = Array.from({ length: n }, (_, i) => ({ x: 13, y: top + (n > 1 ? (i * (bottom - top)) / (n - 1) : 0) }));
  const approved: Pt = { x: 11, y: 96 };
  const rejected: Pt = { x: 61, y: 96 };
  const branch: Pt = { x: 13, y: 88 };
  return { colW: 26, stages, approved, rejected, branch, pedW: 14, outPedW: 9.5 };
}
