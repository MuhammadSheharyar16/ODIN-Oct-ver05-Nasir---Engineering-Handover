import { useMemo, useRef, type CSSProperties } from 'react';
import { useExperience } from '../../odin/experience';
import { composeScene } from '../../odin/compose';
import type { ComponentSpec, SceneAnswer } from '../../odin/types';
import type { Box } from '../../lib/homeLayout';
import { OdinSpotProvider, useOdinLayout } from '../bridge';
import { BarsPanel, ComparePanel, FactsPanel, LegendPanel, MetricCard, NoticePanel, RankingPanel } from './components/Panels';
import { Journey } from './components/Journey';
import { DonutView } from './components/Donut';
import { TimeMatrix } from './components/TimeMatrix';
import { Board } from './components/Board';
import { Channels, Periods, Queue, Revenue } from './components/Jars';
import { RevenueCore } from './components/RevenueCore';
import { AppCore } from './components/AppCore';
import { Glance } from './components/Glance';
import { FloorBeam } from './FloorBeam';
import { Geo, JourneyOrbs, Ring } from './components/Showcase';
import { Tops } from './components/Tops';
import './scene.css';
import './v1.css';
import './glass.css';
import './cards.css';

function Component({ spec, box }: { spec: ComponentSpec; box: Box }) {
  switch (spec.kind) {
    case 'legend':
      return <LegendPanel spec={spec} />;
    case 'board':
      return <Board spec={spec} />;
    case 'metric':
      return <MetricCard spec={spec} />;
    case 'journey':
      return spec.variant === 'orbs' ? <JourneyOrbs spec={spec} box={box} /> : <Journey spec={spec} box={box} />;
    case 'timeMatrix':
      return <TimeMatrix spec={spec} box={box} />;
    case 'channels':
      return <Channels spec={spec} box={box} />;
    case 'periods':
      return <Periods spec={spec} box={box} />;
    case 'queue':
      return <Queue spec={spec} box={box} />;
    case 'revenue':
      return spec.breakdowns ? <RevenueCore spec={spec} box={box} /> : <Revenue spec={spec} box={box} />;
    case 'podiums':
      return <Tops spec={spec} box={box} />;
    case 'geo':
      return <Geo spec={spec} box={box} />;
    case 'ring':
      return <Ring spec={spec} box={box} />;
    case 'donut':
      return <DonutView spec={spec} box={box} />;
    case 'ranking':
      return <RankingPanel spec={spec} />;
    case 'compare':
      return <ComparePanel spec={spec} />;
    case 'bars':
      return <BarsPanel spec={spec} />;
    case 'facts':
      return <FactsPanel spec={spec} />;
    case 'notice':
      return <NoticePanel spec={spec} />;
    case 'appcore':
      return <AppCore spec={spec} box={box} />;
    case 'glance':
      return <Glance spec={spec} box={box} />;
  }
}

const accentOf = (spec: ComponentSpec) =>
  'accent' in spec ? spec.accent : spec.kind === 'donut' ? spec.segments[0]?.accent : spec.kind === 'compare' ? spec.sides[0].accent : '#7fb6ff';

function spotRule(id: string, spot: string) {
  const root = `.scene[data-scene="${CSS.escape(id)}"]`;
  const hit = `[data-spot-key="${CSS.escape(spot)}"]`;
  return `${root}:has(${hit}) [data-spot-key]:not(${hit}){opacity:.72;filter:saturate(.75);transition:opacity .6s ease,filter .6s ease}` +
    `${root} ${hit}{z-index:2;filter:var(--spot-glow);animation:spot-breathe 2.4s ease-in-out 1.1s 2}`;
}

function Scene({ answer, entering }: { answer: SceneAnswer; entering: boolean }) {
  const home = useOdinLayout();
  const layout = useMemo(() => composeScene(answer, home), [answer, home]);
  const placed = answer.components.filter((p) => layout.slots[p.spec.key]);
  // Composer spotlight: light the asked item, calm its siblings (screens mark items with data-spot-key).
  // Declarative so it survives re-renders; :has() keeps siblings untouched when nothing matches.
  const spotCss = answer.spot ? spotRule(answer.id, answer.spot) : null;
  const root = useRef<HTMLDivElement>(null);
  return (
    <OdinSpotProvider spot={answer.spot}>
    <div ref={root} className={`scene mode-${home.mode}${entering ? ' is-entering' : ''}`} data-scene={answer.id} {...(answer.depth ? { 'data-depth': answer.depth } : {})}>
      {spotCss && <style>{spotCss}</style>}
      {/* Light beam from the floor ring into the screen's central object (data-beam), where it fits. */}
      <FloorBeam root={root} />
      {layout.title && (
        <header
          className="scene__title"
          style={{ left: layout.title.x, top: layout.title.y, width: layout.title.w, height: layout.title.h } as CSSProperties}
        >
          <div className="scene__title-morph" data-morph={`title:${answer.id}`} data-accent="#9fd0ff">
            <h1>{answer.title}</h1>
            <p>{answer.subtitle}</p>
          </div>
        </header>
      )}
      {placed.map(({ spec }) => {
        const b = layout.slots[spec.key];
        return (
          <div key={spec.key} className={`scene-item kind-${spec.kind}`} style={{ left: b.x, top: b.y, width: b.w, height: b.h }}>
            <div
              className="scene-item__morph"
              data-morph={spec.key}
              data-accent={accentOf(spec)}
              {...(spec.key === answer.focusKey ? { 'data-focus': '' } : {})}
            >
              <Component spec={spec} box={b} />
            </div>
          </div>
        );
      })}
    </div>
    </OdinSpotProvider>
  );
}

/** Active scene (and the outgoing one while a morph runs). */
export function SceneLayer() {
  const active = useExperience((s) => s.active);
  const leaving = useExperience((s) => s.leaving);
  return (
    <div className="scene-layer">
      {leaving && leaving.id !== active?.id && <Scene key={leaving.id} answer={leaving} entering={false} />}
      {active && <Scene key={active.id} answer={active} entering={leaving !== undefined} />}
    </div>
  );
}
