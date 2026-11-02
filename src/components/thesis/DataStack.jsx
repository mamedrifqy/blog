import { useState, useEffect } from 'react';
import STACK from '../../data/data-stack.json';
import DATASETS from '../../data/thesis-datasets.json';

// "How the data fit together": the thesis data structure drawn as an exploded stack of planes,
// raw sources at the bottom and the published tables at the top. Every number and label below
// comes from the thesis overview post (Table 3.2, Section 3.6 table, eight-stage workflow), the
// filtering, peat and canal posts, or from src/data/data-stack.json (built from public/thesis-data).

const DEPTH = ['#4b5d9e', '#3b97b0', '#2cc4a0', '#8fd96a', '#e6d23c', '#f28f3b'];
const PHASE = { 'El Nino': '#e8533a', 'La Nina': '#4f9be8', Netral: '#6b7280' };
const TEAL = '#1cc8aa', GOLD = '#f0bc2e', CORAL = '#e8533a';

const anchor = (file) => file.replace(/^csv\//, '').replace(/\.csv$/, '');

const SOURCES = [
  ['Fire hotspots', 'NASA FIRMS MODIS active fire (1 km pixel)', 'Target variable', CORAL],
  ['Precipitation', 'CHIRPS v2.0 (0.05°)', 'SPI-3, SPEI-3, predictor', '#4f9be8'],
  ['Air temperature', 'ERA5-Land monthly (0.1°)', 'PET, predictor', GOLD],
  ['ENSO, IOD', 'ONI and DMI (NOAA PSL)', 'Phase, predictor, confounder', '#c084fc'],
  ['Peat depth', 'National peatland map, clipped to the regency (208 polygons)', 'Depth, peat area', DEPTH[2]],
  ['Land-use covariates', 'Oil palm (Descals et al. 2024), Hansen forest loss, JRC surface water, BPS population, Landsat and Sentinel-2 NDVI trend', 'Static covariates', '#8fd96a'],
  ['Burned area', 'MODIS MCD64A1 (500 m); Landsat dNBR and dATBI (30 m)', 'Proxy validation', '#f28f3b'],
  ['Land cover; canals', 'ESA WorldCover v200; Dadap et al. (2021)', 'Canal analysis', '#94a3b8'],
];

const ANALYSES = [
  ['Statistical and spatial analysis', 'Rank tests, correlations with effective sample size, Poisson count models with fixed effects, heterogeneity tests, trend tests, Moran’s I and ST-DBSCAN. ONI IRR 1.95 (95% CI 1.36–2.81), 1.29 (0.98–1.69) once SPEI-3 is added; Wald χ² = 23.2, p = 0.010 for differences between sub-districts.', 'enso-spi3-peatland-fire-bengkalis', TEAL],
  ['Non-climatic factors', 'Oil palm, forest loss, surface water, population and NDVI trend, held as static covariates per sub-district.', 'peat-depth-land-cover-bengkalis', '#8fd96a'],
  ['Machine learning', 'Random Forest with leave-one-sub-district-out and leave-one-year-out validation, ablation and SHAP. Pooled AUC 0.79 (sub-districts held out) and 0.81 (years held out).', 'climate-vs-everything-else-ablation-bengkalis', GOLD],
  ['Early warning, proxy validation, canals', 'A nested ENSO-and-drought rule does not significantly beat a seasonal calendar. Hotspots on non-forest peat sit closer to drainage canals than expected by chance.', 'early-warning-skill-bengkalis', CORAL],
];

const GROUP = (f) => /hotspots_filtered|retention|seasonal|annual/.test(f) ? 0 : /panel|subdistrict|enso_response/.test(f) ? 1 : /peat|oil_palm/.test(f) ? 2 : /canal/.test(f) ? 3 : 4;
const GROUP_COL = [CORAL, TEAL, DEPTH[2], '#94a3b8', GOLD];

const LAYERS = [
  {
    key: 'sources', name: 'Sources', sub: '8 dataset groups · Table 3.2', kicker: 'Stage 1 · acquisition and preprocessing',
    desc: 'Secondary geospatial data, processed in Python on Google Colab with Google Earth Engine. Each tile on the plane is one row of Table 3.2.',
    items: SOURCES.map(([a, b, c, col]) => ({ label: a, note: `${b} → ${c}`, col })),
    post: ['thesis-overview-enso-peat-fire-bengkalis', 'The thesis in one page'],
  },
  {
    key: 'hotspots', name: 'Hotspots', sub: '205,215 → 3,402 points', kicker: 'Stage 3 · hotspot filtering · Section 3.6',
    desc: 'A confidence-anchored DBSCAN keeps detections of 70% confidence or more as anchors, rescues 50–69% detections within 1.5 km of an anchor as probable smouldering peat fires, and discards the rest. On the plane: the 3,402 retained hotspots at their real positions, orange on mapped peat (91.1%) and grey off peat.',
    stats: [['205,215', 'FIRMS MODIS detections, Riau'], ['3,402', 'retained hotspots'], ['91.1%', 'fall on peat']],
    items: [
      { label: 'FIRMS MODIS detections for Riau', note: '205,215' },
      { label: 'Vegetation-fire type only (15,981 removed)', note: '189,234' },
      { label: 'Restricted to 2015–2024', note: '33,759' },
      { label: 'Within the Bengkalis boundary', note: '5,386' },
      { label: 'Retained by the confidence-anchored DBSCAN filter', note: '3,402' },
    ],
    files: ['csv/hotspots_filtered_3402.csv', 'csv/hotspot_retention_by_year.csv'],
    post: ['behind-the-numbers-hotspot-filtering-checks', 'How the hotspots were filtered'],
  },
  {
    key: 'frame', name: 'Spatial frame', sub: '11 sub-districts · 208 peat polygons', kicker: 'Spatial joins · Sections 4.3, 4.9',
    desc: 'The geography every hotspot is joined to: the 11 sub-districts, the peat map clipped to the regency (511,265 ha in 208 polygons, six depth classes) and a 30 m distance-to-canal raster. Each hotspot inherits its sub-district, peat depth class and distance to the nearest canal.',
    stats: [['11', 'sub-districts'], ['208', 'peat polygons'], ['511,265 ha', 'mapped peat']],
    legend: DEPTH.map((c, i) => [c, ['50–<100', '100–<200', '200–<300', '300–<500', '500–<700', '>700'][i] + ' cm']),
    files: ['csv/hotspots_by_peat_depth.csv', 'csv/hotspots_by_canal_distance.csv'],
    post: ['canals-fire-location-bengkalis', 'Canals and where fire falls'],
  },
  {
    key: 'climate', name: 'Climate & ocean', sub: '120 months · ONI, DMI, SPI-3, SPEI-3', kicker: 'Stage 2 · ENSO classification and drought indices',
    desc: 'Months count as El Niño or La Niña only inside a run of at least five consecutive months with ONI at or beyond ±0.5 °C (the NOAA rule). SPI-3 and SPEI-3 are fitted per calendar month on a 1991–2024 baseline. On the plane: monthly ONI, January 2015 at the left to December 2024 at the right.',
    stats: [['44', 'El Niño months'], ['30', 'La Niña months'], ['46', 'Neutral months']],
    legend: [[PHASE['El Nino'], 'El Niño'], [PHASE['La Nina'], 'La Niña'], [PHASE.Netral, 'Neutral']],
    files: ['csv/annual_oni_dmi_hotspots.csv', 'csv/seasonal_profile.csv'],
    post: ['enso-spi3-peatland-fire-bengkalis', 'ENSO and SPI-3'],
  },
  {
    key: 'panel', name: 'Panel', sub: '11 × 120 = 1,320 rows', kicker: 'Stage 4 · panel construction · Section 3.7',
    desc: 'Filtered hotspots counted per sub-district per month, with ONI, DMI, rainfall, temperature, SPI-3, SPEI-3 and the static covariates on the same row. Every model in the thesis is fitted to this table. On the plane: one cell per sub-district-month, brighter for more hotspots.',
    stats: [['1,320', 'sub-district-months'], ['17', 'columns'], ['3,402', 'hotspots summed']],
    files: ['csv/monthly_panel_11x120.csv'],
    post: ['space-time-structure-fire-bengkalis', 'Space-time structure'],
  },
  {
    key: 'analyses', name: 'Analyses', sub: 'statistics · ML · early warning', kicker: 'Stages 5–8',
    desc: 'Four strands of analysis run on the panel and on the hotspot table. Headline figures are from the thesis abstract.',
    items: ANALYSES.map(([a, b, slug, col]) => ({ label: a, note: b, col, slug })),
  },
  {
    key: 'outputs', name: 'Outputs', sub: `${DATASETS.length} tables, downloadable`, kicker: 'Published on this page',
    desc: 'The analysis outputs as plain CSV, each a column-renamed copy or spatial join of a thesis output. Pick one to jump to its card below.',
    items: DATASETS.map((d) => ({ label: d.title, note: `${d.rows.toLocaleString('en-US')} rows · ${d.columns.length} columns`, col: GROUP_COL[GROUP(d.file)], href: '#' + anchor(d.file) })),
  },
];

// Geometry: unit plane 0–1000 mapped to an isometric parallelogram.
const W = 880, CX = 300, A = 230, B = 96, GAP = 78, SHUT = 14, LIFT = 44, TOP = 18;
const N = LAYERS.length;

function lattice(x, y, w, h, step, col, op = 0.9, r = 9) {
  const out = [];
  for (let u = x + step / 2; u < x + w; u += step) for (let v = y + step / 2; v < y + h; v += step) out.push(<circle key={`${u}-${v}`} cx={u} cy={v} r={r} fill={col} opacity={op} />);
  return out;
}

function Content({ k, hi }) {
  if (k === 'sources' || k === 'analyses') {
    const list = k === 'sources' ? SOURCES : ANALYSES;
    const cols = k === 'sources' ? 4 : 2;
    const rows = Math.ceil(list.length / cols);
    const cw = 1000 / cols, ch = 1000 / rows;
    return list.map((s, i) => {
      const x = (i % cols) * cw + 30, y = Math.floor(i / cols) * ch + 30, w = cw - 60, h = ch - 60;
      const on = hi == null || hi === i;
      return (
        <g key={i} opacity={on ? 1 : 0.25}>
          <rect x={x} y={y} width={w} height={h} fill={s[3]} fillOpacity={hi === i ? 0.22 : 0.08} stroke={s[3]} strokeOpacity={0.6} vectorEffect="non-scaling-stroke" />
          {lattice(x, y, w, h, k === 'sources' ? 46 : 62, s[3])}
        </g>
      );
    });
  }
  if (k === 'outputs') {
    const cw = 250;
    return DATASETS.map((d, i) => {
      const s = 40 + 150 * (Math.log10(d.rows + 1) / Math.log10(3403));
      const x = (i % 4) * cw + (cw - s) / 2, y = Math.floor(i / 4) * cw + (cw - s) / 2;
      const col = GROUP_COL[GROUP(d.file)];
      return (
        <g key={i} opacity={hi == null || hi === i ? 1 : 0.25}>
          <rect x={x} y={y} width={s} height={s} fill={col} fillOpacity={hi === i ? 0.35 : 0.12} stroke={col} vectorEffect="non-scaling-stroke" />
          {lattice(x, y, s, s, 34, col, 0.85, 7)}
        </g>
      );
    });
  }
  if (k === 'hotspots') {
    return (
      <>
        {STACK.kecamatan.map((p) => <path key={p.name} d={p.d} fill="none" stroke="rgba(255,255,255,.18)" vectorEffect="non-scaling-stroke" />)}
        {STACK.points.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={5} fill={p[2] > 0 ? '#f28f3b' : '#9ca3af'} opacity={0.8} />)}
      </>
    );
  }
  if (k === 'frame') {
    return (
      <>
        {STACK.peat.map((p, i) => <path key={i} d={p.d} fill={DEPTH[p.depth - 1]} fillOpacity={0.7} stroke="none" />)}
        {STACK.kecamatan.map((p) => <path key={p.name} d={p.d} fill="none" stroke="rgba(242,237,228,.55)" vectorEffect="non-scaling-stroke" />)}
      </>
    );
  }
  if (k === 'climate') {
    const { oni, phase } = STACK.panel;
    const bw = 1000 / 120, s = 500 / 2.8;
    return (
      <>
        <line x1={0} x2={1000} y1={500} y2={500} stroke="rgba(255,255,255,.3)" vectorEffect="non-scaling-stroke" />
        {oni.map((v, i) => <rect key={i} x={i * bw + 1} width={bw - 2} y={v >= 0 ? 500 - v * s : 500} height={Math.max(2, Math.abs(v) * s)} fill={PHASE[phase[i]]} opacity={0.9} />)}
        {Array.from({ length: 11 }, (_, i) => <line key={i} x1={i * 100} x2={i * 100} y1={60} y2={940} stroke="rgba(255,255,255,.07)" vectorEffect="non-scaling-stroke" />)}
      </>
    );
  }
  if (k === 'panel') {
    const { counts } = STACK.panel;
    const cw = 1000 / 120, ch = 1000 / counts.length;
    const mx = Math.log1p(183);
    return counts.flatMap((row, r) => row.map((c, t) => (
      <rect key={`${r}-${t}`} x={t * cw + 0.6} y={r * ch + 6} width={cw - 1.2} height={ch - 12} fill={c ? TEAL : 'rgba(255,255,255,.05)'} fillOpacity={c ? 0.18 + 0.82 * Math.log1p(c) / mx : 1} />
    )));
  }
  return null;
}

