// Exact re-implementation of the study's filter, fast enough to rerun on every slider move.
// min_samples = 1 makes DBSCAN equal to single-linkage clustering: anchors closer than eps (haversine) end up in one cluster.
// A medium-confidence point is rescued when its nearest anchor is within eps.
const R = 6371, RAD = Math.PI / 180, MAX_EPS = 5;

function hav(lon1, lat1, lon2, lat2) {
  const a = Math.sin(((lat2 - lat1) * RAD) / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(((lon2 - lon1) * RAD) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function prepare(raw) {
  const n = raw.c.length;
  return { n, lon: raw.x.map((v) => v / 1e4), lat: raw.y.map((v) => v / 1e4), conf: raw.c, month: raw.m };
}

export function analyze(P, thr, maxEps = MAX_EPS) {
  const { n, lon, lat, conf } = P;
  const tier = new Int8Array(n); // 2 anchor, 1 medium, 0 low
  const A = [], M = [];
  for (let i = 0; i < n; i++) { if (conf[i] >= thr) { tier[i] = 2; A.push(i); } else if (conf[i] >= 50) { tier[i] = 1; M.push(i); } }
  const cell = maxEps / 111, key = (cx, cy) => cx * 100003 + cy, grid = new Map();
  for (const i of A) { const k = key(Math.floor(lon[i] / cell), Math.floor(lat[i] / cell)); (grid.get(k) || grid.set(k, []).get(k)).push(i); }
  const near = (i, fn) => {
    const cx = Math.floor(lon[i] / cell), cy = Math.floor(lat[i] / cell);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const b = grid.get(key(cx + dx, cy + dy)); if (b) for (const j of b) fn(j); }
  };
  const edges = [];
  for (const i of A) near(i, (j) => { if (j > i) { const d = hav(lon[i], lat[i], lon[j], lat[j]); if (d <= maxEps) edges.push([d, i, j]); } });
  edges.sort((a, b) => a[0] - b[0]);
  const nn = new Float64Array(n).fill(Infinity);
  for (const i of M) near(i, (j) => { const d = hav(lon[i], lat[i], lon[j], lat[j]); if (d < nn[i]) nn[i] = d; });
  return { thr, tier, A, M, edges, nn, nLow: n - A.length - M.length };
}

export function at(P, S, eps) {
  const { n } = P, par = new Int32Array(n).map((_, i) => i);
  const find = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  for (const e of S.edges) { if (e[0] > eps) break; const a = find(e[1]), b = find(e[2]); if (a !== b) par[a] = b; }
  const cl = new Int32Array(n).fill(-1), size = new Map();
  for (const i of S.A) { const r = find(i); size.set(r, (size.get(r) || 0) + 1); }
  const order = [...size.entries()].sort((a, b) => b[1] - a[1]), id = new Map(order.map(([r], k) => [r, k]));
  for (const i of S.A) cl[i] = id.get(find(i));
  const rescued = new Uint8Array(n); let nr = 0;
  for (const i of S.M) if (S.nn[i] <= eps) { rescued[i] = 1; nr++; }
  return { cl, clusters: order.length, sizes: order.map((o) => o[1]), rescued, nRescued: nr, kept: S.A.length + nr, discarded: P.n - S.A.length - nr };
}

// kept points and cluster count for a grid of eps values, in one pass over the sorted edges
export function curve(P, S, grid) {
  const { n } = P, par = new Int32Array(n).map((_, i) => i);
  const find = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  let comps = S.A.length, e = 0; const nnSorted = S.M.map((i) => S.nn[i]).sort((a, b) => a - b), out = []; let r = 0;
  for (const eps of grid) {
    while (e < S.edges.length && S.edges[e][0] <= eps) { const a = find(S.edges[e][1]), b = find(S.edges[e][2]); if (a !== b) { par[a] = b; comps--; } e++; }
    while (r < nnSorted.length && nnSorted[r] <= eps) r++;
    out.push({ eps, clusters: comps, kept: S.A.length + r });
  }
  return out;
}
