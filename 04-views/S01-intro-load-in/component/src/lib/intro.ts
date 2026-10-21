/**
 * Intro choreography values (0 → 1). Written by the GSAP intro timeline,
 * read every frame by WebGL layers. A plain mutable object on purpose:
 * it changes 60×/s and must not trigger React renders.
 */
export const intro = {
  /** Environment exposure/focus reveal. */
  env: 0,
  /** Light beam rising from the floor ring. */
  beam: 0,
  /** Globe particles converging into the sphere. */
  globe: 0,
  /** Energy tendrils and rays once the globe is formed. */
  energy: 0,
  /** Camera dolly into the room. */
  camera: 0,
};

export function skipIntro() {
  intro.env = 1;
  intro.beam = 1;
  intro.globe = 1;
  intro.energy = 1;
  intro.camera = 1;
}