export default function DataStack({ base = '' }) {
  const [active, setActive] = useState(4);
  const [open, setOpen] = useState(true);
  const [hi, setHi] = useState(null);
  const [reduce, setReduce] = useState(false);
  const [ready, setReady] = useState(false); // dense planes are drawn client-side only, to keep the page HTML small
  useEffect(() => {
    setReady(true);
    const m = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (m) setReduce(m.matches);
  }, []);
  useEffect(() => setHi(null), [active]);

  const gap = open ? GAP : SHUT;
  const lift = open && active != null ? LIFT : 0;
  const H = TOP + 2 * B + (N - 1) * gap + lift + 24;
  const yOf = (i) => TOP + (N - 1 - i) * gap + (i > active ? 0 : lift);
  const L = active != null ? LAYERS[active] : null;
  const move = (d) => setActive((a) => Math.min(N - 1, Math.max(0, (a ?? 0) + d)));
  const tr = reduce ? 'none' : 'transform .55s cubic-bezier(.2,.7,.2,1), opacity .35s';

  return (
    <figure className="ds-wrap" aria-label="Thesis data structure as a stack of layers">
      <div className="ds-bar">
        <div className="ds-tabs" role="tablist" aria-label="Layers">
          {LAYERS.map((l, i) => (
            <button key={l.key} role="tab" aria-selected={active === i} className={active === i ? 'on' : ''} onClick={() => setActive(i)}>
              <span>{String(i + 1).padStart(2, '0')}</span>{l.name}
            </button>
          ))}
        </div>
        <div className="ds-ctl">
          <button onClick={() => move(-1)} aria-label="Layer below">↓</button>
          <button onClick={() => move(1)} aria-label="Layer above">↑</button>
          <button onClick={() => setOpen((o) => !o)} aria-pressed={open}>{open ? 'Stack' : 'Explode'}</button>
        </div>
      </div>

      <div className="ds-body">
        <svg viewBox={`0 0 ${W} ${H}`} className="ds-svg" role="img" aria-label="Seven layers from raw sources at the bottom to published tables at the top" style={{ transition: reduce ? 'none' : 'height .5s' }}>
          <defs>
            <pattern id="ds-dots" width="50" height="50" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="3" fill="rgba(255,255,255,.12)" /></pattern>
          </defs>
          <g className="ds-flow">
            <line x1={34} x2={34} y1={H - 40} y2={30} stroke="rgba(255,255,255,.18)" strokeDasharray="3 5" />
            <path d={`M28,40 L34,28 L40,40`} fill="none" stroke="rgba(255,255,255,.35)" />
            <text x={46} y={36} className="ds-flowt">data flows up</text>
          </g>
          {LAYERS.map((l, i) => {
            const y = yOf(i), on = active == null || active === i;
            return (
              <g key={l.key} style={{ transform: `translateY(${y}px)`, transition: tr, opacity: on ? 1 : 0.55, cursor: 'pointer' }} onClick={() => setActive(i)}>
                <g transform={`matrix(${A / 1000},${B / 1000},${-A / 1000},${B / 1000},${CX},0)`}>
                  <rect x={0} y={0} width={1000} height={1000} fill="#121417" fillOpacity={0.62} stroke={active === i ? TEAL : 'rgba(255,255,255,.16)'} strokeWidth={active === i ? 1.5 : 1} vectorEffect="non-scaling-stroke" />
                  <rect x={0} y={0} width={1000} height={1000} fill="url(#ds-dots)" />
                  {ready && <Content k={l.key} hi={active === i ? hi : null} />}
                </g>
                {(open || active === i) && (
                  <>
                    <line x1={CX + A + 6} x2={CX + A + 46} y1={B} y2={B} stroke={active === i ? TEAL : 'rgba(255,255,255,.3)'} />
                    <circle cx={CX + A + 6} cy={B} r={2.5} fill={active === i ? TEAL : 'rgba(255,255,255,.5)'} />
                    <text x={CX + A + 54} y={B - 3} className={`ds-lbl${active === i ? ' on' : ''}`}><tspan className="ds-num">{String(i + 1).padStart(2, '0')}</tspan> {l.name}</text>
                    <text x={CX + A + 54} y={B + 15} className="ds-lbl-sub">{l.sub}</text>
                  </>
                )}
              </g>
            );
          })}
        </svg>

        <aside className="ds-panel" aria-live="polite">
          {L && (
            <>
              <p className="ds-kick">{String(active + 1).padStart(2, '0')} · {L.kicker}</p>
              <h3>{L.name}</h3>
              <p className="ds-desc">{L.desc}</p>
              {L.stats && <div className="ds-stats">{L.stats.map(([v, t]) => <div key={t}><b>{v}</b><span>{t}</span></div>)}</div>}
              {L.legend && <div className="ds-legend">{L.legend.map(([c, t]) => <span key={t}><i style={{ background: c }} />{t}</span>)}</div>}
              {L.items && (
                <ol className={`ds-items${L.key === 'hotspots' ? ' funnel' : ''}`}>
                  {L.items.map((it, j) => {
                    const hov = { onMouseEnter: () => setHi(j), onMouseLeave: () => setHi(null), onFocus: () => setHi(j), onBlur: () => setHi(null) };
                    const inner = <>{it.col && <i style={{ background: it.col }} />}<span><b>{it.label}</b><small>{it.note}</small></span></>;
                    return (
                      <li key={j}>
                        {it.href ? <a href={it.href} {...hov}>{inner}</a>
                          : it.slug ? <a href={`${base}/${it.slug}`} {...hov}>{inner}</a>
                          : <div tabIndex={L.key === 'hotspots' ? undefined : 0} {...(L.key === 'hotspots' ? {} : hov)}>{inner}</div>}
                      </li>
                    );
                  })}
                </ol>
              )}
              {L.files && (
                <p className="ds-files">
                  {L.files.map((f) => <a key={f} href={'#' + anchor(f)}>{f.replace(/^csv\//, '')}</a>)}
                </p>
              )}
              {L.post && <p className="ds-post"><a href={`${base}/${L.post[0]}`}>Read: {L.post[1]} →</a></p>}
            </>
          )}
        </aside>
      </div>
      <figcaption>
        The thesis data from bottom to top: the source datasets of Table 3.2, the filtered hotspots, the spatial frame they are joined to,
        the climate and ocean indices, the sub-district × month panel, the analyses run on it, and the tables published here.
        The hotspot, peat, sub-district, ONI and panel planes are drawn from the files on this page; the source, analysis and output planes are schematic.
        Pick a layer to lift it out of the stack.
      </figcaption>
    </figure>
  );
}
