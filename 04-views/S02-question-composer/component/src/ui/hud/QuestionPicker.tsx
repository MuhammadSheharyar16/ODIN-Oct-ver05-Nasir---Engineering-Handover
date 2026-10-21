import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { searchQuestions, STATUS_LABEL, type Question, type QScope } from '../../odin/questions';

type Props = {
  text: string;
  scope: QScope;
  setScope: (s: QScope) => void;
  hi: number;
  setHi: (i: number) => void;
  onPick: (q: Question) => void;
  style: CSSProperties;
  compact: boolean;
};

/**
 * Question picker over the composer: every business question in the scope
 * catalogue, grouped by category, filtered live by what is typed.
 * Test harness for the October scope — each row routes to its designed view.
 */
export function QuestionPicker({ text, scope, setScope, hi, setHi, onPick, style, compact }: Props) {
  const list = useMemo(() => searchQuestions(text, scope), [text, scope]);
  const body = useRef<HTMLDivElement>(null);

  // Keep the highlighted row in view for keyboard moves only; hovering while scrolling must not scroll.
  const byKey = useRef(false);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { byKey.current = e.key === 'ArrowDown' || e.key === 'ArrowUp'; };
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  }, []);
  useEffect(() => {
    if (!byKey.current) return;
    byKey.current = false;
    const row = body.current?.querySelector<HTMLElement>('.qp__row.is-hi');
    const box = body.current;
    if (!row || !box) return;
    // Scroll the list only (scrollIntoView would also scroll every scrollable ancestor).
    const top = row.offsetTop - box.offsetTop, bottom = top + row.offsetHeight;
    if (top < box.scrollTop) box.scrollTop = top - 8;
    else if (bottom > box.scrollTop + box.clientHeight) box.scrollTop = bottom - box.clientHeight + 8;
  }, [hi]);

  const groups: { cat: string; items: { q: Question; i: number }[] }[] = [];
  list.forEach((q, i) => {
    let g = groups.find((x) => x.cat === q.category);
    if (!g) groups.push((g = { cat: q.category, items: [] }));
    g.items.push({ q, i });
  });
  const nReq = searchQuestions(text, 'required').length;
  const nAll = searchQuestions(text, 'all').length;

  return (
    <div className={`qp${compact ? ' is-compact' : ''}`} style={style} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.preventDefault()}>
      <div className="qp__head">
        <div className="qp__tabs" role="tablist">
          <button type="button" role="tab" aria-selected={scope === 'required'} className={scope === 'required' ? 'is-on' : ''} onClick={() => setScope('required')}>
            October scope <b>{nReq}</b>
          </button>
          <button type="button" role="tab" aria-selected={scope === 'all'} className={scope === 'all' ? 'is-on' : ''} onClick={() => setScope('all')}>
            All questions <b>{nAll}</b>
          </button>
        </div>
        {!compact && (
          <div className="qp__legend">
            {(['Green', 'Validation', 'Amber', 'Red', 'Out'] as const).map((s) => (
              <span key={s} className={`qp__pill is-${s.toLowerCase()}`}>
                {STATUS_LABEL[s]}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="qp__body" ref={body}>
        {groups.length === 0 && <div className="qp__empty">No catalogue question matches — press Enter to ask ODIN anyway.</div>}
        {groups.map((g) => (
          <section key={g.cat} className="qp__group">
            <h3>{g.cat}</h3>
            {g.items.map(({ q, i }) => (
              <button
                key={q.id}
                type="button"
                className={`qp__row${i === hi ? ' is-hi' : ''}`}
                onMouseEnter={() => setHi(i)}
                onClick={() => onPick(q)}
              >
                <span className="qp__id">{q.id}</span>
                <span className="qp__q">
                  {q.q}
                  <em>{q.view}</em>
                </span>
                <span className={`qp__pill is-${q.status.toLowerCase()}`}>{compact ? q.status : STATUS_LABEL[q.status]}</span>
              </button>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
