import { D, sig } from './shared.js';

export default function CorrelationDots() {
  const rows = Object.entries(D.kec).map(([n, v]) => ({ n, oni: v.rhoOni, spi: -v.rhoSpi, po: v.pOniAdj, ps: v.pSpiAdj })).sort((a, b) => b.spi - a.spi);
  const W = 640, rowH = 30, L = 130, top = 30, H = top + rows.length * rowH + 28, x = (v) => L + (v / 0.55) * (W - L - 24);
  const ticks = [0, 0.1, 0.2, 0.3, 0.4, 0.5];
  return (
    <figure className="pp-fig pp-wide">
      <div className="pp-legend"><span><i className="pp-dot" style={{ background: 'var(--c-teal)' }} />SPI-3 (drier → more fire), shown as |ρ|</span><span><i className="pp-dot" style={{ background: 'var(--c-gold)' }} />ONI (warmer → more fire)</span><span>hollow = not significant after FDR</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Spearman correlations of SPI-3 and ONI with hotspot counts, by kecamatan." className="pp-dots">
        {ticks.map((t) => <g key={t}><line x1={x(t)} x2={x(t)} y1={top - 8} y2={H - 24} className="pp-grid" /><text x={x(t)} y={H - 8} textAnchor="middle" className="pp-tick">{t.toFixed(1)}</text></g>)}
        {rows.map((r, i) => {
          const y = top + i * rowH + rowH / 2;
          return (
            <g key={r.n}>
              <text x={L - 12} y={y + 4} textAnchor="end" className="pp-rowlab">{r.n}</text>
              <line x1={x(r.oni)} x2={x(r.spi)} y1={y} y2={y} className="pp-link" />
              <circle cx={x(r.spi)} cy={y} r="6" fill={r.ps < 0.05 ? 'var(--c-teal)' : 'var(--bg)'} stroke="var(--c-teal)" strokeWidth="2"><title>{`${r.n}: SPI-3 ρ = ${(-r.spi).toFixed(3)} (${sig(r.ps)})`}</title></circle>
              <circle cx={x(r.oni)} cy={y} r="6" fill={r.po < 0.05 ? 'var(--c-gold)' : 'var(--bg)'} stroke="var(--c-gold)" strokeWidth="2"><title>{`${r.n}: ONI ρ = ${r.oni.toFixed(3)} (${sig(r.po)})`}</title></circle>
            </g>
          );
        })}
      </svg>
      <figcaption>Spearman ρ between monthly hotspot counts and each climate index, per kecamatan (n = 120 months). ONI and SPI-3 correlations were recomputed from the 3,402 filtered points; SPI-3 uses a 1991–2024 CHIRPS baseline.</figcaption>
    </figure>
  );
}
