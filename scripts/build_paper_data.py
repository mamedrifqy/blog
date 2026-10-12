#!/usr/bin/env python3
"""Build src/data/bengkalis-paper.json for the paper post.

Source: the riau-peatland-fire repository (https://github.com/mamedrifqy/riau-peatland-fire).
Usage:  python3 scripts/build_paper_data.py /path/to/riau-peatland-fire

Everything is recomputed from data/bengkalis_hotspots_filtered.csv (3,536 DBSCAN-filtered MODIS points)
and the ONI series. The only transcribed values are the SPI-3 correlations (Table 4 of the manuscript),
because the CHIRPS rainfall needed to recompute SPI-3 is not part of that repository; they are flagged
as 'manuscript' in the output.
"""
import csv, json, sys, subprocess, pathlib
import numpy as np
from scipy.stats import spearmanr, kruskal, rankdata, norm

R = pathlib.Path(sys.argv[1]); OUT = pathlib.Path(__file__).resolve().parent.parent / "src" / "data" / "bengkalis-paper.json"
rows = list(csv.DictReader(open(R / "data/bengkalis_hotspots_filtered.csv")))
bk = json.load(open(R / "data/bengkalis_thesis.json"))
geo = json.loads((lambda s: s[s.index("{"):s.rindex("}") + 1])(open(R / "assets/bengkalis-geo.js").read()))
months = [f"{y}-{m:02d}" for y in range(2015, 2025) for m in range(1, 13)]; mi = {m: i for i, m in enumerate(months)}
kecs = sorted(geo["kecamatan"]); P = {k: np.zeros(120, int) for k in kecs}
for r in rows: P[r["kecamatan"]][mi[r["date"][:7]]] += 1
oni = np.array(json.loads(subprocess.check_output(["node", "-e", f'global.window={{}};require("{R}/assets/data.js");console.log(JSON.stringify(window.RIAU.oni))'])))
tot = sum(P.values())

# NOAA rule: >= 5 consecutive months at +/-0.5
ph = np.array(["N"] * 120, dtype=object)
def runs(mask, lab):
    i = 0
    while i < 120:
        if mask[i]:
            j = i
            while j < 120 and mask[j]: j += 1
            if j - i >= 5: ph[i:j] = lab
            i = j
        else: i += 1
runs(oni >= .5, "E"); runs(oni <= -.5, "L")

# Kruskal-Wallis + tie-corrected Dunn (BH) on 11 x 120 kecamatan-months
g = {k: np.concatenate([P[c][ph == k] for c in kecs]) for k in "LNE"}
H, p = kruskal(g["L"], g["N"], g["E"]); N = sum(map(len, g.values())); eta = (H - 2) / (N - 3)
allv = np.concatenate([g[k] for k in "LNE"]); rk = rankdata(allv); off = 0; mr = {}
for k in "LNE": n = len(g[k]); mr[k] = rk[off:off + n].mean(); off += n
_, c = np.unique(allv, return_counts=True); s2 = N * (N + 1) / 12 - (c ** 3 - c).sum() / (12 * (N - 1))
pairs = [("L", "N", "La Niña vs Neutral"), ("L", "E", "La Niña vs El Niño"), ("N", "E", "Neutral vs El Niño")]
raw = np.array([2 * norm.sf(abs((mr[a] - mr[b]) / np.sqrt(s2 * (1 / len(g[a]) + 1 / len(g[b]))))) for a, b, _ in pairs])
o = np.argsort(raw); adj = np.empty(3); prev = 1.0
for r_, i in reversed(list(enumerate(o))): prev = min(prev, raw[i] * 3 / (r_ + 1)); adj[i] = prev
phase_stats = {}
for k, nm in zip("LNE", ["La Niña", "Neutral", "El Niño"]):
    v = g[k]; phase_stats[nm] = dict(n=int(len(v)), months=int((ph == k).sum()), mean=float(v.mean()), median=float(np.median(v)),
                                     p95=float(np.percentile(v, 95)), max=int(v.max()), meanRank=float(mr[k]))
# seasonal split
mon = np.array([i % 12 + 1 for i in range(120)]); dry = (mon >= 6) & (mon <= 9); seas = {}
for nm, m in (("dry", dry), ("rainy", ~dry)):
    h = np.concatenate([P[k][m] for k in kecs]); oo = np.concatenate([oni[m] for k in kecs]); pp = np.concatenate([ph[m] for k in kecs])
    Hs, ps = kruskal(*[h[pp == x] for x in "LNE"]); seas[nm] = dict(n=int(len(h)), rho=float(spearmanr(oo, h)[0]), H=float(Hs), p=float(ps), eta2=float((Hs - 2) / (len(h) - 3)))
