import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { Keyboard, ListChecks, Send, X } from 'lucide-react';
import { useStage } from '../../state/store';
import { useLayout } from '../../state/layout';
import { useExperience } from '../../odin/experience';
import { useWaiting } from '../../odin/waiting';
import { ask } from '../../odin/director';
import { searchQuestions, type QScope } from '../../odin/questions';
import { QuestionPicker } from './QuestionPicker';
import { IconMic } from '../icons';
import { requestFrame, cancelFrame } from '../../lib/ticker';

const BARS = 46;

/** User input pulses the user's waveform (typing stands in for the mic until voice is wired). */
function pulseInput(amount: number) {
  const st = useStage.getState();
  st.setMicLevel(Math.min(1, st.micLevel + amount));
}

/**
 * User input bar. Its waveform is driven ONLY by the user's input (mic level,
 * or keystrokes in the typed composer) — never by ODIN's voice.
 * Click/tap opens the composer: type a question, or pick a suggestion.
 */
export function MicBar() {
  const box = useLayout((s) => s.home.mic);
  const mode = useLayout((s) => s.home.mode);
  const phase = useExperience((s) => s.phase);
  const heard = useExperience((s) => s.heard);
  const note = useWaiting((s) => s.note);
  const open = useExperience((s) => s.composerOpen);
  const [text, setText] = useState('');
  const [scope, setScope] = useState<QScope>('required');
  const [hi, setHi] = useState(-1);
  const [list, setList] = useState(true);
  const input = useRef<HTMLInputElement>(null);
  const left = useRef<HTMLCanvasElement>(null);
  const right = useRef<HTMLCanvasElement>(null);

  const setOpen = (v: boolean) => useExperience.setState({ composerOpen: v });

  useEffect(() => {
    if (open) requestAnimationFrame(() => input.current?.focus());
  }, [open]);

  useEffect(() => {
    let raf = 0;
    let level = 0;
    const seeds = Array.from({ length: BARS }, (_, i) => 0.35 + 0.65 * Math.abs(Math.sin(i * 12.9898) * 0.5 + 0.5));
    const draw = (canvas: HTMLCanvasElement | null, mirror: boolean, t: number) => {
      if (!canvas || !canvas.clientWidth) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      const mid = h / 2;
      const gap = w / BARS;
      for (let i = 0; i < BARS; i++) {
        const k = mirror ? BARS - 1 - i : i;
        const centreBias = Math.pow(k / (BARS - 1), 1.6);
        const wobble = 0.55 + 0.45 * Math.sin(t * 0.012 + k * 0.9) * Math.sin(t * 0.007 + k * 2.1);
        const amp = level * seeds[k] * wobble * (0.25 + 0.75 * centreBias);
        const bh = Math.max(1.4 * dpr, amp * h * 0.9);
        const x = (mirror ? w - (i + 0.5) * gap : (i + 0.5) * gap) - dpr * 0.75;
        ctx.globalAlpha = 0.35 + 0.6 * Math.min(1, amp * 2 + centreBias * 0.4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, mid - bh / 2, 1.5 * dpr, bh);
      }
    };
    const loop = (t: number) => {
      const st = useStage.getState();
      level += (st.micLevel - level) * 0.25;
      // Input energy decays naturally.
      if (st.micLevel > 0.001) st.setMicLevel(st.micLevel * 0.92);
      draw(left.current, false, t);
      draw(right.current, true, t);
      raf = requestFrame(loop);
    };
    raf = requestFrame(loop);
    return () => cancelFrame(raf);
  }, []);

  const submit = (q: string) => {
    if (!q.trim()) return;
    pulseInput(0.9);
    ask(q);
    setText('');
    setOpen(false);
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(text);
  };

  const status =
    phase === 'thinking' || phase === 'morphing' || note ? (
      <span className="mic-bar__heard">
        “{heard}” <em>{note ?? (phase === 'thinking' ? 'Thinking…' : 'Preparing your answer…')}</em>
      </span>
    ) : (
      <span className="mic-bar__prompt">Ask ODIN anything…</span>
    );

  const compact = mode === 'compact' || mode === 'short';
  const matches = searchQuestions(text, scope);
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const pw = Math.min(vw - 24, compact ? vw - 24 : 860);
  const bottom = box.y - box.h / 2 - 14;
  const pickerStyle = { left: `${Math.min(Math.max(box.x, pw / 2 + 12), vw - pw / 2 - 12)}px`, top: `${bottom}px`, width: `${pw}px`, maxHeight: `${Math.max(180, bottom - (compact ? 70 : 110))}px` } as CSSProperties;

  return (
    <>
      {open && list && (
        <QuestionPicker
          text={text}
          scope={scope}
          setScope={(s) => {
            setScope(s);
            setHi(-1);
          }}
          hi={hi}
          setHi={setHi}
          onPick={(q) => submit(q.q)}
          style={pickerStyle}
          compact={compact}
        />
      )}
      <section
        className={`mic-bar${open ? ' is-open' : ''} phase-${phase}`}
        aria-label="Ask ODIN"
        style={{ left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` } as CSSProperties}
        onClick={() => !open && setOpen(true)}
      >
        <div className="mic-bar__inner">
          <button className="mic-bar__button" type="button" aria-label="Talk to ODIN">
            <IconMic />
          </button>
          {open ? (
            <form className="mic-bar__form" onSubmit={onSubmit}>
              <Keyboard className="mic-bar__kbd" aria-hidden />
              <input
                ref={input}
                className="mic-bar__input"
                value={text}
                placeholder="Type a question for ODIN…"
                onChange={(e) => {
                  setText(e.target.value);
                  setHi(-1);
                  setList(true);
                  pulseInput(0.35);
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Escape') setOpen(false);
                  else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    setList(true);
                    const n = matches.length;
                    if (n) setHi(e.key === 'ArrowDown' ? (hi + 1) % n : (hi - 1 + n) % n);
                  } else if (e.key === 'Enter' && list && hi >= 0 && matches[hi]) {
                    e.preventDefault();
                    submit(matches[hi].q);
                  }
                }}
                aria-label="Question for ODIN"
              />
              <button
                type="button"
                className={`mic-bar__list${list ? ' is-on' : ''}`}
                aria-label="All questions"
                aria-pressed={list}
                onClick={(e) => {
                  e.stopPropagation();
                  setList(!list);
                }}
              >
                <ListChecks />
              </button>
              <button type="submit" className="mic-bar__send" aria-label="Ask">
                <Send />
              </button>
              <button
                type="button"
                className="mic-bar__close"
                aria-label="Close"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
              >
                <X />
              </button>
            </form>
          ) : (
            <>
              <canvas className="mic-bar__wave" ref={left} />
              {status}
              <canvas className="mic-bar__wave" ref={right} />
            </>
          )}
        </div>
      </section>
    </>
  );
}
