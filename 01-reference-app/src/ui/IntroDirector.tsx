import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useStage } from '../state/store';
import { intro, skipIntro } from '../lib/intro';
import { prefersReducedMotion } from '../lib/motion';
import { releaseFigures } from './NumberRoll';
import { playIntro } from '../audio/morphSfx';
import './intro.css';

/**
 * Loader + load-in choreography (inspired by "1-home first scene"):
 * light floods the room as the camera eases in, the beam rises from the
 * floor ring, particles converge into ODIN, capsules materialise, energy
 * draws on, figures count up, the HUD settles. Skippable with ?nointro.
 */
export function IntroDirector() {
  const envReady = useStage((s) => s.envReady);
  const loader = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!envReady || started.current) return;
    started.current = true;
    // ODIN first appears: interface pulse (deferred to the first gesture if the browser blocks audio).
    playIntro();
    const root = document.documentElement;
    const skip = prefersReducedMotion() || new URLSearchParams(location.search).has('nointro');

    const reveal = () => {
      root.classList.remove('intro-pending');
      releaseFigures();
    };

    if (skip) {
      skipIntro();
      reveal();
      if (loader.current) loader.current.style.display = 'none';
      return;
    }

    const q = (sel: string) => Array.from(document.querySelectorAll<HTMLElement>(sel));
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to(loader.current, { autoAlpha: 0, duration: 0.7, ease: 'power2.inOut', onComplete: () => { if (loader.current) loader.current.style.display = 'none'; } }, 0)
      .to(intro, { env: 1, duration: 2.1, ease: 'power2.out' }, 0)
      .to(intro, { camera: 1, duration: 2.8, ease: 'power3.out' }, 0)
      .to(intro, { beam: 1, duration: 1.1, ease: 'power2.inOut' }, 0.5)
      .to(intro, { globe: 1, duration: 1.9, ease: 'expo.out' }, 0.85)
      .add(() => root.classList.remove('intro-pending'), 1.2)
      .fromTo(q('[data-intro="chrome"]'), { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 0.9, clearProps: 'transform' }, 1.2)
      .fromTo(
        q('[data-intro="capsule"]'),
        { autoAlpha: 0, scale: 0.8, filter: 'blur(12px)' },
        { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 1.0, stagger: 0.12, clearProps: 'transform,filter' },
        1.6,
      )
      .to(intro, { energy: 1, duration: 1.5, ease: 'power2.out' }, 1.85)
      .fromTo(
        q('[data-intro="readout"]'),
        { autoAlpha: 0, scale: 0.88 },
        { autoAlpha: 1, scale: 1, duration: 0.9, clearProps: 'scale' },
        1.95,
      )
      .add(() => releaseFigures(), 2.0)
      .fromTo(q('[data-intro="hud"]'), { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.14, clearProps: 'y' }, 2.35);
    return () => {
      tl.kill();
    };
  }, [envReady]);

  return (
    <div className="loader" ref={loader} aria-hidden={envReady}>
      <svg className="loader__mark" viewBox="0 0 220 48" aria-label="ODIN" role="img">
        <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <circle cx="24" cy="24" r="20" />
          <path d="M74 4.5 A19.5 19.5 0 0 1 74 43.5" />
          <path d="M64 4.5 h10 M64 43.5 h10" />
          <path d="M130 4 V44" />
          <path d="M176 44 V4 L214 44 V4" strokeLinejoin="round" />
        </g>
      </svg>
      <div className="loader__line" />
      <div className="loader__text">Preparing your executive view</div>
    </div>
  );
}
