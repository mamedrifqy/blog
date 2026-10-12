import { D, PH, fmt } from './shared.js';

export default function PhaseBars() {
  const rows = ['La Niña', 'Neutral', 'El Niño'].map((k) => ({ k, ...D.phaseStats[k] }));
  const max = Math.max(...rows.map((r) => r.p95));
  return (
    <figure className="pp-fig">
      <div className="pp-phase">
        {rows.map((r) => (
          <div className="pp-phase-row" key={r.k}>
            <div className="pp-phase-name"><i style={{ background: PH[r.k] }} />{r.k}<small>{r.months} months · n = {fmt(r.n)}</small></div>
            <div className="pp-phase-bars">
              <div className="pp-bar-track"><div className="pp-bar" style={{ width: (r.mean / max) * 100 + '%', background: PH[r.k] }} /><span>mean {r.mean.toFixed(1)}</span></div>
              <div className="pp-bar-track"><div className="pp-bar pp-bar-p95" style={{ width: (r.p95 / max) * 100 + '%', borderColor: PH[r.k] }} /><span>95th percentile {r.p95.toFixed(1)}</span></div>
            </div>
            <div className="pp-phase-med">median <b>{r.median}</b></div>
          </div>
        ))}
      </div>
      <figcaption>Hotspots per kecamatan-month in each ENSO phase. The median is zero in all three; the difference sits in the tail.</figcaption>
    </figure>
  );
}
