import type { CSSProperties, ReactNode } from 'react';
import type { FloorStageId } from '../floorJourney';
import type { SceneId } from './data';
import './story.css';

type P = { x: number; y: number };
type At = (s: SceneId, k: string) => P;

/**
 * Story animations (V33 after 27 Oct, V35): Anupam's 26 Oct review asked each stage to
 * tell what happens there, not only light up. Each beat acts out the stage
 * (typing the form, AED coins on payment, the reviewer's magnifier, the file flying
 * to ICP, the phone buzzing, the calendar booking, the fingerprint scan, the stamp,
 * the plane taking off, the dropped bag in the rain) with a short caption.
 * Sized in em (1em = 12 reference px × floor scale); plays only while its stage is active.
 * The layout supplies the anchors (`at`) and where the caption sits (`cap`).
 */
export const STORY_SAY: Record<FloorStageId, string> = {
  home: 'Filling in the application',
  sub: 'Application submitted',
  pay: 'Fee paid in AED',
  vas: 'VAS checks the documents',
  toicp: 'File sent to ICP',
  icp1: 'ICP reviews the file',
  bio1: 'Biometrics requested',
  bio2: 'Appointment booked',
  bio3: 'Fingerprints captured',
  icp2: 'Biometrics matched',
  dec: 'Decision stamped',
  ok: 'Approved · ready to travel',
  no: 'Application rejected',
};

export function StoryFx({ stage, tone, at, cap, reduced }: { stage: FloorStageId | 'wait'; tone: string; at: At; cap?: P; reduced: boolean }) {
  const pin = (p: P, node: ReactNode, extra?: CSSProperties, cls = '') => (
    <span className={`js js--${stage}${cls}${reduced ? ' is-still' : ''}`} style={{ left: p.x, top: p.y, '--c': tone, ...extra } as CSSProperties}>{node}</span>
  );
  const say = stage !== 'wait' && cap && (
    <span key="say" className={`js__say${reduced ? ' is-still' : ''}`} style={{ left: cap.x, top: cap.y, '--c': tone } as CSSProperties}>{STORY_SAY[stage]}</span>
  );
  let beat: ReactNode = null;
  switch (stage) {
    case 'home': // typing: the form fills line by line, then a tick
      beat = pin(at('home', 'laptop'), <><i className="js__glow" /><span className="js__form"><i className="js__fill" /><i className="js__fill" /><i className="js__fill" /><i className="js__caret" /><b className="js__tick">✓</b></span></>);
      break;
    case 'sub': // the application lifts off and uploads
      beat = pin(at('home', 'upload'), <><i className="js__glow" /><span className="js__doc"><Lines /></span><span className="js__bar"><i /></span><Up /></>);
      break;
    case 'pay': // tap to pay: AED coins spring out of the phone, receipt tick
      beat = pin(at('home', 'pay'), <><i className="js__ring" /><i className="js__ring" />{[-1.6, -0.5, 0.6, 1.7].map((d, i) => <b key={i} className="js__coin" style={{ '--dx': d, '--i': i } as CSSProperties}>AED</b>)}<b className="js__tick">✓</b></>);
      break;
    case 'wait': // the applicant waits: a ticking clock and dots
      beat = pin(at('home', 'wait'), <><span className="js__clock"><i /></span><span className="js__dots"><i /><i /><i /></span></>);
      break;
    case 'vas': // the reviewer's magnifier passes over the documents; checks tick in
      beat = pin(at('vas', 'desk'), <><i className="js__glow" /><span className="js__sheet"><Lines /></span><span className="js__lens" /><span className="js__list"><i /><i /><i /></span></>);
      break;
    case 'toicp': { // the file flies from VAS to ICP and lands
      const a = at('toicp', 'from'), b = at('toicp', 'to');
      beat = pin(a, <><i className="js__trail" /><span className="js__folder" /><i className="js__ring js__ring--land" /><b className="js__tick js__tick--land">✓</b></>, { '--dx': `${b.x - a.x}px`, '--dy': `${b.y - a.y}px` } as CSSProperties);
      break;
    }
    case 'icp1': // the officer's screen scans the file; the checklist ticks
      beat = <>{pin(at('icp1', 'screen'), <span className="js__screen"><i className="js__scan" /></span>)}{pin(at('icp1', 'list'), <span className="js__list"><i /><i /><i /></span>, undefined, ' js--list')}</>;
      break;
    case 'bio1': // the phone buzzes with ICP's biometric request
      beat = pin(at('bio1', 'phone'), <><i className="js__ring" /><i className="js__ring" /><span className="js__phone"><i /></span><span className="js__bubble"><Envelope /><b>1</b></span></>);
      break;
    case 'bio2': // the calendar books a slot
      beat = pin(at('bio2', 'calendar'), <><i className="js__glow" /><span className="js__cal"><i className="js__calhead" />{Array.from({ length: 12 }, (_, i) => <i key={i} className="js__day" />)}<i className="js__pick" /></span><b className="js__badge">Booked ✓</b></>);
      break;
    case 'bio3': // fingerprint scan with a sweeping beam
      beat = pin(at('bio3', 'scanner'), <><i className="js__glow" /><span className="js__print"><Print /><span className="js__printon"><Print /></span><i className="js__beam" /></span><i className="js__ring" /></>);
      break;
    case 'icp2': // the two prints slide together: match
      beat = pin(at('icp2', 'screen'), <><i className="js__glow" /><span className="js__half js__half--l"><Print /></span><span className="js__half js__half--r"><Print /></span><i className="js__flash" /><b className="js__badge">Match ✓</b></>);
      break;
    case 'dec': // the stamp slams down
      beat = pin(at('dec', 'desk'), <><span className="js__stamp"><i /><i /></span><i className="js__ink" /><i className="js__ring js__ring--ink" />{Array.from({ length: 6 }, (_, i) => <i key={i} className="js__dust" style={{ '--i': i } as CSSProperties} />)}</>);
      break;
    case 'ok': // a plane takes off with confetti
      beat = pin(at('ok', 'hero'), <><i className="js__glow" />{Array.from({ length: 12 }, (_, i) => <i key={i} className="js__conf" style={{ '--i': i } as CSSProperties} />)}<span className="js__fly"><i className="js__contrail" /><Plane /></span></>);
      break;
    case 'no': // the bag drops; a small rain cloud over it
      beat = pin(at('no', 'hero'), <><span className="js__cloud"><Cloud />{[0, 1, 2, 3].map((i) => <i key={i} className="js__drop" style={{ '--i': i } as CSSProperties} />)}</span><span className="js__bag"><Bag /></span></>);
      break;
  }
  return <>{beat}{say}</>;
}

