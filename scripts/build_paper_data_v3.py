#!/usr/bin/env python3
"""Rebuild src/data/bengkalis-paper.json from the thesis-notebook v3 export (blog_export_v3).

Usage:  python3 scripts/build_paper_data_v3.py <export_dir> <assigned_points.csv>

<export_dir>      unzipped blog_export_v3 (df_final.csv, df_oni.csv, filter_report.json, fire_by_depth.csv)
<assigned_points> hotspot_filtered_v3_assigned.csv: the 3,402 DBSCAN-filtered points with kecamatan, in_peat, class
                  (data/bengkalis_hotspots_filtered_v3.csv)

Changes vs build_paper_data.py (3,536 points, manuscript SPI-3):
  * TYPE == 0 filter upstream: 5,386 raw detections -> 3,402 kept
  * ONI series and NOAA phase labels come from the notebook run (df_oni.csv)
  * SPI-3 correlations are recomputed from df_final.spi3 (CHIRPS, baseline 1991-2024), not transcribed
  * FDR adjustment (BH) over the 22 tests (11 ONI + 11 SPI-3) is recomputed
"""
import json, sys, pathlib
import numpy as np, pandas as pd
from scipy.stats import spearmanr, kruskal, rankdata, norm

E = pathlib.Path(sys.argv[1]); PTS = pd.read_csv(sys.argv[2])
OUT = pathlib.Path(__file__).resolve().parent.parent / "src" / "data" / "bengkalis-paper.json"
old = json.load(open(OUT))
F = pd.read_csv(E / "df_final.csv"); O = pd.read_csv(E / "df_oni.csv"); fr = json.load(open(E / "filter_report.json"))
F["kec"] = F.kecamatan_clean.str.title(); F["mi"] = (F.year - 2015) * 12 + F.month - 1
kecs = sorted(old["kec"]); months = old["months"]
P = {k: np.zeros(120, int) for k in kecs}; S = {k: np.zeros(120) for k in kecs}
for r in F.itertuples(): P[r.kec][r.mi] = r.hotspot_count; S[r.kec][r.mi] = r.spi3
oni = O.sort_values(["year", "month"]).oni.values.astype(float); assert len(oni) == 120
ph = np.array([{"El Nino": "E", "La Nina": "L", "Netral": "N"}[p] for p in O.sort_values(["year", "month"]).phase], dtype=object)
tot = sum(P.values()); assert int(tot.sum()) == len(PTS) == 3402

g = {k: np.concatenate([P[c][ph == k] for c in kecs]) for k in "LNE"}
H, p = kruskal(g["L"], g["N"], g["E"]); N = sum(map(len, g.values())); eta = (H - 2) / (N - 3)
allv = np.concatenate([g[k] for k in "LNE"]); rk = rankdata(allv); off = 0; mr = {}
for k in "LNE": n = len(g[k]); mr[k] = rk[off:off + n].mean(); off += n
_, c = np.unique(allv, return_counts=True); s2 = N * (N + 1) / 12 - (c ** 3 - c).sum() / (12 * (N - 1))
pairs = [("L", "N", "La Niña vs Neutral"), ("L", "E", "La Niña vs El Niño"), ("N", "E", "Neutral vs El Niño")]
raw = np.array([2 * norm.sf(abs((mr[a] - mr[b]) / np.sqrt(s2 * (1 / len(g[a]) + 1 / len(g[b]))))) for a, b, _ in pairs])
def bh(ps):
    ps = np.array(ps, float); o = np.argsort(ps); m = len(ps); a = np.empty(m); prev = 1.0
    for r_, i in reversed(list(enumerate(o))): prev = min(prev, ps[i] * m / (r_ + 1)); a[i] = prev
    return a
adj = bh(raw)
phase_stats = {}
for k, nm in zip("LNE", ["La Niña", "Neutral", "El Niño"]):
    v = g[k]; phase_stats[nm] = dict(n=int(len(v)), months=int((ph == k).sum()), mean=float(v.mean()), median=float(np.median(v)),
                                     p95=float(np.percentile(v, 95)), max=int(v.max()), meanRank=float(mr[k]))
mon = np.array([i % 12 + 1 for i in range(120)]); dry = (mon >= 6) & (mon <= 9); seas = {}
for nm, m in (("dry", dry), ("rainy", ~dry)):
    h = np.concatenate([P[k][m] for k in kecs]); oo = np.concatenate([oni[m] for k in kecs]); pp = np.concatenate([ph[m] for k in kecs])
    Hs, ps = kruskal(*[h[pp == x] for x in "LNE"]); seas[nm] = dict(n=int(len(h)), rho=float(spearmanr(oo, h)[0]), H=float(Hs), p=float(ps), eta2=float((Hs - 2) / (len(h) - 3)))
