import { useState } from 'react';
import REPORT from '../../data/thesis-report.json';

// Interactive version of the three-panel "hotspots against peat depth" figure.
// Data: REPORT.depth (hotspots_by_peat_depth.csv) and REPORT.subdistrict_peat (hotspots_by_subdistrict_peat.csv).
const RED = '#e8533a', GREY = '#8d897f', TEAL = '#1cc8aa', GOLD = '#f0bc2e';
const D = REPORT.depth;
const S = REPORT.subdistrict_peat;
const SHORT = ['<100', '100–200', '200–300', '300–500', '500–700', '>700'];
const W = 760, H = 340, PL = 56, PR = 20, PT = 24, PB = 54;
const VIEWS = [
  ['share', 'Share of hotspots vs area'],
  ['density', 'Hotspots per hectare'],
  ['bubble', 'Depth at fire vs depth of landscape'],
];
const fmt = (v) => v.toLocaleString('en-US');
const ratioColor = (r) => (r >= 1.2 ? GOLD : r <= 0.8 ? TEAL : GREY);

function Axes({ yTicks, y, yLabel }) {
  return (
    <>
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,.08)" />
          <text className="th-ax" x={PL - 8} y={y(t) + 4} textAnchor="end">{t}</text>
        </g>
      ))}
      <text className="th-ax" x={14} y={PT + (H - PT - PB) / 2} textAnchor="middle" transform={`rotate(-90 14 ${PT + (H - PT - PB) / 2})`}>{yLabel}</text>
    </>
  );
}

function ShareView({ hov, setHov }) {
  const mx = 45;
  const y = (v) => PT + (H - PT - PB) * (1 - v / mx);
  const pw = (W - PL - PR) / D.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="th-svg" role="img" aria-label="Share of hotspots and share of peat area by depth class, with the ratio above each pair">
      <Axes yTicks={[0, 10, 20, 30, 40]} y={y} yLabel="% of total" />
      {D.map((r, i) => {
        const x0 = PL + pw * i + pw * 0.16, bw = pw * 0.33;
        const on = hov === null || hov === i;
        return (
          <g key={i} tabIndex={0} role="button" aria-label={`${r.depth_class}: ratio ${r.ratio}`} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} onFocus={() => setHov(i)} onBlur={() => setHov(null)}>
            <rect x={PL + pw * i} y={PT} width={pw} height={H - PT - PB} fill={hov === i ? 'rgba(255,255,255,.04)' : 'transparent'} />
            <rect x={x0} y={y(r.hotspot_share_pct)} width={bw} height={y(0) - y(r.hotspot_share_pct)} fill={RED} fillOpacity={on ? 0.9 : 0.35} />
            <rect x={x0 + bw + 3} y={y(r.peat_area_share_pct)} width={bw} height={y(0) - y(r.peat_area_share_pct)} fill={GREY} fillOpacity={on ? 0.9 : 0.35} />
            <text x={PL + pw * (i + 0.5)} y={y(Math.max(r.hotspot_share_pct, r.peat_area_share_pct)) - 8} textAnchor="middle" className="th-val" fill={ratioColor(r.ratio)} style={{ fill: ratioColor(r.ratio) }}>{r.ratio.toFixed(2)}×</text>
            <text x={PL + pw * (i + 0.5)} y={H - PB + 18} textAnchor="middle" className="th-ax">{SHORT[i]}</text>
          </g>
        );
      })}
      <line x1={PL} x2={W - PR} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,.25)" />
      <text className="th-ax" x={PL + (W - PL - PR) / 2} y={H - 8} textAnchor="middle">Peat depth class (cm)</text>
    </svg>
  );
}

function DensityView({ hov, setHov }) {
  const mx = 0.009;
  const y = (v) => PT + (H - PT - PB) * (1 - v / mx);
  const pw = (W - PL - PR) / D.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="th-svg" role="img" aria-label="Hotspots per hectare of peat by depth class">
      <Axes yTicks={[0, 0.003, 0.006, 0.009]} y={y} yLabel="Hotspots per ha" />
      {D.map((r, i) => {
        const bw = pw * 0.56, x0 = PL + pw * i + (pw - bw) / 2;
        const on = hov === null || hov === i;
        return (
          <g key={i} tabIndex={0} role="button" aria-label={`${r.depth_class}: ${r.hotspot_density_per_ha.toFixed(4)} hotspots per hectare`} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} onFocus={() => setHov(i)} onBlur={() => setHov(null)}>
            <rect x={PL + pw * i} y={PT} width={pw} height={H - PT - PB} fill={hov === i ? 'rgba(255,255,255,.04)' : 'transparent'} />
            <rect x={x0} y={y(r.hotspot_density_per_ha)} width={bw} height={y(0) - y(r.hotspot_density_per_ha)} fill={RED} fillOpacity={on ? 0.9 : 0.35} />
            <text x={PL + pw * (i + 0.5)} y={y(r.hotspot_density_per_ha) - 8} textAnchor="middle" className="th-val">{r.hotspot_density_per_ha.toFixed(4)}</text>
            <text x={PL + pw * (i + 0.5)} y={H - PB + 18} textAnchor="middle" className="th-ax">{SHORT[i]}</text>
          </g>
        );
      })}
      <line x1={PL} x2={W - PR} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,.25)" />
      <text className="th-ax" x={PL + (W - PL - PR) / 2} y={H - 8} textAnchor="middle">Peat depth class (cm)</text>
    </svg>
  );
}

