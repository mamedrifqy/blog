import data from '../../data/bengkalis-paper.json';
export const D = data;
export const PH = { 'La Niña': '#4f9be8', Neutral: '#6c7480', 'El Niño': '#e8533a' };
export const PHK = { L: 'La Niña', N: 'Neutral', E: 'El Niño' };
export const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthLabel = (m) => { const [y, mm] = m.split('-'); return MN[+mm - 1] + ' ' + y; };
export const sig = (p) => (p < 0.001 ? '***' : p < 0.01 ? '**' : p < 0.05 ? '*' : 'n.s.');
export const sgn = (v, d = 2) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d);
export const fmt = (n) => n.toLocaleString('en-US');