cal = {nm: [0] * 12 for nm in ("La Niña", "Neutral", "El Niño")}; nmap = {"L": "La Niña", "N": "Neutral", "E": "El Niño"}
for i in range(120): cal[nmap[ph[i]]][i % 12] += int(tot[i])

on = {k: spearmanr(oni, P[k]) for k in kecs}; sp = {k: spearmanr(S[k], P[k]) for k in kecs}   # all 120 months (SPI-3 baseline 1991-2024 has no gap)
adj22 = bh([on[k][1] for k in kecs] + [sp[k][1] for k in kecs]); oni_adj = dict(zip(kecs, adj22[:11])); spi_adj = dict(zip(kecs, adj22[11:]))
out_k = {}
for k in kecs:
    pk = PTS[PTS.kecamatan == k]
    out_k[k] = dict(d=old["kec"][k]["d"], cx=old["kec"][k]["cx"], cy=old["kec"][k]["cy"], total=int(P[k].sum()), inPeat=int(pk.in_peat.sum()),
                    rhoOni=float(on[k][0]), pOni=float(on[k][1]), pOniAdj=float(oni_adj[k]),
                    rhoSpi=float(sp[k][0]), pSpiAdj=float(spi_adj[k]), monthly=P[k].tolist())
geo = json.load(open(OUT)); W, Hh = old["w"], old["h"]
pr = dict(minx=100.96788273000004, maxy=2.125813735000065, k=0.9996463924649783, S=649.5602740212846)
pts = [[round((r.lon - pr["minx"]) * pr["k"] * pr["S"], 1), round((pr["maxy"] - r.lat) * pr["S"], 1), int(r.date[:4]), 1 if r["class"] == "anchor" else 0] for r in PTS.rename(columns={"class": "class"}).to_dict("records").__iter__() if False] if False else []
for r in PTS.itertuples(index=False):
    pts.append([round((r.lon - pr["minx"]) * pr["k"] * pr["S"], 1), round((pr["maxy"] - r.lat) * pr["S"], 1), int(r.date[:4]), 1 if getattr(r, "cls") == "anchor" else 0])
yrs = []
for y in range(2015, 2025):
    a = PTS[PTS.date.str[:4] == str(y)]; yrs.append(dict(year=y, outPeat=int((~a.in_peat).sum()), inPeat=int(a.in_peat.sum()), total=int(len(a))))
MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
def peak(y):
    i = int(np.argmax(tot[(y - 2015) * 12:(y - 2014) * 12])) + (y - 2015) * 12
    return dict(year=y, month=MON[i % 12], n=int(tot[i]), phase=nmap[ph[i]], oni=round(float(oni[i]), 2)), i
peaks = []
for y in (2015, 2019, 2023):
    d, i = peak(y); peaks.append(d)
pool_h = np.concatenate([P[k] for k in kecs]); pool_o = np.concatenate([oni for k in kecs]); zeros = float(np.mean(pool_h == 0))
doc = dict(
    w=old["w"], h=old["h"], months=months, oni=oni.tolist(), phase=ph.tolist(), regency=tot.tolist(), kec=out_k, points=pts,
    kruskal=dict(H=float(H), p=float(p), eta2=float(eta), n=int(N)),
    dunn=[dict(pair=nm, p=float(a), padj=float(b)) for (_, _, nm), a, b in zip(pairs, raw, adj)],
    phaseStats=phase_stats, seasons=seas, calendar=cal, zeroShare=zeros,
    pooledOni=dict(rho=float(spearmanr(pool_o, pool_h)[0]), n=int(len(pool_h))),
    aggregateOni=dict(rho=float(spearmanr(oni, tot)[0]), n=120),
    years=yrs, peaks=peaks,
    funnel=dict(raw=fr["n_total"], anchor=fr["n_anchors"], medium=1363, low=1731, rescued=fr["n_rescued"], final=len(PTS), clusters=fr["n_clusters"]),
    sensitivity=[dict(label="all confidences", n=fr["n_total"]), dict(label="≥ 30%", n=4795), dict(label="≥ 50%", n=3655), dict(label="≥ 80%", n=1648), dict(label="anchors + rescue (DBSCAN)", n=len(PTS))],
    note="Recomputed from the thesis-notebook v3 export: 3,402 DBSCAN-filtered MODIS points (TYPE = 0), ONI from the notebook run, SPI-3 (CHIRPS, 1991-2024 baseline) from df_final.")
OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
print("ok", OUT.stat().st_size, "H", round(H, 2), "p", p, "eta2", round(eta, 4), "adj", adj, "zeros", round(zeros, 3))
print({k: (round(on[k][0], 3), round(sp[k][0], 3)) for k in kecs}); print(peaks); print(phase_stats["El Niño"]["months"], phase_stats["La Niña"]["months"], phase_stats["Neutral"]["months"])
