#!/usr/bin/env python3
"""Build src/data/data-stack.json: the geometry behind the layered "How the data fit together"
figure on the Data page (src/components/thesis/DataStack.jsx).

Input : files already in public/thesis-data (written by build_thesis_report_data.py)
Output: src/data/data-stack.json

Usage : python3 -I scripts/build_data_stack.py

Nothing is modelled here. Coordinates are rescaled to a 0-1000 grid over the bounding box of the
11 sub-districts, peat polygons are simplified (Douglas-Peucker) for drawing only, and the
panel matrix is the hotspot_count column of monthly_panel_11x120.csv as it stands.
"""
import csv, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
D = ROOT / "public" / "thesis-data"
OUT = ROOT / "src" / "data" / "data-stack.json"

hot = json.loads((D / "hotspots.json").read_text())
kec = json.loads((D / "kecamatan.geojson").read_text())
peat = json.loads((D / "peat.geojson").read_text())


def rings(geom):
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    for p in polys:
        yield p[0]  # outer ring only; holes are not drawn


xs, ys = [], []
for f in kec["features"]:
    for r in rings(f["geometry"]):
        xs += [c[0] for c in r]
        ys += [c[1] for c in r]
x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
span = max(x1 - x0, y1 - y0)
# u = east, v = south (north sits at the back edge of each plane)
U = lambda lon: round((lon - x0) / span * 1000)
V = lambda lat: round((y1 - lat) / span * 1000)


def dp(pts, tol):
    if len(pts) < 3:
        return pts
    (ax, ay), (bx, by) = pts[0], pts[-1]
    dx, dy = bx - ax, by - ay
    n = (dx * dx + dy * dy) ** 0.5 or 1e-12
    i, dmax = 0, -1
    for k in range(1, len(pts) - 1):
        d = abs(dy * pts[k][0] - dx * pts[k][1] + bx * ay - by * ax) / n
        if d > dmax:
            i, dmax = k, d
    if dmax > tol:
        return dp(pts[: i + 1], tol)[:-1] + dp(pts[i:], tol)
    return [pts[0], pts[-1]]


def path(ring, tol):
    ring = [(c[0], c[1]) for c in ring]
    # A closed ring has identical end points, so simplify its two halves separately.
    h = len(ring) // 2
    s = dp(ring[: h + 1], tol)[:-1] + dp(ring[h:], tol)
    if len(s) < 3:
        return None
    return "M" + "L".join(f"{U(x)},{V(y)}" for x, y in s) + "Z"


kec_paths = []
for f in kec["features"]:
    ps = [p for p in (path(r, 0.002) for r in rings(f["geometry"])) if p]
    kec_paths.append({"name": f["properties"]["kecamatan"], "d": "".join(ps)})

peat_paths = []
for f in peat["features"]:
    ps = [p for p in (path(r, 0.0015) for r in rings(f["geometry"])) if p]
    if ps:
        peat_paths.append({"depth": int(f["properties"]["depth"]), "d": "".join(ps)})

fi = {k: i for i, k in enumerate(hot["fields"])}
points = [[U(r[fi["lon"]]), V(r[fi["lat"]]), int(r[fi["depth"]])] for r in hot["rows"]]

# Panel: 11 sub-districts x 120 months of hotspot_count, plus the regency-wide ONI and phase per month.
names = hot["kecamatan"]
grid = {n: [0] * 120 for n in names}
oni, phase = [None] * 120, [None] * 120
rows = 0
with open(D / "csv" / "monthly_panel_11x120.csv", newline="") as fh:
    for r in csv.DictReader(fh):
        t = (int(r["year"]) - 2015) * 12 + int(r["month"]) - 1
        grid[r["kecamatan"]][t] = int(r["hotspot_count"])
        oni[t] = float(r["oni_c"])
        phase[t] = r["enso_phase"]
        rows += 1

# Sanity checks against numbers stated in the thesis posts; a mismatch should fail loudly.
assert rows == 1320, rows
assert len(points) == 3402, len(points)
assert sum(sum(v) for v in grid.values()) == 3402, sum(sum(v) for v in grid.values())
assert len(peat["features"]) == 208
ph = {p: phase.count(p) for p in set(phase)}

OUT.write_text(json.dumps({
    "_source": "Built by scripts/build_data_stack.py from public/thesis-data. Coordinates on a 0-1000 grid over the Bengkalis bounding box.",
    "kecamatan": kec_paths,
    "peat": peat_paths,
    "points": points,
    "panel": {"names": names, "counts": [grid[n] for n in names], "oni": oni, "phase": phase},
}, separators=(",", ":"), ensure_ascii=False))
print(OUT, OUT.stat().st_size, "bytes; peat paths", len(peat_paths), "; phases", ph)
