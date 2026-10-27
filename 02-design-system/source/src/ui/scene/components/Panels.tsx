import { Count } from './shared';
import type { CSSProperties } from 'react';
import type { BarsSpec, LegendSpec, MetricSpec, NoticeSpec, RankingSpec, ValueFormat } from '../../../odin/types';
import { formatCount, formatValue } from '../../../lib/format';
import { ChevronRight } from 'lucide-react';
import { SceneIcon } from '../SceneIcon';
import { useOdinAsk } from '../../bridge';
import { HERO_GLASS, HeroChart, HeroGlassFx } from '../HeroGlass';

const accent = (c: string) => ({ '--accent': c }) as CSSProperties;

function Value({ v, format, className }: { v: number | null; format: ValueFormat; className?: string }) {
  return (
    <span className={className}>
      {v === null ? formatValue(v, format) : <Count v={v} fmt={(n) => formatValue(n, format)} />}
      {format === 'days' && v !== null && <span className="unit"> days</span>}
    </span>
  );
}

export function MetricCard({ spec }: { spec: MetricSpec }) {
  if (spec.tile || (spec.card === 'hero' && HERO_GLASS)) return <MetricTile spec={spec} />;
  const d = spec.delta;
  let tone = 'flat';
  if (d && d.value !== 0) {
    const up = d.value > 0;
    tone = d.goodWhen === 'down' ? (up ? 'warn' : 'good') : up ? 'good' : 'warn';
  }
  const dText = d
    ? `${d.value > 0 ? '+' : d.value < 0 ? '−' : '±'}${Math.abs(d.value).toFixed(d.unit === 'count' ? 0 : 1)}${d.unit === 'days' ? ' days' : d.unit === 'pp' ? ' pp' : d.unit === 'percent' ? '%' : ''}`
    : '';
  return (
    <div className={`glass metric${spec.hero ? ' is-hero' : ''}`} style={accent(spec.accent)} data-surface {...(spec.hero ? { 'data-aura': '' } : {})}>
      <div className="metric__icon">
        <SceneIcon name={spec.icon} />
      </div>
      <div className="metric__body">
        <div className="metric__label">{spec.label}</div>
        {spec.value === null ? (
          <div className="metric__na">Not available</div>
        ) : (
          <Value className="metric__value" v={spec.value} format={spec.format} />
        )}
        {d && (
          <div className={`metric__delta is-${tone}`}>
            <span aria-hidden>{d.value > 0 ? '▲' : d.value < 0 ? '▼' : '•'}</span> {dText} <span className="metric__basis">{d.basis}</span>
          </div>
        )}
        {spec.caption && <div className="metric__caption">{spec.caption}</div>}
      </div>
      {spec.spark && <Spark kind={spec.spark.kind} values={spec.spark.values} />}
    </div>
  );
}

/** Mini chart inside a metric card. */
function Spark({ kind, values }: { kind: 'bars' | 'line'; values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (kind === 'bars') {
    return (
      <div className="spark spark--bars" aria-hidden>
        {values.map((v, i) => (
          <span key={i} style={{ height: `${18 + (v / max) * 82}%`, '--i': i } as CSSProperties} />
        ))}
      </div>
    );
  }
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${88 - ((v - min) / Math.max(0.001, max - min)) * 72}`);
  return (
    <svg className="spark spark--line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3ed6a0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#3ed6a0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${pts.join(' ')} 100,100`} fill="url(#spark-fill)" />
      <polyline points={pts.join(' ')} fill="none" stroke="#5ff0b9" strokeWidth="3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function RankingPanel({ spec }: { spec: RankingSpec }) {
  const max = Math.max(...spec.items.map((i) => i.value), 1);
  return (
    <div className="glass ranking" style={accent(spec.accent)} data-surface>
      <header className="panel__head">
        <SceneIcon name="ranking" className="panel__icon" />
        <div>
          <div className="panel__title">{spec.title}</div>
          <div className="panel__basis">{spec.basis}</div>
        </div>
      </header>
      <ol className="ranking__list">
        {spec.items.map((it, i) => (
          <li key={it.key} className={`ranking__row${i === spec.highlight ? ' is-highlight' : ''}`} style={{ '--i': i } as CSSProperties}>
            <span className="ranking__rank">{i + 1}</span>
            {it.code && <span className="ranking__code">{it.code}</span>}
            <span className="ranking__label">
              {it.label}
              {it.sub && <span className="ranking__sub">{it.sub}</span>}
            </span>
            <span className="ranking__bar">
              <span style={{ width: `${(it.value / max) * 100}%` }} />
            </span>
            <Value className="ranking__value" v={it.value} format={spec.format} />
          </li>
        ))}
      </ol>
    </div>
  );
}


