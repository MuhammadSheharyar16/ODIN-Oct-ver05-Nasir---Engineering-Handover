import { create } from 'zustand';
import { computeHomeLayout, type HomeLayout } from '../lib/homeLayout';

/** Current adaptive layout, shared by the DOM overlay and the WebGL stage. */
export const useLayout = create<{ home: HomeLayout }>(() => ({
  home: computeHomeLayout(window.innerWidth, window.innerHeight),
}));

let raf = 0;
window.addEventListener('resize', () => {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    useLayout.setState({ home: computeHomeLayout(window.innerWidth, window.innerHeight) });
  });
});
