import { useState } from 'react';
import { TIER2, T_LIST } from './data.js';

const PRE = { kering_tahun_lalu: 'Dry season of the year before', basah_sama_tahun: 'Wet season of the same year' };

export default function LiftExplorer() {
  const [yr, setYr] = useState(2019);
  const [buf, setBuf] = useState(1000);
  const [pre, setPre] = useState('kering_tahun_lalu');
  const key = (i) => `${yr}|${pre}|${i}`;
  const d = (i) => TIER2[buf === 500 ? 'd500' : 'd1000'][key(i)];
  const l = (i) => TIER2[buf === 500 ? 'l500' : 'l1000'][key(i)];
  const ha = (i) => TIER2.ha[key(i)];
  const W = 720, H = 280, L = 40, R = 10, T = 14, B = 30, gw = (W - L - R) / 4;
  const y = (v) => T + (H - T - B) * (1 - Math.max(v, 0) / 0.8);
  const col = { ATBI: '#1cc8aa', NBR: '#f0bc2e' };
  return (
    <figure className="pp-fig pp-wide">
      <div className="pp-controls">
        <div className="pp-chips" role="group" aria-label="Year">{[2015, 2019, 2023].map((v) => <button key={v} type="button" aria-pressed={yr === v} onClick={() => setYr(v)}>{v}</button>)}</div>
        <div className="pp-seg" role="group" aria-label="Buffer radius">{[500, 1000].map((v) => <button key={v} type="button" aria-pressed={buf === v} onClick={() => setBuf(v)}>{v} m buffer</button>)}</div>
        <div className="pp-seg" role="group" aria-label="Pre-fire reference window">{Object.entries(PRE).map(([k, v]) => <button key={k} type="button" aria-pressed={pre === k} onClick={() => setPre(k)}>{v}</button>)}</div>
      </div>
      <div className="pp-legend"><span><i style={{ background: col.ATBI }} />dATBI</span><span><i style={{ background: col.NBR }} />dNBR</span><span style={{ color: 'var(--text-dim)' }}>Bars: hit-rate at hotspots minus hit-rate at matched peat control points</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} className="th-svg" role="img" aria-label="Hit-rate difference between hotspots and control points for dATBI and dNBR at four thresholds">
        {[0, 0.2, 0.4, 0.6, 0.8].map((v) => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,.07)" /><text x={L - 6} y={y(v) + 4} textAnchor="end" className="th-ax">{v.toFixed(1)}</text></g>)}
        {T_LIST.map((t, g) => ['ATBI', 'NBR'].map((idx, j) => {
          const v = d(idx)[g], x = L + gw * g + gw * 0.17 + j * gw * 0.34;
          return <g key={idx + t}><rect x={x} y={y(v)} width={gw * 0.3} height={Math.max(1, H - B - y(v))} fill={col[idx]} fillOpacity=".85" />
            <text x={x + gw * 0.15} y={y(v) - 5} textAnchor="middle" className="th-val">{v.toFixed(2)}</text></g>;
        }))}
        {T_LIST.map((t, g) => <text key={t} x={L + gw * (g + 0.5)} y={H - 10} textAnchor="middle" className="th-ax">T = {t.toFixed(2)}</text>)}
      </svg>
      <div className="th-minitable" role="table" aria-label="Burned area and lift by threshold">
        <div role="row"><span role="columnheader">Threshold</span>{T_LIST.map((t) => <span role="columnheader" key={t}>{t.toFixed(2)}</span>)}</div>
        <div role="row"><span role="rowheader">dATBI burned ha</span>{ha('ATBI').map((v, i) => <span role="cell" key={i}>{v.toLocaleString('en-US')}</span>)}</div>
        <div role="row"><span role="rowheader">dNBR burned ha</span>{ha('NBR').map((v, i) => <span role="cell" key={i}>{v.toLocaleString('en-US')}</span>)}</div>
        <div role="row"><span role="rowheader">dATBI lift</span>{l('ATBI').map((v, i) => <span role="cell" key={i}>{v === null ? 'n/a' : v.toFixed(1) + '×'}</span>)}</div>
        <div role="row"><span role="rowheader">dNBR lift</span>{l('NBR').map((v, i) => <span role="cell" key={i}>{v === null ? 'n/a' : v.toFixed(1) + '×'}</span>)}</div>
      </div>
      <figcaption>Burned area is for the whole regency (peat covers about 511,000 ha). Lift is hit-rate at hotspots divided by hit-rate at control points; "n/a" means the control points had a hit-rate of zero. Valid-only subset: points with a usable pre-fire composite and enough post-fire scenes.</figcaption>
    </figure>
  );
}
