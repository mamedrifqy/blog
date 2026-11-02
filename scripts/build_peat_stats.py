#!/usr/bin/env python3
"""Per-polygon statistics for the peat map, used by the Spatial frame pop-up on the Data page.

Input : public/thesis-data/peat.geojson, public/thesis-data/csv/hotspots_filtered_3402.csv
Output: public/thesis-data/peat_polygons.json  {gambut_id: [depth, area_ha, hotspots]}

Usage : python3 -I scripts/build_peat_stats.py

Area is computed in UTM 48S (EPSG:32748), the projection of the thesis canal raster. Hotspots are
counted by point-in-polygon on the published hotspot coordinates (MODIS 1 km pixel centres).
The web peat layer is simplified, so per-polygon areas are approximate; the total is checked
against the 511,265 ha stated in the thesis posts.
"""
import csv, json
from pathlib import Path
from shapely.geometry import shape, Point
from shapely.ops import transform
from shapely.strtree import STRtree
from pyproj import Transformer

ROOT = Path(__file__).resolve().parent.parent
D = ROOT / "public" / "thesis-data"
peat = json.loads((D / "peat.geojson").read_text())
tr = Transformer.from_crs("EPSG:4326", "EPSG:32748", always_xy=True).transform

geoms, ids, depth = [], [], []
for f in peat["features"]:
    g = shape(f["geometry"])
    if not g.is_valid:
        g = g.buffer(0)
    geoms.append(g)
    ids.append(str(f["properties"]["gambut_id"]))
    depth.append(int(f["properties"]["depth"]))
area = [transform(tr, g).area / 1e4 for g in geoms]

tree = STRtree(geoms)
count = [0] * len(geoms)
n, agree, on = 0, 0, 0
lab = {"50–<100 cm": 1, "100–<200 cm": 2, "200–<300 cm": 3, "300–<500 cm": 4, "500–<700 cm": 5, ">700 cm": 6}
with open(D / "csv" / "hotspots_filtered_3402.csv", newline="") as fh:
    for r in csv.DictReader(fh):
        n += 1
        p = Point(float(r["longitude"]), float(r["latitude"]))
        hit = [i for i in tree.query(p) if geoms[i].covers(p)]
        if hit:
            i = hit[0]
            count[i] += 1
            on += 1
            agree += lab.get(r["peat_depth_class"]) == depth[i]

total = sum(area)
print(f"polygons {len(geoms)}; total area {total:,.0f} ha; hotspots {n}; inside a web polygon {on}; depth agrees {agree}")
assert len(geoms) == 208 and n == 3402
assert abs(total - 511265) / 511265 < 0.02, total  # simplified outlines: within 2% of the thesis figure

(D / "peat_polygons.json").write_text(json.dumps(
    {k: [d, round(a), c] for k, d, a, c in zip(ids, depth, area, count)}, separators=(",", ":")))
