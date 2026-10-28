import { useState } from 'react';
import REPORT from '../../data/thesis-report.json';

// Median distance to the nearest canal: hotspots vs random burnable-peat points, by peat depth class (log scale).
const R = REPORT.canal_by_depth;
const W = 760, PL = 108, PR = 70, PT = 30, ROW = 44;
const H = PT + R.length * ROW + 34;
const lo = 80, hi = 2400;
const x = (v) => PL + ((Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * (W - PL - PR);
const ticks = [100, 200, 500, 1000, 2000];

export default function CanalDistanceChart({ caption }) {
  const [hov, setHov] = useState(null);
  const d = hov != null ? R[hov] : null;
  const sig = (p) => (p < 0.001 ? '***' : p < 0.01 ? '**' : p < 0.05 ? '*' : 'n.s.');
  return (
    <figure className="pp-fig">
      <svg viewBox={`0 0 ${W} ${H}`} className="th-svg" role="img" aria-label="Median distance to the nearest canal for hotspots and random points, by peat depth">
        {ticks.map((t) => (
          <g key={t}><line x1={x(t)} x2={x(t)} y1={PT - 6} y2={H - 28} stroke="rgb(var(--ink-rgb) / .08)" /><text className="th-ax" x={x(t)} y={H - 12} textAnchor="middle">{t >= 1000 ? t / 1000 + ' km' : t + ' m'}</text></g>
        ))}
        <text className="th-ax" x={PL} y={14} fill="var(--teal)">● hotspots (median)</text>
        <text className="th-ax" x={PL + 150} y={14} fill="var(--text-muted)">○ random burnable-peat points (median)</text>
        {R.map((r, i) => {
          const cy = PT + i * ROW + ROW / 2;
          const a = x(r.median_hotspot_distance_m), b = x(r.median_null_distance_m);
          const closer = r.median_hotspot_distance_m < r.median_null_distance_m;
          return (
            <g key={r.depth_class} tabIndex={0} role="button" aria-label={`${r.depth_class}`} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} onFocus={() => setHov(i)} onBlur={() => setHov(null)}>
              <rect x={0} y={cy - ROW / 2} width={W} height={ROW} fill={hov === i ? 'rgb(var(--ink-rgb) / .04)' : 'transparent'} />
              <text className="th-lab-s" x={PL - 12} y={cy + 4} textAnchor="end">{r.depth_class}</text>
              <line x1={a} x2={b} y1={cy} y2={cy} stroke={closer ? 'var(--c-teal)' : 'var(--c-coral)'} strokeWidth="2.5" opacity=".7" />
              <circle cx={b} cy={cy} r="6" fill="none" stroke="var(--text-muted)" strokeWidth="2" />
              <circle cx={a} cy={cy} r="6.5" fill="var(--c-teal)" />
              <text className="th-val" x={W - PR + 10} y={cy + 4}>{sig(r.p_bh_adjusted)}</text>
            </g>
          );
        })}
      </svg>
      <p className="th-readout" aria-live="polite">
        {d ? <><b>{d.depth_class}</b>: hotspots {Math.round(d.median_hotspot_distance_m)} m vs {Math.round(d.median_null_distance_m)} m for random points (n = {d.n_hotspots} and {d.n_null_points.toLocaleString('en-US')}). P(hotspot closer) = {d.prob_hotspot_closer_than_null.toFixed(3)}; BH-adjusted p = {d.p_bh_adjusted < 0.001 ? '<0.001' : d.p_bh_adjusted.toFixed(3)}.</>
          : 'Hover a row. Stars mark Benjamini–Hochberg-adjusted Mann–Whitney tests (* p < 0.05, ** p < 0.01, *** p < 0.001; n.s. = not significant).'}
      </p>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
