import type { ReactNode } from 'react';
import { ArrowRight, BarChart3, Clock, Rocket, TriangleAlert, Users, Zap } from 'lucide-react';
import type { TimeMatrixSpec } from '../../../odin/types';
import type { Box } from '../../../lib/homeLayout';
import { SceneIcon } from '../SceneIcon';
import { Bars, Count, DeltaTag, css } from './shared';
import { useOdinAsk, useOdinLayout } from '../../bridge';
import { TimeMatrixWide } from './TimeMatrixWide';

const d1 = (n: number) => n.toFixed(1);

/** Design: "Online Visa Processing time Matrix". */
export function TimeMatrix({ spec, box }: { spec: TimeMatrixSpec; box: Box }) {
  const mode = useOdinLayout().mode;
  if (mode === 'wide') return <TimeMatrixWide spec={spec} />;
  return <TimeMatrixCompact spec={spec} box={box} />;
}

function TimeMatrixCompact({ spec, box }: { spec: TimeMatrixSpec; box: Box }) {
  const ask = useOdinAsk();
  const narrow = box.w / box.h < 1.2;
  const gauge = Math.min(1, spec.avg / Math.max(spec.p90, 0.1));
  const Card = ({ icon, label, accent, children, side }: { icon: ReactNode; label: string; accent: string; children: ReactNode; side: 'l' | 'r' }) => (
    <div className={`tm-card is-${side}`} style={css({ '--accent': accent })}>
      <span className="tm-card__icon">{icon}</span>
      <span className="tm-card__body">
        <span className="tm-card__label">{label}</span>
        {children}
      </span>
    </div>
  );
  const left = (
    <>
      <Card side="l" icon={<Clock />} label="Typical time" accent="#4f9cff">
        <span className="tm-card__value"><Count v={spec.median} fmt={d1} /> <small>days</small></span>
        <DeltaTag value={spec.medianDelta} basis="vs yesterday" goodWhen="down" />
      </Card>
      <Card side="l" icon={<Users />} label="Applications" accent="#5aa8ff">
        <span className="tm-card__row">
          <span className="tm-card__value"><Count v={spec.applications} /></span>
          <Bars values={spec.hourly} accent="#4f9cff" className="tm-card__bars" />
        </span>
        <span className="tm-card__note">{spec.scopeLabel}</span>
      </Card>
      <Card side="l" icon={<Rocket />} label="Quickest step" accent="#3ed6a0">
        <span className="tm-card__stage">{spec.fastest.label}</span>
        <span className="tm-card__value">{spec.fastest.days.toFixed(1)} <small>days</small></span>
      </Card>
    </>
  );
  const right = (
    <>
      <Card side="r" icon={<BarChart3 />} label="9 in 10 finish within" accent="#a67cff">
        <span className="tm-card__value"><Count v={spec.p90} fmt={d1} /> <small>days</small></span>
        <span className="tm-card__note">9 in 10 applications finish within this</span>
      </Card>
      <Card side="r" icon={<Zap />} label="On target" accent="#4fd6ff">
        <span className="tm-card__na">Not available</span>
        <span className="tm-card__note">Target not agreed yet</span>
      </Card>
      <Card side="r" icon={<TriangleAlert />} label="Slowest step" accent="#f5ac45">
        <span className="tm-card__stage">{spec.longest.label}</span>
        <span className="tm-card__value">{spec.longest.days.toFixed(1)} <small>days</small></span>
      </Card>
    </>
  );

  return (
    <div className={`tm${narrow ? ' is-narrow' : ''}`} data-surface>
      {!narrow && (
        <svg className="tm__links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {[14, 33, 52].map((y, i) => (
            <path key={`l${i}`} d={`M 25 ${y} C 33 ${y}, 36 ${(y + 33) / 2}, 41 33`} />
          ))}
          {[14, 33, 52].map((y, i) => (
            <path key={`r${i}`} d={`M 75 ${y} C 67 ${y}, 64 ${(y + 33) / 2}, 59 33`} />
          ))}
        </svg>
      )}
      <div className="tm__col is-left">{left}</div>
      <div className="tm__core" data-presence="0.38" data-aura="">
        <svg className="tm__gauge" viewBox="0 0 100 100" aria-hidden>
          <defs>
            <linearGradient id="tmg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#4fd6ff" />
              <stop offset="0.6" stopColor="#8b6cff" />
              <stop offset="1" stopColor="#ff8fd2" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="46" className="tm__gauge-track" />
          <circle cx="50" cy="50" r="46" className="tm__gauge-fill" pathLength={1} style={css({ '--p': gauge })} />
        </svg>
        <div className="tm__readout">
          <div className="tm__big">
            <Count v={spec.avg} fmt={d1} delay={650} /> <small>days</small>
          </div>
          <div className="tm__lbl">Average time from application to decision</div>
          <DeltaTag value={spec.avgDelta} unit="%" basis="vs yesterday" goodWhen="down" />
        </div>
      </div>
      <div className="tm__col is-right">{right}</div>

      <div className="tm__stages">
        <div className="tm__stages-head">
          <span>Average days at each step</span>
          <span className="tm__tabs">
            {spec.tabs.map((t) => (
              <button key={t.label} type="button" className={`tm__tab${t.active ? ' is-active' : ''}`} onClick={() => ask(t.ask)}>
                {t.label}
              </button>
            ))}
          </span>
        </div>
        <div className="tm__strip">
          {spec.stages.map((s, i) => (
            <div key={s.key} className="tm__strip-item">
              <div className={`tm__stage${spec.focusStage === s.key ? ' is-focus' : ''}`} style={css({ '--accent': s.accent, '--i': i })}>
                <span className="tm__stage-icon">
                  <SceneIcon name={s.icon} />
                </span>
                <span className="tm__stage-body">
                  <span className="tm__stage-label">{s.label}</span>
                  <span className="tm__stage-days">{s.days.toFixed(1)} d</span>
                </span>
              </div>
              {i < spec.stages.length - 1 && <ArrowRight className="tm__arrow" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
