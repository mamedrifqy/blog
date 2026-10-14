import { SIMPSON } from './data.js';

export default function SimpsonDots() {
  const rows = Object.entries(SIMPSON.kec).sort((a, b) => a[1] - b[1]);
  const W = 640, rh = 26, L = 150, R = 30, T = 24, H = T + (rows.length + 1) * rh + 26;
  const x = (v) => L + ((v - 0) / -0.6) * (W - L - R) * -1; // map 0 -> L, -0.6 -> W-R
  const xx = (v) => L + (Math.abs(v) / 0.6) * (W - L - R);
  return (
    <figure className="pp-fig">
      <svg viewBox={`0 0 ${W} ${H}`} className="th-svg" role="img" aria-label="Spearman correlation between rainfall and hotspots, pooled and in each kecamatan">
        {[0, 0.2, 0.4, 0.6].map((v) => <g key={v}><line x1={xx(v)} x2={xx(v)} y1={T - 4} y2={H - 26} stroke="rgba(255,255,255,.07)" /><text x={xx(v)} y={H - 10} textAnchor="middle" className="th-ax">{v === 0 ? '0' : '−' + v.toFixed(1)}</text></g>)}
        <line x1={xx(SIMPSON.global)} x2={xx(SIMPSON.global)} y1={T - 4} y2={H - 26} stroke="#f0bc2e" strokeDasharray="4 3" />
        <text x={xx(SIMPSON.global)} y={T - 10} textAnchor="middle" className="th-ax" fill="#f0bc2e">pooled {SIMPSON.global.toFixed(2)}</text>
        {rows.map(([k, v], i) => { const cy = T + (i + 0.5) * rh + 6; return <g key={k}><text x={L - 10} y={cy + 4} textAnchor="end" className="th-lab-s">{k}</text><line x1={xx(0)} x2={xx(v)} y1={cy} y2={cy} stroke="#1cc8aa" strokeOpacity=".4" strokeWidth="2" /><circle cx={xx(v)} cy={cy} r="5" fill="#1cc8aa" /><text x={xx(v) + 10} y={cy + 4} className="th-val">{v.toFixed(2)}</text></g>; })}
      </svg>
      <figcaption>Spearman ρ between monthly rainfall and hotspots, pooled across the regency (dashed) and inside each kecamatan. All eleven share the pooled sign, so the regency-wide relationship is not an artefact of mixing wet and dry kecamatan (Simpson's paradox). Mandau is the weakest (−0.14).</figcaption>
    </figure>
  );
}
