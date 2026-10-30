import { useEffect, useState, type CSSProperties } from 'react';
import { useArrived } from '../../odin/waiting';
import { useLayout } from '../../state/layout';
import { frameMapper } from '../../lib/homeLayout';
import { useCaption } from '../../state/caption';
import { useHomeSummary } from '../../data/homeSummary';
import { useExperience } from '../../odin/experience';
import { IconSpark } from '../icons';
import './hud.css';
import { requestFrame, cancelFrame } from '../../lib/ticker';

/** Index of the word being spoken now (-1 before start), from caption timing. */
function useSpokenIndex() {
  const { current, startedAt, speaking } = useCaption();
  const [index, setIndex] = useState(-1);
  useEffect(() => {
    if (!current) {
      setIndex(-1);
      return;
    }
    if (!speaking) {
      setIndex(current.words.length);
      return;
    }
    let raf = 0;
    const loop = () => {
      const t = performance.now() - startedAt;
      let i = -1;
      while (i + 1 < current.wordStarts.length && current.wordStarts[i + 1] <= t) i++;
      setIndex(i);
      raf = requestFrame(loop);
    };
    raf = requestFrame(loop);
    return () => cancelFrame(raf);
  }, [current, startedAt, speaking]);
  return index;
}

/**
 * ODIN summary strip = ODIN's words. Shows the sentence ODIN speaks (or would
 * speak) for the current view; while ODIN speaks, each word lights up as it
 * is said. No separate speaking indicator here — the spectrum is ODIN's voice.
 */
export function InsightStrip() {
  const homeStrip = useLayout((s) => s.home.strip);
  const mode = useLayout((s) => s.home.mode);
  const width = useLayout((s) => s.home.width);
  const height = useLayout((s) => s.home.height);
  const floorTop = useExperience((s) => s.active?.env === 'floor') && mode === 'wide';
  // Floor scenes use the floor; ODIN's words move up under the title.
  const box = floorTop ? { ...frameMapper(width, height).box(960, 178, 1060, 78), compact: false } : homeStrip;
  const homeSummary = useHomeSummary();
  const active = useExperience((s) => s.active);
  const summary = active
    ? { ...active.summary, compactPrimary: active.summary.primary, compactSecondary: active.summary.secondary }
    : homeSummary;
  const caption = useCaption((s) => s.current);
  const speaking = useCaption((s) => s.speaking);
  const spoken = useSpokenIndex();

  const style = { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` } as CSSProperties;

  const arrived = useArrived(400);
  let body;
  if (!arrived && !(caption && speaking)) {
    body = <p className="insight-strip__primary">Bringing in the figures <span className="odin-loading" aria-hidden><i /><i /><i /></span></p>;
  } else if (caption && speaking) {
    const words = caption.words;
    // Phones: rolling window that keeps the current word in view.
    const windowSize = box.compact ? (mode === 'short' ? 9 : 11) : words.length;
    const from = Math.max(0, Math.min(words.length - windowSize, spoken - Math.floor(windowSize * 0.6)));
    body = (
      <p className="insight-strip__caption" aria-live="polite">
        {from > 0 && <span className="caption-word is-spoken">… </span>}
        {words.slice(from, from + windowSize).map((w, k) => {
          const i = from + k;
          const state = i < spoken ? 'is-spoken' : i === spoken ? 'is-current' : 'is-pending';
          return (
            <span key={`${caption.id}-${i}`} className={`caption-word ${state}`}>
              {w}{' '}
            </span>
          );
        })}
      </p>
    );
  } else if (box.compact) {
    body = (
      <>
        <p className="insight-strip__primary">{summary.compactPrimary}</p>
        <p className="insight-strip__secondary">{summary.compactSecondary}</p>
      </>
    );
  } else {
    body = (
      <>
        <p className="insight-strip__primary">{summary.primary}</p>
        <p className="insight-strip__secondary">{summary.secondary}</p>
      </>
    );
  }

  return (
    <section className={`insight-strip mode-${mode}${box.compact ? ' is-compact' : ''}`} style={style} aria-label="ODIN">
      <div className="insight-strip__inner">
        <div className="insight-strip__tag">
          <IconSpark className="insight-strip__icon" />
          <span className="insight-strip__tag-text">ODIN Summary</span>
        </div>
        <div className="insight-strip__rule" />
        <div className="insight-strip__text">{body}</div>
      </div>
    </section>
  );
}