function BubbleView({ hov, setHov }) {
  const lo = 2, hi = 5.5;
  const x = (v) => PL + ((v - lo) / (hi - lo)) * (W - PL - PR);
  const y = (v) => PT + (H - PT - PB) * (1 - (v - lo) / (hi - lo));
  const maxN = Math.max(...S.map((r) => r.hotspots_total));
  const rad = (n) => 5 + 17 * Math.sqrt(n / maxN);
  const ticks = [2, 3, 4, 5];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="th-svg" role="img" aria-label="For each sub-district, the depth class at which fires occur against the mean depth class of its peat; bubble size is the hotspot count">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,.08)" />
          <line x1={x(t)} x2={x(t)} y1={PT} y2={H - PB} stroke="rgba(255,255,255,.08)" />
          <text className="th-ax" x={PL - 8} y={y(t) + 4} textAnchor="end">{t}</text>
          <text className="th-ax" x={x(t)} y={H - PB + 18} textAnchor="middle">{t}</text>
        </g>
      ))}
      <line x1={x(lo)} y1={y(lo)} x2={x(hi)} y2={y(hi)} stroke="rgba(255,255,255,.35)" strokeDasharray="5 4" />
      <text className="th-ax" x={x(5.35)} y={y(5.35) + 16} textAnchor="end">1 : 1</text>
      {[...S].sort((a, b) => b.hotspots_total - a.hotspots_total).map((r) => {
        const i = S.indexOf(r);
        const above = r.mean_depth_class_at_fire > r.mean_depth_class_of_landscape;
        const on = hov === null || hov === i;
        return (
          <g key={r.kecamatan} tabIndex={0} role="button" aria-label={r.kecamatan} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} onFocus={() => setHov(i)} onBlur={() => setHov(null)}>
            <circle cx={x(r.mean_depth_class_of_landscape)} cy={y(r.mean_depth_class_at_fire)} r={rad(r.hotspots_total)} fill={above ? GOLD : TEAL} fillOpacity={on ? 0.6 : 0.18} stroke={above ? GOLD : TEAL} strokeWidth={hov === i ? 2.5 : 1} />
            <text className="th-ax" x={x(r.mean_depth_class_of_landscape) + rad(r.hotspots_total) + 4} y={y(r.mean_depth_class_at_fire) + 4} style={{ opacity: on ? 1 : 0.35 }}>{r.kecamatan}</text>
          </g>
        );
      })}
      <line x1={PL} x2={PL} y1={PT} y2={H - PB} stroke="rgba(255,255,255,.25)" />
      <line x1={PL} x2={W - PR} y1={H - PB} y2={H - PB} stroke="rgba(255,255,255,.25)" />
      <text className="th-ax" x={PL + (W - PL - PR) / 2} y={H - 8} textAnchor="middle">Mean depth class of the sub-district's peat (area-weighted)</text>
      <text className="th-ax" x={14} y={PT + (H - PT - PB) / 2} textAnchor="middle" transform={`rotate(-90 14 ${PT + (H - PT - PB) / 2})`}>Mean depth class at fires</text>
    </svg>
  );
}

export default function PeatDepthExplorer({ caption }) {
  const [view, setView] = useState('share');
  const [hov, setHov] = useState(null);
  const pick = (v) => { setView(v); setHov(null); };
  let read;
  if (view === 'bubble') {
    const r = hov !== null ? S[hov] : null;
    read = r
      ? <><b>{r.kecamatan}</b>: {fmt(r.hotspots_total)} hotspots, fires at depth class {r.mean_depth_class_at_fire.toFixed(2)} against {r.mean_depth_class_of_landscape.toFixed(2)} for its peat overall ({r.mean_depth_class_at_fire > r.mean_depth_class_of_landscape ? 'burns deeper than its landscape average' : 'burns shallower than its landscape average'}). {r.pct_on_peat.toFixed(1)}% of its hotspots fall on mapped peat.</>
      : 'Hover a bubble. Gold = fires on deeper peat than the sub-district average (above the 1:1 line), teal = shallower. Bubble area scales with hotspot count. Depth class: 1 = 50–<100 cm … 6 = >700 cm.';
  } else {
    const r = hov !== null ? D[hov] : null;
    read = r
      ? (view === 'share'
        ? <><b>{r.depth_class}</b>: {fmt(r.hotspots)} hotspots ({r.hotspot_share_pct.toFixed(2)}%) on {r.peat_area_share_pct.toFixed(2)}% of the peat area ({fmt(Math.round(r.peat_area_ha))} ha). Ratio {r.ratio.toFixed(2)}, {r.status.toLowerCase()}.</>
        : <><b>{r.depth_class}</b>: {fmt(r.hotspots)} hotspots on {fmt(Math.round(r.peat_area_ha))} ha, {r.hotspot_density_per_ha.toFixed(4)} per hectare.</>)
      : 'Hover or focus a depth class. ' + (view === 'share' ? 'Red = share of hotspots, grey = share of peat area; the number above each pair is the ratio (gold above 1.2, teal below 0.8).' : 'Hotspots per hectare of peat in each class.');
  }
  return (
    <figure className="pp-fig pp-wide">
      <div className="pp-controls">
        <div className="pp-chips" role="group" aria-label="View">
          {VIEWS.map(([k, l]) => <button key={k} type="button" aria-pressed={view === k} onClick={() => pick(k)}>{l}</button>)}
        </div>
      </div>
      {view === 'share' && <div className="pp-legend"><span><i style={{ background: RED }} />Share of hotspots</span><span><i style={{ background: GREY }} />Share of peat area</span></div>}
      {view === 'share' && <ShareView hov={hov} setHov={setHov} />}
      {view === 'density' && <DensityView hov={hov} setHov={setHov} />}
      {view === 'bubble' && <BubbleView hov={hov} setHov={setHov} />}
      <p className="th-readout" aria-live="polite">{read}</p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