# calendar-month totals by ENSO phase
cal = {nm: [0] * 12 for nm in ("La Niña", "Neutral", "El Niño")}; nmap = {"L": "La Niña", "N": "Neutral", "E": "El Niño"}
for i in range(120): cal[nmap[ph[i]]][i % 12] += int(tot[i])

# ONI correlations on the 118 months that also have an SPI-3 value (first two months have no 3-month window)
spi = {"Bandar Laksamana": (-0.4232, 0.0000), "Bantan": (-0.2565, 0.0075), "Bathin Solapan": (-0.2794, 0.0037), "Bengkalis": (-0.4474, 0.0000),
       "Bukit Batu": (-0.3044, 0.0018), "Mandau": (-0.2021, 0.0365), "Pinggir": (-0.1774, 0.0601), "Rupat": (-0.4712, 0.0000),
       "Rupat Utara": (-0.3350, 0.0006), "Siak Kecil": (-0.4446, 0.0000), "Talang Muandau": (-0.4003, 0.0000)}
def bh(ps):
    ps = np.array(ps); o = np.argsort(ps); m = len(ps); a = np.empty(m); prev = 1.0
    for r_, i in reversed(list(enumerate(o))): prev = min(prev, ps[i] * m / (r_ + 1)); a[i] = prev
    return a
on = {k: spearmanr(oni[2:], P[k][2:]) for k in kecs}
# FDR-adjusted ONI p-values: the manuscript adjusts across 22 tests (11 ONI + 11 SPI-3); raw p-values above are recomputed and match Table 4
oni_adj = {"Bandar Laksamana": 0.0018, "Bantan": 0.0304, "Bathin Solapan": 0.0367, "Bengkalis": 0.0036, "Bukit Batu": 0.0037, "Mandau": 0.1005,
           "Pinggir": 0.1444, "Rupat": 0.0006, "Rupat Utara": 0.0439, "Siak Kecil": 0.0, "Talang Muandau": 0.0075}
out_k = {}
for k in kecs:
    gk = geo["kecamatan"][k]; yr = [0] * 10
    inpeat = next(x for x in bk["kecamatan"] if x["name"] == k)
    out_k[k] = dict(d=gk["d"], cx=gk["cx"], cy=gk["cy"], total=int(P[k].sum()), inPeat=inpeat["inPeat"],
                    rhoOni=float(on[k][0]), pOni=float(on[k][1]), pOniAdj=float(oni_adj[k]),
                    rhoSpi=spi[k][0], pSpiAdj=spi[k][1], monthly=P[k].tolist())
pr = geo["proj"]; pts = []
for r in rows:
    lon, lat = float(r["lon"]), float(r["lat"])
    pts.append([round((lon - pr["minx"]) * pr["k"] * pr["S"], 1), round((pr["maxy"] - lat) * pr["S"], 1), int(r["date"][:4]), 1 if r["class"] == "anchor" else 0])
pool_h = np.concatenate([P[k][2:] for k in kecs]); pool_o = np.concatenate([oni[2:] for k in kecs])
zeros = float(np.mean(np.concatenate([P[k] for k in kecs]) == 0))
doc = dict(
    w=geo["w"], h=geo["h"], months=months, oni=oni.tolist(), phase=ph.tolist(), regency=tot.tolist(), kec=out_k, points=pts,
    kruskal=dict(H=float(H), p=float(p), eta2=float(eta), n=int(N)),
    dunn=[dict(pair=nm, p=float(a), padj=float(b)) for (_, _, nm), a, b in zip(pairs, raw, adj)],
    phaseStats=phase_stats, seasons=seas, calendar=cal, zeroShare=zeros,
    pooledOni=dict(rho=float(spearmanr(pool_o, pool_h)[0]), n=int(len(pool_h))),
    aggregateOni=dict(rho=float(spearmanr(oni[2:], tot[2:])[0]), n=118),
    years=bk["years"], peaks=bk["peaks"], funnel=dict(raw=5603, anchor=2388, medium=1402, low=1813, rescued=1148, final=3536, clusters=137),
    sensitivity=[dict(label="all confidences", n=5603), dict(label="≥ 30%", n=4981), dict(label="≥ 50%", n=3790), dict(label="≥ 80%", n=1725), dict(label="anchors + rescue (DBSCAN)", n=3536)],
    note="rhoSpi / pSpiAdj / pOniAdj are transcribed from Table 4 of the manuscript (CHIRPS not available here); everything else is recomputed from the 3,536 filtered points.")
OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
print("ok", OUT.stat().st_size, "bytes; zeros", round(zeros, 3), "H", round(H, 2), "adj", adj)
