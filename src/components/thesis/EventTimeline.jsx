import { useState } from 'react';
import { ST_EVENTS, D } from './data.js';
import { MN } from './util.js';

const PH = { 'La Niña': 'var(--c-blue)', Neutral: '#6c7480', 'El Niño': 'var(--c-coral)' };
const t = (s) => new Date(s + 'T00:00:00Z').getTime();

export default function EventTimeline() {
  const [sel, setSel] = useState(25);
  const t0 = t('2015-01-01'), t1 = t('2025-01-01');
  const W = 920, H = 300, L = 44, R = 16, T = 30, B = 34;
  const x = (ms) => L + ((ms - t0) / (t1 - t0)) * (W - L - R);
  const y = (n) => T + (H - T - B) * (1 - n / 130);
  const e = ST_EVENTS.find((v) => v.id === sel);
  const ms = D.months.map((m, i) => ({ m, ph: D.phase[i] }));
  const phaseName = (c) => (c === 'E' ? 'El Niño' : c === 'L' ? 'La Niña' : 'Neutral');
  return (
    <figure className="pp-fig pp-wide">
      <div className="pp-legend">{Object.entries(PH).map(([k, v]) => <span key={k}><i style={{ background: v, opacity: 0.55 }} />{k} months</span>)}<span><i className="pp-dot" style={{ background: 'var(--c-gold)' }} />Spatiotemporal fire event (bar: duration; height: hotspots)</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} className="th-svg" role="img" aria-label="Timeline of the ten largest fire events detected by ST-DBSCAN, on a background of ENSO phases">
        {ms.map(({ m, ph }) => {
          const [yy, mm] = m.split('-').map(Number); const a = Date.UTC(yy, mm - 1, 1), b = Date.UTC(yy, mm, 1);
          return <rect key={m} x={x(a)} y={T} width={Math.max(1, x(b) - x(a))} height={H - T - B} fill={PH[phaseName(ph)]} fillOpacity=".16" />;
        })}
        {[0, 40, 80, 120].map((v) => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="rgb(var(--ink-rgb) / .07)" /><text x={L - 6} y={y(v) + 4} textAnchor="end" className="th-ax">{v}</text></g>)}
        {Array.from({ length: 10 }, (_, i) => <text key={i} x={x(Date.UTC(2015 + i, 6, 1))} y={H - 12} textAnchor="middle" className="th-ax">{2015 + i}</text>)}
        {ST_EVENTS.map((v) => {
          const on = v.id === sel;
          return (
            <g key={v.id} tabIndex={0} role="button" aria-label={`Event ${v.id}, ${v.n} hotspots, ${v.start}`} onClick={() => setSel(v.id)} onKeyDown={(k) => (k.key === 'Enter' || k.key === ' ') && setSel(v.id)} style={{ cursor: 'pointer' }}>
              <rect x={x(t(v.start))} y={y(v.n)} width={Math.max(5, x(t(v.end)) - x(t(v.start)))} height={H - B - y(v.n)} fill="var(--c-gold)" fillOpacity={on ? 0.95 : 0.55} stroke={on ? 'var(--text-bright)' : 'none'} />
              <circle cx={x(t(v.start))} cy={y(v.n)} r={on ? 5 : 3.5} fill="var(--c-gold)" />
            </g>
          );
        })}
      </svg>
      <p className="th-readout" aria-live="polite"><b>Event {e.id}</b> · {e.start} → {e.end} · {e.days} days · {e.n} high-confidence hotspots · started in {MN[+e.start.slice(5, 7) - 1]} {e.start.slice(0, 4)}. Click another bar.</p>
      <figcaption>The ten largest of 136 events found by ST-DBSCAN (1.5 km, 30 days, at least 3 points) on the 2,292 high-confidence hotspots. Eight of the ten start between late January and the end of March, in the first dry peak of the year. Only two begin in June–July, in the main dry season.</figcaption>
    </figure>
  );
}
