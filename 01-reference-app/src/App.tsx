import { useEffect } from 'react';
import { toggleBackdropBlur } from './lib/backdrop';
import { useCaption } from './state/caption';
import { useExperience } from './odin/experience';
import { Stage } from './scene/Stage';
import { Chrome } from './ui/Chrome';
import { HomeComposition } from './ui/home/HomeComposition';
import { InsightStrip } from './ui/hud/InsightStrip';
import { MicBar } from './ui/hud/MicBar';
import { SceneLayer } from './ui/scene/SceneLayer';
import { ask, speakCurrent } from './odin/director';
import { IntroDirector } from './ui/IntroDirector';
import { startHomeFeedSimulator } from './data/homeFeed';
import { odinAudio, startSpeechPreview, stopSpeech } from './audio/odinAudio';
import { setAuraTarget } from './lib/aura';
import { useLayout } from './state/layout';
import { composeHomeSummary } from './data/homeSummary';
import { OdinBridgeProvider } from './ui/bridge';
import { viewById } from './odin/views';
import { useHomeFeed } from './data/homeFeed';

const speakHome = () => startSpeechPreview(composeHomeSummary(useHomeFeed.getState()).spoken);

export default function App() {
  const previewing = useCaption((c) => c.speaking);
  const layout = useLayout((s) => s.home);
  const homeData = useHomeFeed();
  const homeCurrent = useExperience((s) => s.active === null);
  const homeVisible = useExperience((s) => s.active === null || s.leaving === null);

  // Review flag: ?speak starts the simulated ODIN voice preview after load.
  useEffect(() => {
    if (!new URLSearchParams(location.search).has('speak')) return;
    const id = window.setTimeout(() => {
      speakHome();
    }, 1500);
    return () => window.clearTimeout(id);
  }, []);

  // Review flags: ?q=<question> or ?view=<ID> (catalogue, e.g. V05) asks ODIN after load.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const v = params.get('view');
    const q = params.get('q') ?? (v ? viewById(v)?.question : undefined);
    if (!q) return;
    const id = window.setTimeout(() => ask(q), 1200);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    // ?still freezes the simulated live feed (stable frames for the acceptance tests).
    if (!new URLSearchParams(location.search).has('still')) startHomeFeedSimulator();
    // Dev affordances until the experience machine lands (Phase 3):
    // F = depth-of-field backdrop (exterior lens blur), G = full backdrop blur (interior + exterior, the previous style),
    // S = ODIN speaking preview (simulated audio),
    // W = move the speaking spectrum to the next object (shape-wrap review).
    let wrapIndex = 0;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input, textarea')) return;
      const k = e.key.toLowerCase();
      if (k === 'f') toggleBackdropBlur('dof');
      if (k === 'g') toggleBackdropBlur('full');
      if (k === 'w') {
        const { globe, capsules } = useLayout.getState().home;
        wrapIndex = (wrapIndex + 1) % 5;
        if (wrapIndex === 0) setAuraTarget({ x: globe.x, y: globe.y, hw: globe.r, hh: globe.r, radius: globe.r });
        else {
          const c = capsules[wrapIndex - 1];
          setAuraTarget({ x: c.x, y: c.y, hw: c.w / 2, hh: c.h / 2, radius: Math.min(c.w, c.h) / 2 });
        }
        if (!odinAudio.speaking) {
          speakHome();
        }
      }
      if (k === 's') {
        if (odinAudio.speaking) stopSpeech();
        else speakCurrent();
      }
      if (k === 'h') ask('home');
      if (k === 'b') ask('back');
      if (k === '/' || k === 'enter') {
        e.preventDefault();
        useExperience.setState({ composerOpen: true });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <main className="app">
      <Stage />
      <div className="ui-root">
        <OdinBridgeProvider value={{ ask, layout }}>
          <HomeComposition data={homeData} current={homeCurrent} visible={homeVisible} />
          <SceneLayer />
        </OdinBridgeProvider>
        <Chrome />
        <div className="hud-slot" data-intro="hud">
          <InsightStrip />
        </div>
        <div className="hud-slot" data-intro="hud">
          <MicBar />
        </div>
        {previewing && <div className="dev-note">Voice preview · simulated audio</div>}
      </div>
      <IntroDirector />
    </main>
  );
}
