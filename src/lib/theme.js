// Theme helpers for client islands (charts, maps). Colours that can be plain CSS should stay CSS (var(--token));
// this file is for canvas / WebGL code that needs concrete colour strings, and for re-drawing when the theme flips.
import { useEffect, useState } from 'react';

export const getTheme = () =>
  (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'dark';

/** Current theme ('dark' | 'light'); re-renders the component when the reader toggles it. Put the result in an effect's deps to rebuild a chart or map. */
export function useTheme() {
  const [t, setT] = useState(getTheme);
  useEffect(() => {
    setT(getTheme());
    const h = (e) => setT(e.detail.theme);
    document.addEventListener('themechange', h);
    return () => document.removeEventListener('themechange', h);
  }, []);
  return t;
}

export const cssVar = (name) =>
  typeof document === 'undefined' ? '' : getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** 'rgba(...)' of the current "ink" colour (white on dark, warm near-black on light) at the given alpha. */
export function ink(alpha) {
  const rgb = (cssVar('--ink-rgb') || '255 255 255').split(/\s+/).join(',');
  return `rgba(${rgb},${alpha})`;
}

/** Concrete colours for Chart.js / canvas, read from the active theme. Call inside the effect, after the theme is set. */
export function palette() {
  const v = cssVar;
  return {
    theme: getTheme(),
    bg: v('--bg'), card: v('--bg-card'), text: v('--text'), muted: v('--text-muted'), dim: v('--text-dim'), bright: v('--text-bright'),
    teal: v('--teal'), coral: v('--coral'), gold: v('--gold'), onAccent: v('--on-accent'),
    cTeal: v('--c-teal'), cCoral: v('--c-coral'), cGold: v('--c-gold'), cBlue: v('--c-blue'), grey: '#6c7480',
    mapBg: v('--map-bg'), halo: v('--halo'), pop: v('--pop-bg'),
    grid: ink(0.06), gridMd: ink(0.12), line: ink(0.18), border: ink(0.1),
  };
}
