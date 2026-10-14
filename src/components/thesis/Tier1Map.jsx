import { useState } from 'react';
import ThesisMap, { Scale } from './ThesisMap.jsx';
import { TIER1, KEC } from './data.js';
import { mix, TEAL, CORAL, f2, f3 } from './util.js';

const M = {
  precision: { label: 'Precision', note: 'Of hotspot months, share that also have a burned pixel', hi: TEAL, max: 0.5 },
  recall: { label: 'Recall', note: 'Of burned months, share that also have a hotspot', hi: TEAL, max: 1 },
  f1: { label: 'F1', note: 'Harmonic mean of precision and recall', hi: TEAL, max: 0.65 },
  rho: { label: 'Spearman ρ', note: 'Monthly hotspot count vs burned hectares', hi: CORAL, max: 0.7 },
};

export default function Tier1Map() {
  const [m, setM] = useState('recall');
  const [sel, setSel] = useState('Bantan');
  const fills = Object.fromEntries(KEC.map((k) => [k, mix(TIER1[k][m] / M[m].max, M[m].hi)]));
  const t = TIER1[sel], all = TIER1.ALL;
  return (
    <ThesisMap
      label="Map of Bengkalis kecamatan coloured by agreement between hotspot months and MODIS burned-area months"
      fills={fills} selected={sel} onSelect={setSel}
      controls={<div className="pp-controls"><div className="pp-seg" role="group" aria-label="Agreement metric">{Object.entries(M).map(([k, v]) => <button key={k} type="button" aria-pressed={m === k} onClick={() => setM(k)}>{v.label}</button>)}</div></div>}
      panel={<>
        <h4>{sel}</h4>
        <dl>
          <div><dt>Hotspot months / burned months</dt><dd>{t.hsMonths} / {t.burnMonths}<small> of 120</small></dd></div>
          <div><dt>Precision · recall</dt><dd>{f2(t.precision)} · {f2(t.recall)}</dd></div>
          <div><dt>F1 · Cohen's κ</dt><dd>{f2(t.f1)} · {f2(t.kappa)}</dd></div>
          <div><dt>Within ±1 month</dt><dd>{f2(t.precisionPm1)} · {f2(t.recallPm1)}<small> precision · recall</small></dd></div>
          <div><dt>Spearman ρ, hotspots vs ha</dt><dd>{f3(t.rho)}</dd></div>
        </dl>
        <p className="pp-mini">Whole regency: precision {f2(all.precision)}, recall {f2(all.recall)}, κ {f2(all.kappa)}. Click a kecamatan.</p>
      </>}
      legend={<Scale lo="0" hi={M[m].max.toFixed(2) + '+'} from={mix(0, M[m].hi)} to={mix(1, M[m].hi)} note={M[m].note} />}
      caption="Month-by-month agreement between DBSCAN-filtered hotspots and the MODIS MCD64A1 burned-area product, 2015–2024. Kecamatan with only a handful of burned months (Mandau: 2, Bathin Solapan: 4) give unstable ratios, so read the small ones loosely."
    />
  );
}
