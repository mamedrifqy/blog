import { useState } from 'react';
import REPORT from '../../data/thesis-report.json';
import { MN } from './util.js';

// Share of all hotspots by calendar month, with the two activation windows used in the preparedness calendar.
const S = REPORT.seasonal;
const W = 760, H = 260, PL = 40, PR = 10, PT = 34, PB = 30;
const IW = W - PL - PR, IH = H - PT - PB;
const max = 30;
const bw = IW / 12;
const y = (v) => PT + (1 - v / max) * IH;

export default function SeasonCalendar({ caption }) {
  const [hov, setHov] = useState(null);
  const d = hov != null ? S[hov] : null;
  const win = (m0, m1, label, i) => (
    <g key={label}>
      <rect x={PL + (m0 - 1) * bw} width={(m1 - m0 + 1) * bw} y={PT - 22} height={H - PT - PB + 22} fill="rgba(28,200,170,.07)" />
      <text className="th-ax" x={PL + ((m0 - 1) + (m1 - m0 + 1) / 2) * bw} y={PT - 8} textAnchor="middle" fill="#1cc8aa" fontWeight="700">{label}</text>
    </g>
  );
  const sum = (a, b) => S.filter((r) => r.month >= a && r.month <= b).reduce((t, r) => t + r.hotspot_share_pct, 0);
  return (
    <figure className="pp-fig">
      <svg viewBox={`0 0 ${W} ${H}`} className="th-svg" role="img" aria-label="Monthly share of hotspots in Bengkalis, 2015 to 2024">
        {win(2, 4, 'Window 1: Feb–Apr')}{win(7, 8, 'Window 2: Jul–Aug')}
        {[0, 10, 20, 30].map((v) => (
          <g key={v}><line x1={PL} x2={W - PR} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,.08)" /><text className="th-ax" x={PL - 7} y={y(v) + 4} textAnchor="end">{v}%</text></g>
        ))}
        {S.map((r, i) => (
          <g key={r.month} tabIndex={0} role="button" aria-label={`${MN[i]}: ${r.hotspot_share_pct}% of hotspots`} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} onFocus={() => setHov(i)} onBlur={() => setHov(null)}>
            <rect x={PL + i * bw + 5} width={bw - 10} y={y(r.hotspot_share_pct)} height={Math.max(1, y(0) - y(r.hotspot_share_pct))} fill={r.is_fire_month ? '#1cc8aa' : '#4b5563'} opacity={hov === i ? 1 : 0.88} />
            <text className="th-val" x={PL + i * bw + bw / 2} y={y(r.hotspot_share_pct) - 5} textAnchor="middle">{r.hotspot_share_pct.toFixed(1)}</text>
            <text className="th-ax" x={PL + i * bw + bw / 2} y={H - 10} textAnchor="middle">{MN[i]}</text>
            <rect x={PL + i * bw} width={bw} y={PT - 22} height={H - PT - PB + 22} fill="transparent" />
          </g>
        ))}
      </svg>
      <p className="th-readout" aria-live="polite">
        {d ? <><b>{MN[hov]}</b>: {d.hotspot_share_pct}% of all hotspots (median year {d.median_yearly_share_pct}%). Fire recorded in {Math.round(d.share_of_years_with_fire * 100)}% of the ten years; {d.is_fire_month ? 'counted as a fire month' : 'not a fire month'}.</>
          : <>February–April holds {sum(2, 4).toFixed(1)}% of all hotspots and July–August {sum(7, 8).toFixed(1)}% (sums of the monthly shares). Hover a bar for detail.</>}
      </p>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