export function BarsPanel({ spec }: { spec: BarsSpec }) {
  const max = Math.max(...spec.items.map((i) => i.value), 0.0001);
  return (
    <div className="glass bars" style={accent(spec.accent)} data-surface>
      <header className="panel__head">
        <SceneIcon name="clock" className="panel__icon" />
        <div>
          <div className="panel__title">{spec.title}</div>
          <div className="panel__basis">{spec.basis}</div>
        </div>
      </header>
      <ul className="bars__list">
        {spec.items.map((it, i) => (
          <li key={it.key} className="bars__row" style={{ '--i': i } as CSSProperties}>
            <span className="bars__label">{it.label}</span>
            <span className="bars__track">
              <span style={{ width: `${(it.value / max) * 100}%` }} />
            </span>
            <Value className="bars__value" v={it.value} format={spec.format} />
          </li>
        ))}
      </ul>
    </div>
  );
}


export function NoticePanel({ spec }: { spec: NoticeSpec }) {
  const ask = useOdinAsk();
  return (
    <div className="glass notice" data-surface>
      <SceneIcon name="info" className="notice__icon" />
      <div className="notice__title">{spec.title}</div>
      <p className="notice__text">{spec.text}</p>
      <div className="notice__chips">
        {spec.suggestions.map((s) => (
          <button key={s} type="button" className="chip" onClick={() => ask(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Tinted glass KPI tile: icon badge, white ink on accent-tinted navy glass, spark, chevron follow-up. */
function MetricTile({ spec }: { spec: MetricSpec }) {
  const ask = useOdinAsk();
  const d = spec.delta;
  const good = d ? (d.goodWhen === 'down' ? d.value < 0 : d.value > 0) : true;
  const dText = d ? `${d.value > 0 ? '+' : d.value < 0 ? '−' : '±'}${Math.abs(d.value).toFixed(d.unit === 'count' ? 0 : 1)}${d.unit === 'pp' ? ' pp' : d.unit === 'percent' ? '%' : d.unit === 'days' ? ' days' : ''}` : '';
  const hero = spec.card === 'hero' && HERO_GLASS;
  return (
    <div className={`tile${hero ? ' hglass' : ''}`} style={{ ...accent(spec.accent), '--hg-i': spec.key.length % 4 } as CSSProperties} data-surface>
      {hero && <HeroGlassFx />}
      <span className="tile__badge"><SceneIcon name={spec.icon} /></span>
      <div className="tile__body">
        <div className="tile__label">{spec.label}</div>
        {spec.value === null ? <div className="tile__na">Not available</div> : <Value className="tile__value" v={spec.value} format={spec.format} />}
        {d && (
          <div className={`tile__delta${d.goodWhen === 'none' ? ' is-flat' : good ? '' : ' is-warn'}`}>
            <span aria-hidden>{d.value > 0 ? '▲' : d.value < 0 ? '▼' : '•'}</span> {dText} <span className="tile__basis">{d.basis}</span>
          </div>
        )}
        {spec.caption && <div className="tile__caption">{spec.caption}</div>}
      </div>
      {spec.spark && (hero ? <HeroChart kind={spec.spark.kind} values={spec.spark.values} /> : <Spark kind={spec.spark.kind} values={spec.spark.values} />)}
      {spec.ask && (
        <button type="button" className="tile__go" aria-label={spec.ask} onClick={() => ask(spec.ask!)}>
          <ChevronRight />
        </button>
      )}
    </div>
  );
}

export function LegendPanel({ spec }: { spec: LegendSpec }) {
  const ask = useOdinAsk();
  return (
    <div className="legend2" data-surface>
      {spec.items.map((it, i) => {
        const body = (
          <>
            <span className="legend2__dot" />
            <span className="legend2__name">{it.label}</span>
            <b><Count v={it.count} fmt={formatCount} delay={650 + i * 90} /></b>
            <em>{(it.share * 100).toFixed(1)}%</em>
            {it.ask && <ChevronRight className="legend2__go" aria-hidden />}
          </>
        );
        const style = { '--accent': it.accent, '--spot': it.accent, '--i': i } as CSSProperties;
        return it.ask ? (
          <button key={it.key} type="button" className="legend2__item" data-spot-key={it.key} style={style} onClick={() => ask(it.ask!)} aria-label={`${it.label}: ${formatCount(it.count)}. ${it.ask}`}>{body}</button>
        ) : (
          <div key={it.key} className="legend2__item" data-spot-key={it.key} style={style}>{body}</div>
        );
      })}
    </div>
  );
}
