import data from '../../data/bengkalis-paper.json';
export const D = data;
// ENSO phase colours. PH is for DOM/SVG (CSS variables follow the theme); canvas charts take phaseColors(palette()).
export const PH = { 'La Niña': 'var(--c-blue)', Neutral: '#6c7480', 'El Niño': 'var(--c-coral)' };
export const phaseColors = (P) => ({ 'La Niña': P.cBlue, Neutral: P.grey, 'El Niño': P.cCoral });
export const PHK = { L: 'La Niña', N: 'Neutral', E: 'El Niño' };
export const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthLabel = (m) => { const [y, mm] = m.split('-'); return MN[+mm - 1] + ' ' + y; };
export const sig = (p) => (p < 0.001 ? '***' : p < 0.01 ? '**' : p < 0.05 ? '*' : 'n.s.');
export const sgn = (v, d = 2) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d);
export const fmt = (n) => n.toLocaleString('en-US');
