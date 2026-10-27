# E05 · Energy streams

**How it connects to your app.** Plain React + SVG. Pass `layout` (globe {x, y, r} and capsule boxes) and `accents` (one colour per card). Place it in a full-size layer under the cards.

**Libraries.** none beyond React

**Source** (in `source/`, same paths as the reference app): `src/ui/home/EnergyStreams.tsx`, `src/ui/home/home.css`

**What it is.** Light connecting each card to ODIN, plus ambient strands to the screen edges. Paths are recomputed every frame: strands breathe at idle and widen into waves while ODIN speaks (driven by ODIN's output level).

**Layers per link (back → front)**: wide bloom (stroke × 5, Gaussian blur 7·s, colour mixed 38% toward rgb(214,226,245)) → fine filament core (stroke × 0.55, gradient, intro draw-on) → drifting dust (dash 0.0015/0.028, 9 + (i mod 4)·2.5 s per loop) → comet tail (stroke × 2.2, dash 0.16, eased `cubic-bezier(.55,.05,.35,1)`) → white-hot comet head, travelling card → ODIN every 4.2 + (i mod 3)·1.1 s, offset −0.91 s per strand.

Opacity: glow (0.16 + energy·0.35)·base; dust 0.5·k; comets k, where k = ambient ? 0.35 + energy : 0.8 + energy·0.4.

**Reduced motion.** Dust, tail and head animations stop; strands stay static.

**Used by**: V01 Executive Home · V02 Applications in Processing · V05 Processing Time Matrix · online
