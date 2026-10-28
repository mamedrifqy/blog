import { useState } from 'react';
import REPORT from '../../data/thesis-report.json';
import { MN } from './util.js';

// 120 months, 2015–2024. Top: ONI (°C) with the ±0.5 El Niño / La Niña thresholds. Bottom: filtered hotspots per month, regency total.
const M = REPORT.monthly;
const W = 960, PL = 46, PR = 14;
const IW = W - PL - PR;
const H1 = 150, H2 = 170, GAP = 34, PT = 10;
const H = PT + H1 + GAP + H2 + 28;
const x = (i) => PL + (i + 0.5) * (IW / M.length);
const bw = IW / M.length;
const oniMax = 2.8, oniMin = -2.4;
const yO = (v) => PT + (1 - (v - oniMin) / (oniMax - oniMin)) * H1;
const nMax = Math.max(...M.map((d) => d.n));
const yMax = Math.ceil(nMax / 100) * 100;
const yN = (v) => PT + H1 + GAP + (1 - v / yMax) * H2;

export default function OniHotspotSeries({ caption }) {
  const [hov, setHov] = useState(null);
  const [lock, setLock] = useState(null);
  const a = lock ?? hov;
  const d = a != null ? M[a] : null;
  const path = M.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${yO(p.oni).toFixed(1)}`).join('');
  const pick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.floor(((e.clientX - r.left) / r.width * W - PL) / bw);
    return i >= 0 && i < M.length ? i : null;
  };
  const phase = (ph) => (ph === 'E' ? 'El Niño' : ph === 'L' ? 'La Niña' : 'Neutral');
  return (
    <figure className="pp-fig pp-wide">
      <svg viewBox={`0 0 ${W} ${H}`} className="th-svg" role="img" aria-label="Monthly ONI and monthly filtered hotspots in Bengkalis, 2015 to 2024"
        onMouseMove={(e) => setHov(pick(e))} onMouseLeave={() => setHov(null)} onClick={(e) => { const i = pick(e); setLock(i === lock ? null : i); }}>
        {/* ONI panel */}
        <rect x={PL} y={yO(0.5)} width={IW} height={yO(-0.5) - yO(0.5)} fill="rgb(var(--ink-rgb) / .04)" />
        {[-2, -1, 0, 1, 2].map((v) => (
          <g key={v}><line x1={PL} x2={W - PR} y1={yO(v)} y2={yO(v)} stroke={v === 0 ? 'rgb(var(--ink-rgb) / .28)' : 'rgb(var(--ink-rgb) / .07)'} />
            <text className="th-ax" x={PL - 8} y={yO(v) + 4} textAnchor="end">{v > 0 ? '+' + v : v}</text></g>
        ))}
        <line x1={PL} x2={W - PR} y1={yO(0.5)} y2={yO(0.5)} stroke="var(--c-coral)" strokeDasharray="4 4" opacity=".55" />
        <line x1={PL} x2={W - PR} y1={yO(-0.5)} y2={yO(-0.5)} stroke="var(--c-blue)" strokeDasharray="4 4" opacity=".55" />
        <text className="th-ax" x={W - PR - 4} y={yO(0.5) - 5} textAnchor="end" fill="var(--coral)">+0.5 El Niño</text>
        <text className="th-ax" x={W - PR - 4} y={yO(-0.5) + 14} textAnchor="end" fill="var(--blue-text)">−0.5 La Niña</text>
        <text className="th-ax" x={PL} y={PT - 1} fill="var(--text-muted)">ONI (°C)</text>
        {M.map((p, i) => (
          <rect key={'o' + i} x={x(i) - bw / 2 + 0.3} width={bw - 0.6} y={Math.min(yO(0), yO(p.oni))} height={Math.abs(yO(p.oni) - yO(0))}
            fill={p.ph === 'E' ? 'var(--c-coral)' : p.ph === 'L' ? 'var(--c-blue)' : '#6b7280'} opacity={a === i ? 1 : 0.8} />
        ))}
        {/* hotspot panel */}
        {[0, yMax / 2, yMax].map((v) => (
          <g key={v}><line x1={PL} x2={W - PR} y1={yN(v)} y2={yN(v)} stroke="rgb(var(--ink-rgb) / .08)" />
            <text className="th-ax" x={PL - 8} y={yN(v) + 4} textAnchor="end">{v}</text></g>
        ))}
        <text className="th-ax" x={PL} y={PT + H1 + GAP - 8} fill="var(--text-muted)">Hotspots per month, all 11 sub-districts</text>
        {M.map((p, i) => (
          <rect key={'n' + i} x={x(i) - bw / 2 + 0.3} width={bw - 0.6} y={yN(p.n)} height={yN(0) - yN(p.n)} fill="var(--c-gold)" opacity={a === i ? 1 : 0.85} />
        ))}
        {/* year ticks */}
        {Array.from({ length: 10 }, (_, k) => (
          <g key={k}><line x1={PL + k * 12 * bw} x2={PL + k * 12 * bw} y1={PT} y2={PT + H1 + GAP + H2} stroke="rgb(var(--ink-rgb) / .06)" />
            <text className="th-ax" x={PL + (k * 12 + 6) * bw} y={H - 8} textAnchor="middle">{2015 + k}</text></g>
        ))}
        {a != null && <line x1={x(a)} x2={x(a)} y1={PT} y2={PT + H1 + GAP + H2} stroke="var(--text-bright)" strokeWidth="1" opacity=".7" />}
      </svg>
      <p className="th-readout" aria-live="polite">
        {d ? <><b>{MN[d.m - 1]} {d.y}</b>: ONI {d.oni > 0 ? '+' : ''}{d.oni.toFixed(2)} °C ({phase(d.ph)}), <b>{d.n}</b> hotspots.{lock != null ? ' (click again to release)' : ''}</>
          : 'Hover or tap a month. The 2015 and 2019 peaks coincide with the two big El Niño-influenced dry seasons.'}
      </p>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
