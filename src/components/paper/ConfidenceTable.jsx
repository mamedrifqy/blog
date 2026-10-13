import { useState } from 'react';
import T from '../../data/riau-confidence.json';
import { fmt } from './shared.js';

const OPTS = [['all', 'All'], ['ge30', '≥30%'], ['ge50', '≥50%'], ['ge70', '≥70%'], ['ge80', '≥80%']];
const NOTE = {
  all: 'All detections, no confidence filter.',
  ge30: 'The threshold behind the regional report.',
  ge50: 'Nominal-to-high detections.',
  ge70: 'The anchor threshold in the Bengkalis study.',
  ge80: 'High-confidence detections only.',
};

export default function ConfidenceTable() {
  const [k, setK] = useState('ge30');
  const names = Object.keys(T).sort((a, b) => T[b][k] - T[a][k]);
  const sum = (c) => names.reduce((s, n) => s + T[n][c], 0);
  const total = sum(k), all = sum('all'), max = T[names[0]][k];
  return (
    <figure className="pp-fig">
      <div className="pp-seg" role="group" aria-label="MODIS confidence threshold">
        {OPTS.map(([v, l]) => <button key={v} type="button" aria-pressed={k === v} onClick={() => setK(v)}>{l}</button>)}
      </div>
      <p className="pp-cf-note">{NOTE[k]} Share of all detections kept in the last column.</p>
      <div className="pp-cf">
        {names.map((n) => (
          <div className="pp-cf-row" key={n}>
            <span className="pp-cf-n">{n}</span>
            <span className="pp-cf-bar"><i style={{ width: (T[n][k] / max * 100) + '%' }} /></span>
            <b>{fmt(T[n][k])}</b>
            <span className="pp-cf-p">{Math.round(T[n][k] / T[n].all * 100)}%</span>
          </div>
        ))}
        <div className="pp-cf-row pp-cf-tot"><span className="pp-cf-n">Riau total</span><span /><b>{fmt(total)}</b><span className="pp-cf-p">{Math.round(total / all * 100)}%</span></div>
      </div>
      <figcaption>MODIS detections 2015–2024 counted from the raw points inside regency boundaries (batas-admin, update 13 June 2023). NASA does not give a single best cut-off; low / nominal / high (0–29 / 30–79 / 80–100) is a convention.</figcaption>
    </figure>
  );
}
