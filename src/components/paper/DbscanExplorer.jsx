import { useEffect, useMemo, useRef, useState } from 'react';
import raw from '../../data/dbscan-points.json';
import { D, fmt, MN } from './shared.js';
import { prepare, analyze, at, curve } from './dbscan.js';

// projection constants of the kecamatan outlines (same as KecMap)
const PROJ = { minx: 100.96788273000004, maxy: 2.125813735000065, k: 0.9996463924649783, S: 649.5602740212846 };
const KM = PROJ.S / 111.19; // map units per km
const proj = (lon, lat) => [(lon - PROJ.minx) * PROJ.k * PROJ.S, (PROJ.maxy - lat) * PROJ.S];
const C = { anchor: '#1cc8aa', medium: '#f0bc2e', low: '#6c7480', drop: '#e8533a' };
const HUES = [190, 285, 38, 150, 330, 215, 80, 260, 170, 60];
const clColor = (k) => `hsl(${HUES[k % HUES.length]} 70% ${k < 10 ? 58 : 66}%)`;
const STEPS = [
  ['Raw detections', 'raw'],
  ['Sort by confidence', 'conf'],
  ['Chain the anchors', 'cluster'],
  ['Rescue the neighbours', 'rescue'],
  ['What is kept', 'final'],
];
const EPSG = Array.from({ length: 20 }, (_, i) => (i + 1) * 0.25);

