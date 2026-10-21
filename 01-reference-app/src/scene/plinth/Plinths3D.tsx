import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { proxies } from '../../odin/fx';
import { PRESENCE_DEPTH, screenLengthToWorld, screenToWorld } from '../../lib/layout';
import { Pedestal, type Station } from '../journey/Journey3D';
import type { ObjectKind } from '../journey/objects';

/**
 * Generic chrome pedestals + glass objects that follow DOM anchors.
 * Any component can drop `<span data-plinth data-accent="#…" data-object="docStack" data-stack="0.6" />`
 * elements; their live rects drive pedestal position and size, so 3D always
 * matches the responsive DOM layout.
 */

type Anchor = { el: HTMLElement; st: Station };

function readAnchors(root: HTMLElement): Anchor[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-plinth]')).map((el, i) => ({
    el,
    st: {
      kind: (el.dataset.object as ObjectKind) ?? 'none',
      accent: el.dataset.accent ?? '#7fb6ff',
      x: 0,
      y: 0,
      r: 1,
      i,
      stack: el.dataset.stack ? parseFloat(el.dataset.stack) : undefined,
      objectScale: el.dataset.scale ? parseFloat(el.dataset.scale) : undefined,
      noBloom: el.dataset.nobloom !== undefined,
    },
  }));
}

function PlinthGroup({ id }: { id: string }) {
  const size = useThree((s) => s.size);
  const proxy = proxies.get(id)!;
  const [anchors, setAnchors] = useState<Anchor[]>(() => readAnchors(proxy.el));
  const wraps = useRef<(THREE.Group | null)[]>([]);
  const reveal = useRef<number[]>([]);
  const time = useRef(0);
  const frames = useRef(0);

  useFrame((_, dt) => {
    time.current += dt;
    if (++frames.current % 30 === 0) {
      const now = proxy.el.querySelectorAll('[data-plinth]').length;
      if (now !== anchors.length) setAnchors(readAnchors(proxy.el));
    }
    const morph = proxy.el.closest<HTMLElement>('[data-morph]');
    const op = morph ? parseFloat(morph.style.opacity || getComputedStyle(morph).opacity || '1') : 1;
    const n = anchors.length;
    anchors.forEach((a, i) => {
      const g = wraps.current[i];
      if (!g) return;
      const r = a.el.getBoundingClientRect();
      const [x, y, z] = screenToWorld(r.left + r.width / 2, r.top + r.height / 2, PRESENCE_DEPTH, size);
      g.position.set(x, y, z);
      g.scale.setScalar(Math.max(0.0001, screenLengthToWorld(r.width / 2, PRESENCE_DEPTH, size)));
      g.visible = r.width > 1;
      reveal.current[i] = Math.max(0, Math.min(1, op * 1.7 - (i / Math.max(1, n)) * 0.7));
    });
  });

  return (
    <>
      {anchors.map((a, i) => (
        <group
          key={`${a.st.kind}-${i}`}
          ref={(g) => {
            wraps.current[i] = g;
          }}
        >
          <Pedestal st={a.st} reveal={reveal} time={time} />
        </group>
      ))}
    </>
  );
}

export function PlinthObjects() {
  const sig = useRef('');
  const [, setTick] = useState(0);
  useFrame(() => {
    const v = [...proxies.entries()].filter(([, p]) => p.kind === 'plinths').map(([k]) => k).join('|');
    if (v !== sig.current) {
      sig.current = v;
      setTick((t) => t + 1);
    }
  });
  return (
    <>
      {[...proxies.entries()]
        .filter(([, p]) => p.kind === 'plinths')
        .map(([id]) => (
          <PlinthGroup key={id} id={id} />
        ))}
    </>
  );
}
