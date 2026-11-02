import { useMemo, useState } from 'react';
import { PHASE_LABEL, MONTHS_LONG, MN, useData, Loading, num } from './util.jsx';

// The 11 × 120 analysis panel as a clickable grid. Each cell is one row of monthly_panel_11x120.csv.
const VARS = [
  ['hotspot_count', 'Hotspots', 'seq'],
  ['precip_mm', 'Rainfall (mm)', 'seq'],
  ['spi3', 'SPI-3', 'div'],
  ['spei3', 'SPEI-3', 'div'],
  ['t2m_mean_c', 'Temperature (°C)', 'seq'],
];
const COLS = [
  ['year', 'Year'], ['month', 'Month'], ['kecamatan', 'Sub-district'],
  ['hotspot_count', 'Filtered hotspots in the month'], ['fire_occurrence', 'Fire occurrence (1 if at least one hotspot)'],
  ['is_fire_season', 'Empirical fire month (1 in Feb, Mar, Apr, Jul, Aug)'],
  ['oni_c', 'ONI (°C)'], ['enso_phase', 'ENSO phase (thesis rule)'], ['dmi', 'DMI'],
  ['precip_mm', 'Rainfall, CHIRPS (mm)'], ['t2m_mean_c', 'Mean 2 m temperature, ERA5-Land (°C)'],
  ['spi3', 'SPI-3'], ['spei3', 'SPEI-3'],
  ['peat_area_ha', 'Mapped peat (ha) · static'], ['oil_palm_fraction', 'Oil palm fraction · static'],
  ['deforestation_fraction_2015_2024', 'Deforested fraction 2015–2024 · static'], ['population_density_km2', 'Population per km² · static'],
];

function scale(kind, lo, hi) {
  return (v) => {
    if (kind === 'div') {
      const a = Math.max(-1, Math.min(1, v / 2));
      return a < 0 ? `rgba(232,83,58,${0.12 + 0.85 * -a})` : `rgba(79,155,232,${0.12 + 0.85 * a})`;
    }
    const a = (v - lo) / (hi - lo || 1);
    return `rgba(28,200,170,${v === 0 && lo === 0 ? 0.05 : 0.12 + 0.88 * Math.sqrt(Math.max(0, a))})`;
  };
}

export default function PanelExplorer({ base }) {
  const { data, err } = useData([[`${base}/thesis-data/csv/monthly_panel_11x120.csv`, 'csv']]);
  const [v, setV] = useState('hotspot_count');
  const [pick, setPick] = useState(null);

  const G = useMemo(() => {
    if (!data) return null;
    const names = [...new Set(data[0].objects.map((r) => r.kecamatan))].sort();
    const grid = names.map(() => Array(120));
    data[0].objects.forEach((r) => { grid[names.indexOf(r.kecamatan)][(+r.year - 2015) * 12 + +r.month - 1] = r; });
    return { names, grid };
  }, [data]);

  if (!G) return <Loading err={err} />;
  const [, label, kind] = VARS.find((x) => x[0] === v);
  const vals = G.grid.flat().map((r) => +r[v]);
  const col = scale(kind, Math.min(...vals), Math.max(...vals));
  const r = pick ? G.grid[pick[0]][pick[1]] : null;

  return (
    <div className="sx-explorer">
      <div className="sx-toolbar">
        <div className="sx-chips" role="group" aria-label="Variable">
          {VARS.map(([k, t]) => <button key={k} className={v === k ? 'on' : ''} onClick={() => setV(k)}>{t}</button>)}
        </div>
      </div>
      <div className="sx-gridwrap">
        <div className="sx-grid" style={{ gridTemplateColumns: `128px repeat(120, minmax(5px, 1fr))` }} role="grid" aria-label={`${label} by sub-district and month`}>
          {G.names.map((n, i) => (
            <div key={n} className="sx-grow" role="row" style={{ display: 'contents' }}>
              <div className="sx-gname">{n}</div>
              {G.grid[i].map((c, t) => (
                <button key={t} className={`sx-cell${pick && pick[0] === i && pick[1] === t ? ' on' : ''}`} style={{ background: col(+c[v]) }}
                  onClick={() => setPick([i, t])} aria-label={`${n}, ${MONTHS_LONG[+c.month - 1]} ${c.year}: ${label} ${c[v]}`} title={`${n} · ${MN[+c.month - 1]} ${c.year} · ${label}: ${num(c[v], 2)}`} />
              ))}
            </div>
          ))}
          <div />
          {Array.from({ length: 120 }, (_, t) => <div key={t} className="sx-gyear">{t % 12 === 0 ? 2015 + t / 12 : ''}</div>)}
        </div>
      </div>
      <p className="sx-note">{kind === 'div' ? 'Red is drier than normal, blue wetter (values clipped at ±2).' : 'Brighter is higher (square-root scale).'} Each cell is one row of the panel; click one to read the whole row.</p>
      <div className="sx-detail wide" aria-live="polite">
        {!r && <p className="sx-hint">Click a cell.</p>}
        {r && (
          <div className="sx-card">
            <p className="sx-card-kick">Panel row · monthly_panel_11x120.csv</p>
            <h4>{r.kecamatan}, {MONTHS_LONG[+r.month - 1]} {r.year}</h4>
            <dl className="sx-kv cols">
              {COLS.slice(3).map(([k, t]) => (
                <div key={k}><dt>{t}<code>{k}</code></dt><dd>{k === 'enso_phase' ? PHASE_LABEL[r[k]] || r[k] : ['year', 'month'].includes(k) ? r[k] : num(r[k], k.includes('fraction') ? 3 : 2)}</dd></div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