export default function DbscanExplorer() {
  const P = useMemo(() => prepare(raw), []);
  const XY = useMemo(() => P.lon.map((lo, i) => proj(lo, P.lat[i])), [P]);
  const [step, setStep] = useState(1);
  const [thr, setThr] = useState(70);
  const [eps, setEps] = useState(1.5);
  const [view, setView] = useState({ cx: D.w / 2, cy: D.h / 2, z: 1 });
  const [hover, setHover] = useState(null);
  const S = useMemo(() => analyze(P, thr), [P, thr]);
  const R = useMemo(() => at(P, S, eps), [P, S, eps]);
  const crv = useMemo(() => curve(P, S, EPSG), [P, S]);
  const cv = useRef(null), wrap = useRef(null), paths = useRef(null), mouse = useRef(null), drag = useRef(null), raf = useRef(0);
  const [size, setSize] = useState(700);

  useEffect(() => { paths.current = Object.values(D.kec).map((k) => new Path2D(k.d)); }, []);
  useEffect(() => {
    const ro = new ResizeObserver((e) => setSize(Math.max(280, Math.round(e[0].contentRect.width))));
    ro.observe(wrap.current); return () => ro.disconnect();
  }, []);

  const H = Math.round(size * (D.h / D.w));
  const sc = (size / D.w) * view.z;
  const toScr = (u, v) => [(u - view.cx) * sc + size / 2, (v - view.cy) * sc + H / 2];

  // what each point looks like at the current step
  const look = (i) => {
    const t = S.tier[i];
    if (step === 0) return { c: C.medium, a: 0.6, r: 2 };
    if (step === 1) return t === 2 ? { c: C.anchor, a: 0.85, r: 2.4 } : t === 1 ? { c: C.medium, a: 0.8, r: 2.2 } : { c: C.low, a: 0.5, r: 1.8 };
    if (step === 2) return t === 2 ? { c: clColor(R.cl[i]), a: 0.95, r: 2.6 } : { c: C.low, a: 0.28, r: 1.6 };
    if (step === 3) return t === 2 ? { c: C.anchor, a: 0.85, r: 2.4 } : t === 1 && R.rescued[i] ? { c: C.medium, a: 1, r: 3 } : { c: C.drop, a: 0.35, r: 1.7 };
    return t === 2 ? { c: C.anchor, a: 0.85, r: 2.4 } : t === 1 && R.rescued[i] ? { c: C.medium, a: 0.9, r: 2.4 } : null;
  };

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const c = cv.current; if (!c || !paths.current) return;
      const dpr = window.devicePixelRatio || 1; c.width = size * dpr; c.height = H * dpr;
      const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, size, H);
      x.save(); x.translate(size / 2 - view.cx * sc, H / 2 - view.cy * sc); x.scale(sc, sc);
      x.fillStyle = '#16191b'; x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = 1 / sc;
      for (const p of paths.current) { x.fill(p); x.stroke(p); }
      x.restore();
      // draw dim points first so the kept ones sit on top
      const order = []; for (let i = 0; i < P.n; i++) { const l = look(i); if (l) order.push([i, l]); }
      order.sort((a, b) => a[1].a - b[1].a);
      for (const [i, l] of order) {
        const [px, py] = toScr(XY[i][0], XY[i][1]); if (px < -6 || py < -6 || px > size + 6 || py > H + 6) continue;
        x.globalAlpha = l.a; x.fillStyle = l.c; x.beginPath(); x.arc(px, py, l.r * (view.z > 8 ? 1.5 : 1), 0, 6.2832); x.fill();
        if (step === 3 && S.tier[i] === 1 && R.rescued[i]) { x.globalAlpha = 0.9; x.strokeStyle = '#fff'; x.lineWidth = 0.8; x.stroke(); }
      }
      x.globalAlpha = 1;
      const m = mouse.current;
      if (m && (step === 2 || step === 3)) { // eps ring: this is the reach of one anchor
        x.strokeStyle = '#f2ede4'; x.setLineDash([4, 3]); x.lineWidth = 1; x.beginPath(); x.arc(m[0], m[1], eps * KM * sc, 0, 6.2832); x.stroke(); x.setLineDash([]);
      }
    });
    return () => cancelAnimationFrame(raf.current);
  }, [P, XY, S, R, step, size, view, eps, hover]);

  const onMove = (e) => {
    const r = cv.current.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    if (drag.current) {
      const d = drag.current; if (Math.abs(mx - d.x) + Math.abs(my - d.y) > 4) d.moved = true;
      if (d.moved) setView((v) => ({ ...v, cx: d.cx - (mx - d.x) / sc, cy: d.cy - (my - d.y) / sc }));
      return;
    }
    mouse.current = [mx, my];
    let best = null, bd = 100;
    for (let i = 0; i < P.n; i++) { if (!look(i)) continue; const [px, py] = toScr(XY[i][0], XY[i][1]); const d = (px - mx) ** 2 + (py - my) ** 2; if (d < bd) { bd = d; best = i; } }
    setHover(best == null ? { x: mx, y: my } : { x: mx, y: my, i: best });
  };
  const onDown = (e) => { const r = cv.current.getBoundingClientRect(); drag.current = { x: e.clientX - r.left, y: e.clientY - r.top, cx: view.cx, cy: view.cy, moved: false }; cv.current.setPointerCapture(e.pointerId); };
  const onUp = (e) => {
    const d = drag.current; drag.current = null;
    if (d && !d.moved && view.z === 1) { const r = cv.current.getBoundingClientRect(); setView({ cx: view.cx + (e.clientX - r.left - size / 2) / sc, cy: view.cy + (e.clientY - r.top - H / 2) / sc, z: 8 }); }
  };
  const zoomTo = (z) => setView((v) => (z === 1 ? { cx: D.w / 2, cy: D.h / 2, z: 1 } : { ...v, z }));
  const toBiggest = () => {
    const ids = S.A.filter((i) => R.cl[i] === 0); if (!ids.length) return;
    const cx = ids.reduce((s, i) => s + XY[i][0], 0) / ids.length, cy = ids.reduce((s, i) => s + XY[i][1], 0) / ids.length;
    const ext = Math.max(...ids.map((i) => Math.hypot(XY[i][0] - cx, XY[i][1] - cy)));
    setView({ cx, cy, z: Math.max(2, Math.min(40, (D.w * 0.4) / Math.max(ext, 6))) });
  };
  const reset = () => { setThr(70); setEps(1.5); };
  const isDefault = thr === 70 && eps === 1.5;
  const medLabel = thr > 50 ? `${50}–${thr - 1}%` : 'none';
  const hp = hover && hover.i != null ? hover.i : null;
  const info = hp == null ? null : (() => { const t = S.tier[hp]; const m = P.month[hp];
    return `${MN[m % 12]} ${2015 + Math.floor(m / 12)} · confidence ${P.conf[hp]}% · ` + (t === 2 ? `anchor, cluster #${R.cl[hp] + 1}` : t === 1 ? (R.rescued[hp] ? `medium, rescued (anchor ${S.nn[hp].toFixed(2)} km away)` : `medium, dropped (${isFinite(S.nn[hp]) ? S.nn[hp].toFixed(1) + ' km from nearest anchor' : 'no anchor nearby'})`) : 'low, dropped'); })();

  const desc = [
    `Every MODIS detection inside Bengkalis from 2015 to 2024: ${fmt(P.n)} points. Each one is a pixel that looked hot to the satellite, whether or not something was burning.`,
    `Each detection carries a confidence from 0 to 100. At ${thr}% and above a point is an <b>anchor</b> (${fmt(S.A.length)}). Between ${medLabel} it is a <b>candidate</b> (${fmt(S.M.length)}). Below 50% it is set aside (${fmt(S.nLow)}).`,
    `Anchors closer than ${eps} km to each other are chained into one fire cluster: ${fmt(R.clusters)} clusters, the largest with ${fmt(R.sizes[0] || 0)} anchors. Hover to see the ${eps} km reach of a point.`,
    `A candidate is <b>rescued</b> when an anchor lies within ${eps} km of it: ${fmt(R.nRescued)} of ${fmt(S.M.length)} are kept. The rest are dropped as likely noise (flares, industrial heat, bare hot ground).`,
    `Result: ${fmt(S.A.length)} anchors + ${fmt(R.nRescued)} rescued = <b>${fmt(R.kept)}</b> points kept. ${fmt(R.discarded)} (${Math.round((R.discarded / P.n) * 100)}%) are discarded.`,
  ];

  return (
    <figure className="pp-fig pp-wide pp-db">
      <div className="pp-db-grid">
        <div>
          <div className="pp-db-map" ref={wrap} style={{ height: H }}>
            <canvas ref={cv} style={{ width: size, height: H }} onPointerMove={onMove} onPointerDown={onDown} onPointerUp={onUp}
              onPointerLeave={() => { mouse.current = null; setHover(null); drag.current = null; }} role="img"
              aria-label="Map of Bengkalis showing each hotspot detection as it moves through the DBSCAN filter." />
            {info && <div className="pp-db-tip" style={{ left: Math.min(hover.x + 12, size - 230), top: Math.max(hover.y - 40, 4) }}>{info}</div>}
          </div>
          <div className="pp-db-zoom" role="group" aria-label="Zoom">
            {[[1, 'Whole regency'], [4, '4×'], [12, '12×'], [30, '30×']].map(([z, l]) => <button key={z} type="button" aria-pressed={view.z === z} onClick={() => zoomTo(z)}>{l}</button>)}
            <button type="button" onClick={toBiggest}>Largest cluster</button>
            <span>{view.z === 1 ? 'Click the map to zoom in; drag to pan.' : 'Drag to pan.'}</span>
          </div>
          <div className="pp-legend pp-db-leg">
            <span><i style={{ background: C.anchor }} />anchor</span><span><i style={{ background: C.medium }} />candidate / rescued</span>
            <span><i style={{ background: C.low }} />low confidence</span><span><i style={{ background: C.drop }} />dropped candidate</span>
          </div>
        </div>
        <aside className="pp-db-side">
          <ol className="pp-db-steps">
            {STEPS.map(([t], i) => <li key={t}><button type="button" aria-pressed={step === i} aria-current={step === i ? 'step' : undefined} onClick={() => setStep(i)}><span>{i + 1}</span>{t}</button></li>)}
          </ol>
          <p className="pp-db-desc" aria-live="polite" dangerouslySetInnerHTML={{ __html: desc[step] }} />
          <div className="pp-db-sliders">
            <label><span>Anchor threshold <b>{thr}%</b></span><input type="range" min="60" max="90" step="5" value={thr} onChange={(e) => setThr(+e.target.value)} /></label>
            <label><span>Radius (eps) <b>{eps.toFixed(2)} km</b></span><input type="range" min="0.25" max="5" step="0.25" value={eps} onChange={(e) => setEps(+e.target.value)} /></label>
            <button type="button" className="pp-db-reset" onClick={reset} disabled={isDefault}>Reset to the study's settings</button>
            <p className="pp-mini">{isDefault ? 'These are the study’s settings: 70% and 1.5 km give 3,536 points.' : `With these settings ${fmt(R.kept)} points are kept (the study keeps 3,536).`}</p>
          </div>
        </aside>
      </div>
      <div className="pp-db-count" aria-label="Counts at each stage">
        {[['Detections', P.n, C.medium], ['Anchors', S.A.length, C.anchor], ['Candidates', S.M.length, C.medium], ['Rescued', R.nRescued, C.medium], ['Kept', R.kept, '#f2ede4'], ['Discarded', R.discarded, C.drop]].map(([l, v, c]) => (
          <div key={l}><b style={{ color: c }}>{fmt(v)}</b><span>{l}</span></div>
        ))}
        <div><b>{fmt(R.clusters)}</b><span>Clusters</span></div>
      </div>
      <div className="pp-db-charts">
        <Hist P={P} thr={thr} />
        <Sens crv={crv} eps={eps} thr={thr} setEps={setEps} />
      </div>
      <figcaption>All {fmt(P.n)} MODIS detections inside the Bengkalis boundary, 2015–2024. The filter is recomputed in your browser on every change, with haversine distances and the same rules as the study.</figcaption>
    </figure>
  );
}

