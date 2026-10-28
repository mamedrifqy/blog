import { useState } from 'react';
import { D } from './data.js';

export default function AnnualBars() {
  const [h, setH] = useState(null);
  const yrs = D.years, mx = Math.max(...yrs.map((y) => y.total));
  const W = 720, Ht = 250, L = 40, R = 10, T = 18, B = 30, bw = (W - L - R) / yrs.length;
  const y = (v) => T + (Ht - T - B) * (1 - v / 1400);
  const sel = h === null ? null : yrs[h];
  return (
    <figure className="pp-fig">
      <svg viewBox={`0 0 ${W} ${Ht}`} className="th-svg" role="img" aria-label="Filtered hotspots per year in Bengkalis, 2015 to 2024">
        {[0, 400, 800, 1200].map((v) => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="rgb(var(--ink-rgb) / .07)" /><text x={L - 6} y={y(v) + 4} textAnchor="end" className="th-ax">{v}</text></g>)}
        {yrs.map((r, i) => (
          <g key={r.year} tabIndex={0} onMouseEnter={() => setH(i)} onMouseLeave={() => setH(null)} onFocus={() => setH(i)} onBlur={() => setH(null)}>
            <rect x={L + bw * i + 8} y={y(r.total)} width={bw - 16} height={Ht - B - y(r.total)} fill="var(--c-coral)" fillOpacity={h === null || h === i ? 0.85 : 0.35} />
            <text x={L + bw * (i + 0.5)} y={Ht - 10} textAnchor="middle" className="th-ax">{r.year}</text>
            <text x={L + bw * (i + 0.5)} y={y(r.total) - 5} textAnchor="middle" className="th-val">{r.total}</text>
          </g>
        ))}
      </svg>
      <p className="th-readout" aria-live="polite">{sel ? `${sel.year}: ${sel.total.toLocaleString('en-US')} filtered hotspots (${Math.round((sel.total / yrs.reduce((a, b) => a + b.total, 0)) * 100)}% of the decade), ${sel.inPeat.toLocaleString('en-US')} on mapped peat` : 'Hover a bar.'}</p>
      <figcaption>Filtered hotspots per year, whole regency. The decade begins with its biggest year.</figcaption>
    </figure>
  );
}
