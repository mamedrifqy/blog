export const LO = [38, 44, 48];
export const mix = (t, hi, lo = LO) => {
  const k = Math.max(0, Math.min(1, t));
  return 'rgb(' + lo.map((c, i) => Math.round(c + (hi[i] - c) * k)).join(',') + ')';
};
export const TEAL = [28, 200, 170], CORAL = [232, 83, 58], GOLD = [240, 188, 46], BLUE = [79, 155, 232];
export const f2 = (v) => v.toFixed(2);
export const f3 = (v) => v.toFixed(3);
export const sg = (v, d = 2) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d);
export const pct = (v, d = 0) => (v * 100).toFixed(d) + '%';
export const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
