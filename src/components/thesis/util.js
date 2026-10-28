// Sequential ramp from the theme's low colour to a chart colour. Returned as a CSS colour so it follows the light/dark theme
// without any JS (no re-render, no hydration mismatch) and also works inside linear-gradient().
export const LO = 'var(--ramp-lo)';
export const mix = (t, hi, lo = LO) => {
  const k = Math.max(0, Math.min(1, t));
  return `color-mix(in srgb, ${hi} ${(k * 100).toFixed(1)}%, ${lo})`;
};
export const TEAL = 'var(--c-teal)', CORAL = 'var(--c-coral)', GOLD = 'var(--c-gold)', BLUE = 'var(--c-blue)';
export const f2 = (v) => v.toFixed(2);
export const f3 = (v) => v.toFixed(3);
export const sg = (v, d = 2) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d);
export const pct = (v, d = 0) => (v * 100).toFixed(d) + '%';
export const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
