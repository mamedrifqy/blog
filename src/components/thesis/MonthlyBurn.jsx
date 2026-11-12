import { useState } from 'react';
import { MONTHLY } from './data.js';
import { MN } from './util.js';

export default function MonthlyBurn() {
  const [yr, setYr] = useState(2019);
  const [hov, setHov] = useState(null);
  const { mcd, hs } = MONTHLY[yr];
  const mM = Math.max(...mcd), hM = Math.max(...hs);
  const W = 720, H = 300, L = 14, R = 14, T = 20, B = 34, pw = (W - L - R) / 12;
  const y = (v, mx) => T + (H - T - B) * (1 - v / mx);
  const line = hs.map((v, i) => `${L + pw * (i + 0.5)},${y(v, hM)}`).join(' ');
  const h = hov ?? null;
  return (
    <figure className="pp-fig">
      <div className="pp-controls">
        <div className="pp-chips" role="group" aria-label="Year">{[2015, 2019, 2023].map((v) => <button key={v} type="button" aria-pressed={yr === v} onClick={() => setYr(v)}>{v}</button>)}</div>
      </div>
      <div className="pp-legend"><span><i style={{ background: '#e8533a' }} />MCD64A1 burned area (ha)</span><span><i className="pp-line" />DBSCAN hotspots (count)</span><span style={{ color: 'var(--text-dim)' }}>Each series is scaled to its own peak</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} className="th-svg" role="img" aria-label={`Monthly burned hectares and hotspot counts in ${yr}`}>
        {mcd.map((v, i) => (
          <g key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
            <rect x={L + pw * i + 4} y={T} width={pw - 8} height={H - T - B} fill="transparent" />
            <rect x={L + pw * i + 8} y={y(v, mM)} width={pw - 16} height={Math.max(0, H - B - y(v, mM))} fill="#e8533a" fillOpacity={h === null || h === i ? 0.85 : 0.35} />
            <text x={L + pw * (i + 0.5)} y={H - 14} textAnchor="middle" className="th-ax">{MN[i]}</text>
          </g>
        ))}
        <polyline points={line} fill="none" stroke="#f0bc2e" strokeWidth="2" />
        {hs.map((v, i) => <circle key={i} cx={L + pw * (i + 0.5)} cy={y(v, hM)} r={h === i ? 5 : 3} fill="#f0bc2e" />)}
        <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="rgba(255,255,255,.2)" />
      </svg>
      <p className="th-readout" aria-live="polite">{h === null ? `Peak month: burned area ${MN[mcd.indexOf(mM)]} (${mM.toLocaleString('en-US')} ha), hotspots ${MN[hs.indexOf(hM)]} (${hM}). Hover a month.` : `${MN[h]} ${yr}: ${mcd[h].toLocaleString('en-US')} ha burned · ${hs[h]} hotspots`}</p>
      <figcaption>Whole regency. The two series rise and fall together, but not in lockstep: in 2019 the burned-area peak is February (6,627 ha) while hotspots peak in March (249), and September 2019 still shows 134 hotspots against 688 ha.</figcaption>
    </figure>
  );
}
