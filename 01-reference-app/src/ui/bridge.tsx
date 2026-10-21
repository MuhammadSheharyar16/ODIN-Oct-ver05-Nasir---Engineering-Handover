import { createContext, useContext, type ReactNode } from 'react';
import { computeHomeLayout, type HomeLayout } from '../lib/homeLayout';

/**
 * The only connection between ODIN screens and the app around them.
 * Screens render from their spec (props) and read three things from here:
 *  - ask(question): a follow-up from a chevron, tab or chip. Host apps route it to their own Q&A.
 *  - layout: the adaptive viewport layout (computeHomeLayout(width, height)).
 *  - spot (per scene): the item the question asked about, from the response composer.
 *    Screens mark items with data-spot-key; the host highlights the match.
 * Screens never import the director, stores or mock data, so they can be lifted one by one.
 */
export type OdinBridge = {
  ask: (question: string) => void;
  layout: HomeLayout;
};

const fallback: OdinBridge = {
  ask: (q) => console.warn('[ODIN] No OdinBridgeProvider: follow-up not routed:', q),
  layout: computeHomeLayout(1920, 1080),
};

const BridgeContext = createContext<OdinBridge>(fallback);

export function OdinBridgeProvider({ value, children }: { value: OdinBridge; children: ReactNode }) {
  return <BridgeContext.Provider value={value}>{children}</BridgeContext.Provider>;
}

export const useOdinAsk = () => useContext(BridgeContext).ask;
export const useOdinLayout = () => useContext(BridgeContext).layout;

const SpotContext = createContext<string | undefined>(undefined);

/** Per scene: the composer's spotlight item (e.g. 'processing', 'rejected', 'res'). */
export function OdinSpotProvider({ spot, children }: { spot?: string; children: ReactNode }) {
  return <SpotContext.Provider value={spot}>{children}</SpotContext.Provider>;
}

export const useOdinSpot = () => useContext(SpotContext);
