import { useState } from 'react';
import { ABL, FIRE_PREVALENCE } from './data.js';

const GROUPS = { ref: 'Reference', only: 'One group alone', drop: 'One group removed', lr: 'Logistic regression' };
const COL = { ref: '#f2ede4', only: '#1cc8aa', drop: '#e8533a', lr: '#4f9be8' };

export default function AblationChart() {
  const [metric, setMetric] = useState('auc');
  const [sel, setSel] = useState('clim');
  const [filter, setFilter] = useState('all');
  const rows = ABL.filter((r) => filter === 'all' || r.group === filter || r.group === 'ref');
  const W = 760, rh = 40, L = 290, R = 30, T = 24, H = T + rows.length * rh + 30;
  const x0 = 0.4, x1 = 0.9, x = (v) => L + ((v - x0) / (x1 - x0)) * (W - L - R);
  const s = ABL.find((r) => r.id === sel) || ABL[0];
  const full = ABL[0];
  const val = (r) => (metric === 'auc' ? r.auc : r.fold);
  return (
    <figure className="pp-fig pp-wide">
      <div className="pp-controls">
        <div className="pp-seg" role="group" aria-label="Metric">
          <button type="button" aria-pressed={metric === 'auc'} onClick={() => setMetric('auc')}>Pooled AUC (95% CI)</button>
          <button type="button" aria-pressed={metric === 'fold'} onClick={() => setMetric('fold')}>Mean per-fold AUC</button>
        </div>
        <div className="pp-chips" role="group" aria-label="Show">{[['all', 'All 12'], ['only', 'Groups alone'], ['drop', 'Groups removed'], ['lr', 'Logistic']].map(([k, v]) => <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{v}</button>)}</div>
      </div>
      <div className="pp-map-grid th-abl">
        <svg viewBox={`0 0 ${W} ${H}`} className="th-svg" role="img" aria-label="AUC of each feature configuration under leave-one-kecamatan-out validation">
          {[0.5, 0.6, 0.7, 0.8, 0.9].map((v) => <g key={v}><line x1={x(v)} x2={x(v)} y1={T - 6} y2={H - 26} stroke={v === 0.5 ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.07)'} strokeDasharray={v === 0.5 ? '4 3' : undefined} /><text x={x(v)} y={H - 10} textAnchor="middle" className="th-ax">{v.toFixed(1)}</text></g>)}
          <text x={x(0.5) + 4} y={T - 9} className="th-ax">chance</text>
          <line x1={x(val(full))} x2={x(val(full))} y1={T - 6} y2={H - 26} stroke="#f2ede4" strokeOpacity=".5" />
          {rows.map((r, i) => {
            const cy = T + i * rh + rh / 2, v = val(r), on = r.id === sel;
            return (
              <g key={r.id} className="th-row" tabIndex={0} role="button" aria-label={r.label} aria-pressed={on} onClick={() => setSel(r.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSel(r.id)} style={{ cursor: 'pointer' }}>
                <rect x="0" y={cy - rh / 2 + 2} width={W} height={rh - 4} fill={on ? 'rgba(255,255,255,.06)' : 'transparent'} />
                <text x={L - 12} y={cy + 4} textAnchor="end" className="th-lab-s">{r.label.length > 44 ? r.label.slice(0, 43) + '…' : r.label}</text>
                {metric === 'auc' && <line x1={x(r.lo)} x2={x(r.hi)} y1={cy} y2={cy} stroke={COL[r.group]} strokeWidth="2.5" strokeOpacity=".55" />}
                <circle cx={x(v)} cy={cy} r={on ? 7 : 5.5} fill={COL[r.group]} />
                <text x={x(Math.max(v, metric === 'auc' ? r.hi : v)) + 12} y={cy + 4} className="th-val">{v.toFixed(3)}</text>
              </g>
            );
          })}
        </svg>
        <aside className="pp-panel" aria-live="polite">
          <h4 style={{ fontSize: '1.05rem' }}>{s.label}</h4>
          <dl>
            <div><dt>Features</dt><dd>{s.n}</dd></div>
            <div><dt>Pooled AUC</dt><dd>{s.auc.toFixed(3)}<small> · CI {s.lo.toFixed(3)}–{s.hi.toFixed(3)}</small></dd></div>
            <div><dt>Mean per-fold AUC</dt><dd>{s.fold.toFixed(3)}</dd></div>
            <div><dt>Average precision</dt><dd>{s.ap.toFixed(3)}<small> · chance {FIRE_PREVALENCE}</small></dd></div>
            <div><dt>vs. full model (pooled)</dt><dd>{s.auc - full.auc >= 0 ? '+' : '−'}{Math.abs(s.auc - full.auc).toFixed(3)}</dd></div>
          </dl>
          {s.id === 'static' && <p className="pp-mini">Per-fold AUC is exactly 0.500 by construction: a feature that is constant within a kecamatan cannot rank months inside it.</p>}
          <p className="pp-mini">Click a row. Dot = estimate; bar = 95% bootstrap CI over the 11 kecamatan.</p>
        </aside>
      </div>
      <figcaption>Random forest (200 trees), leave-one-kecamatan-out cross-validation, target: any filtered hotspot in a kecamatan-month (24.8% of 1,320 months). The thin white line marks the full model.</figcaption>
    </figure>
  );
}