function Hist({ P, thr }) {
  const bins = Array.from({ length: 21 }, () => 0); P.conf.forEach((c) => { bins[Math.min(20, Math.floor(c / 5))]++; });
  const W = 340, H = 150, L = 30, B = 22, T = 12, bw = (W - L - 6) / 21, max = Math.max(...bins);
  const col = (b) => (b * 5 >= thr ? C.anchor : b * 5 >= 50 ? C.medium : C.low);
  return (
    <div>
      <h5>Confidence of the {fmt(P.n)} detections</h5>
      <svg viewBox={`0 0 ${W} ${H}`} className="pp-db-chart" role="img" aria-label="Histogram of MODIS confidence values with the anchor and candidate bands.">
        {bins.map((v, b) => { const h = (v / max) * (H - B - T); return <rect key={b} x={L + b * bw + 1} y={H - B - h} width={bw - 2} height={h} fill={col(b)} opacity=".9"><title>{`${b * 5}–${b === 20 ? 100 : b * 5 + 4}%: ${v} points`}</title></rect>; })}
        <line x1={L + (50 / 5) * bw} x2={L + (50 / 5) * bw} y1={T - 4} y2={H - B} className="pp-db-mark" />
        <line x1={L + (thr / 5) * bw} x2={L + (thr / 5) * bw} y1={T - 4} y2={H - B} className="pp-db-mark" />
        <text x={L + (50 / 5) * bw - 3} y={T} textAnchor="end" className="pp-tick">50</text><text x={L + (thr / 5) * bw + 3} y={T} className="pp-tick">{thr}</text>
        {[0, 25, 50, 75, 100].map((t) => <text key={t} x={L + (t / 5) * bw} y={H - 6} textAnchor="middle" className="pp-tick">{t}</text>)}
        <text x="4" y={T + 8} className="pp-tick">{fmt(max)}</text>
      </svg>
    </div>
  );
}