const Lines = () => <svg viewBox="0 0 10 13" aria-hidden><path d="M2 4h6M2 6.5h5M2 9h3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>;
const Up = () => <svg className="js__up" viewBox="0 0 10 10" aria-hidden><path d="M5 8.5V1.8M2.2 4.4 5 1.6l2.8 2.8" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Envelope = () => <svg viewBox="0 0 16 12" aria-hidden><rect x=".8" y=".8" width="14.4" height="10.4" rx="1.8" fill="currentColor" /><path d="M1.6 2 8 7l6.4-5" stroke="#fff" strokeWidth="1.3" fill="none" strokeLinejoin="round" /></svg>;
const Print = () => (
  <svg viewBox="0 0 20 24" aria-hidden><g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <path d="M6 20c-1-4-1-10 4-10s5 6 4 10" /><path d="M3 16C2 9 5 4 10 4s8 5 7 12" /><path d="M8.5 21c-.6-3-.3-7 1.5-7s2.1 4 1.5 7" /><path d="M10 15.6V22" />
  </g></svg>
);
const Plane = () => <svg viewBox="0 0 24 24" aria-hidden><path d="M21.5 15.5v-2l-8-5V3.2a1.5 1.5 0 0 0-3 0V8.5l-8 5v2l8-2.5V19l-2.2 1.6V22l3.7-1 3.7 1v-1.4L13.5 19v-5.5z" fill="currentColor" /></svg>;
const Cloud = () => <svg viewBox="0 0 24 14" aria-hidden><path d="M6 13a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 16.8 3.4 4.8 4.8 0 1 1 18.5 13z" fill="currentColor" /></svg>;
const Bag = () => (
  <svg viewBox="0 0 20 18" aria-hidden><rect x="1.5" y="4.5" width="17" height="12" rx="2.4" fill="currentColor" /><path d="M7 4.5V2.8c0-.9.6-1.5 1.5-1.5h3c.9 0 1.5.6 1.5 1.5v1.7" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M1.5 9.5h17" stroke="rgba(0,0,0,.25)" strokeWidth="1.2" /></svg>
);
