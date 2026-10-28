/**
 * ODIN's floor circle (the ring the home globe stands on) is its own layer since 27 Oct
 * (Nasir: Interior-ODIN-without-floor-circle.png + Interior-Floor-Circle-only.png), so a screen
 * can lower it into the floor. Journey pages (V09, V39) show a flat floor: the director sets
 * `hidden` as soon as a journey starts opening (applyEnv), so the circle is gone before the journey
 * appears; it rises back on every other screen. While hidden, ODIN's voice lines on the floor
 * (SpectrumAura) take the home screen's strength, so the spectrum reads the same on every screen.
 */
export const floorRing = { hidden: false };