function Sens({ crv, eps, thr, setEps }) {
  const W = 340, H = 150, L = 36, Rm = 38, B = 22, T = 12;
  const kmin = Math.min(...crv.map((d) => d.kept)), kmax = Math.max(...crv.map((d) => d.kept)), cmax = Math.max(...crv.map((d) => d.clusters));
  const x = (e) => L + ((e - 0.25) / 4.75) * (W - L - Rm), yk = (k) => T + (1 - (k - kmin * 0.97) / (kmax * 1.02 - kmin * 0.97)) * (H - B - T), yc = (c) => T + (1 - c / cmax) * (H - B - T);
  const pick = (ev) => { const r = ev.currentTarget.getBoundingClientRect(), e = 0.25 + ((ev.clientX - r.left) / r.width * W - L) / (W - L - Rm) * 4.75; setEps(Math.max(0.25, Math.min(5, Math.round(e * 4) / 4))); };
  return (
    <div>
      <h5>How much does the radius matter? (anchors at {thr}%)</h5>
      <svg viewBox={`0 0 ${W} ${H}`} className="pp-db-chart pp-db-click" onClick={pick} role="img" aria-label="Kept points and cluster count as a function of the radius. Click to set the radius.">
        <polyline points={crv.map((d) => `${x(d.eps)},${yc(d.clusters)}`).join(' ')} fill="none" stroke={C.medium} strokeWidth="2" strokeDasharray="4 3" />
        <polyline points={crv.map((d) => `${x(d.eps)},${yk(d.kept)}`).join(' ')} fill="none" stroke="#f2ede4" strokeWidth="2.2" />
        <line x1={x(eps)} x2={x(eps)} y1={T - 4} y2={H - B} className="pp-db-mark" />
        {[1, 2, 3, 4, 5].map((t) => <text key={t} x={x(t)} y={H - 6} textAnchor="middle" className="pp-tick">{t} km</text>)}
        <text x="2" y={yk(kmax) + 4} className="pp-tick" fill="#f2ede4">{fmt(kmax)}</text><text x="2" y={yk(kmin) + 4} className="pp-tick" fill="#f2ede4">{fmt(kmin)}</text>
      </svg>
      <p className="pp-legend"><span><i style={{ background: '#f2ede4' }} />points kept</span><span><i style={{ background: C.medium }} />clusters ({fmt(crv[0].clusters)} at 0.25 km, {crv[crv.length - 1].clusters} at 5 km)</span></p>
    </div>
  );
}
