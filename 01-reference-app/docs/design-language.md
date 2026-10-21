# ODIN design language (ver05)

Source: design review, 20 Oct (standup + design discussion parts 1–3). The audit sheet of every screen is in `docs/audit/index.html`. To re-capture it, run `node scripts/dev-audit.mjs docs/audit` with the dev server running.

## 1 · ODIN is the spectrum
- ODIN shows up as its spectrum: the moving rings around what it is talking about, plus its globe on Home and in answers.
- While ODIN speaks, the spectrum wraps **only the focused card** (the asked item), keeping that card's shape (pill, card, sphere).
- With nothing asked, it wraps the whole composition.
- ODIN's globe carries the energy ribbons. No content sphere copies them.

## 1b · The room
- Behind every answer the room stays **sharp and at Home exposure**: no blur, no dimming (decided 21 Oct).
- Text that sits directly on the sky gets a feathered dark lens and a stronger halo instead.
- Blur is an option, not the default, and it's one function: `setBackdropBlur('dof' | 'full' | 'none')` in `src/lib/backdrop.ts`, or `backdrop` on a screen.
  - `dof` (depth of field) keeps the interior sharp and lightly softens the exterior.
  - `full` is the previous style: both layers blurred.
- Keyboard: **F** toggles depth of field, **G** toggles the full blur. URL: `?blur=dof`, `?blur=1`. Darkening stays off unless `?dim=1`.

## 2 · Sphere family (one family, variations by meaning)
Every content sphere is built from the same parts:

| Part | Rule |
|---|---|
| Shell | Clear glass: fresnel rim and one top specular. No thick outlines. The body is translucent (about 0.5–0.65 alpha with a 9px backdrop blur), so the room shows through. |
| Interior | Deep blue (`#03092a` → `#0b2675`). Never black, never flat. |
| Light | Particle lights inside (`Lights`). Their colour is the data's colour, and they fill about 85% of the interior. |
| Floor | A thin beam rises from the floor ring and stops at the sphere's bottom. Side rays are thin and straight. |
| Ring | Only when the sphere shows a split (status ring, segments). The ring sits outside the shell. |
| Number | Inside, white, AA on the interior. Long values scale down to stay inside. |

Variations by meaning (not by taste):
- **Applications**: blue lights; status ring when split (V02, V29).
- **Outcomes**: galaxy arms sized by share, anticlockwise (V27). Closure rate: segmented ring (V04).
- **Revenue**: gold lights (V08, V28).
- **Time**: progress ring around the days (V05, V06).
- **Geography**: the Earth (V17).
- **The answer (V30)**: the Applications v2 sphere. Its lights are status-coloured applications; they turn gold for revenue and take the time palette for durations. Home keeps ODIN's own globe.

Never place two content spheres on one screen.

## 3 · Card family (matches Home)
| Role | Use | Look |
|---|---|---|
| A · Capsule | KPIs around a sphere (Home, V02) | Pill, dark blue glass, accent rim, icon chip, value 2–3× label |
| B · Tile | Grids and rows of metrics (V04 corners, compare rows) | Rounded rectangle, same glass, same ink |
| C · Hero glass | The asked or leading card (answers, leaderboards, outcome cards, period jars, top-10 cards) | Brighter rim, sheen, accent bloom; navy fill about 0.46–0.64 (a step darker on leaderboards) for AA on the undimmed room |

- Ink is white on dark glass: labels ≥ 0.9 alpha, captions ≥ 0.88. Deltas always carry ▲/▼.
- No light (white) cards. ver05 moves the centre-visit journey cards to dark glass.
- No truncated labels. Shorten the words (CARD_LABEL) before the font shrinks.
- Card size follows Home's capsules. Cards never dominate the sphere.

## 4 · Tone (ODIN speaks to His Excellency)
- Courteous, calm and brief. Offer, don't instruct: "The figure you asked for · the full picture is available whenever you wish", not "Just what you asked · say 'full picture'".
- Never abrupt or blaming: "I'm sorry, I don't have that information yet", not "I can't answer that" or "I didn't catch a question".
- While waiting, thank him for his patience. When retrying, apologise ("My apologies… allow me to try once more").

## 5 · Answer-first composition
- The sphere always stands where Home's globe stands: above the floor ring on its beam and side rays. On tablet and phone, the cards move to a row under the title, so nothing sits between the sphere and the floor.
- While ODIN speaks, its spectrum circles the sphere. When ODIN reaches each added metric's sentence, the spectrum moves to that card.
- One metric: the answer sits in ODIN's globe with two facts.
- Two metrics: the second metric on the right, with the asked metric's own fact on the left, at the same size (balanced).
- Two or three metrics: cards beside the globe (right, then left), joined by Home's energy lines.
- Full picture: the screen. When the item is already on screen: highlight it in place. The asked card moves to the centre, the others step back about 25% smaller, and ODIN says only that item.

## 6 · Motion
- Answer states have named transitions T01–T06 (Grow, Regroup, Expand, Gather, Swap, Spotlight), and other screens use morphs M01–M06: `docs/transitions.md`. The answer sphere is the hinge.
- Morphs carry shared items (same key) from screen to screen. ODIN starts speaking as the new screen settles.
- The Journey v2 icon hops quickly (0.8 s). ODIN speaks only at the end stops.
- Waiting: check-ins at 10/15/20/30/45/60 s; numbers can load progressively (`docs/waiting-spec.md`).

## Audit · 20 Oct findings and fixes
| Screen | Finding | ver05 |
|---|---|---|
| V04 Outcome Distribution | Oversized boxes; 2×2 legend block; cluttered | Fixed: cards at capsule size; legend in one row of pills |
| V10 Centre Visit Journey | White cards look like another product | Fixed: dark hero glass, white ink |
| V19 Compare | Two empty tables | Fixed: duel rows on glass with split bars; the better value glows |
| V16 / V31 Top countries | Asked breakdown not obvious | Fixed: asked card to the centre with glow and spectrum |
| V30 Answer | New | Answer-first, 1–3 metrics |
| V22 / V23 | Single metrics now open the answer view (V30) | V23 stays the full page for a filtered time question ("How long for India?" → "full picture"); filtered counts open V29 |
| V12 Centre ranking, V20/V21 mixes | Plain list and flat donut (post-October, red) | Next: the same tile family and sphere rules when in scope |
