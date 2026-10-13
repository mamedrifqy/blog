#!/usr/bin/env python3
"""Write src/data/dbscan-points.json: every MODIS point inside Bengkalis, 2015-2024 (5,603), for the interactive DBSCAN explainer.

  python3 scripts/build_dbscan_data.py hotspotriau.geojson bengkalis_villages.geojson

Same selection as the riau-peatland-fire pipeline: ACQ_DATE 2015-2024, point inside the union of the village polygons.
Coordinates are stored as integers x 1e4 (about 11 m); the source precision is checked so no rounding changes a distance.
"""
import json, sys, pathlib
import numpy as np
from shapely.geometry import shape
from shapely.ops import unary_union
from shapely import contains_xy

raw = json.load(open(sys.argv[1]))["features"]; vil = json.load(open(sys.argv[2]))["features"]
lon = np.array([f["geometry"]["coordinates"][0] for f in raw]); lat = np.array([f["geometry"]["coordinates"][1] for f in raw])
date = [f["properties"]["ACQ_DATE"] for f in raw]; conf = np.array([float(f["properties"]["CONFIDENCE"] or 0) for f in raw])
yr = np.array([int(d[:4]) for d in date]); k1 = (yr >= 2015) & (yr <= 2024)
union = unary_union([shape(f["geometry"]).buffer(0) for f in vil])
inside = np.zeros(len(raw), bool); idx = np.where(k1)[0]; inside[idx] = contains_xy(union, lon[idx], lat[idx])
sel = np.where(inside)[0]; assert len(sel) == 5603, len(sel)
print("max rounding error (deg):", float(np.abs(lon[sel] * 1e4 - np.round(lon[sel] * 1e4)).max() / 1e4), float(np.abs(lat[sel] * 1e4 - np.round(lat[sel] * 1e4)).max() / 1e4))
mi = [(int(date[i][:4]) - 2015) * 12 + int(date[i][5:7]) - 1 for i in sel]
out = dict(x=[int(round(lon[i] * 1e4)) for i in sel], y=[int(round(lat[i] * 1e4)) for i in sel], c=[int(conf[i]) for i in sel], m=mi)
p = pathlib.Path(__file__).resolve().parent.parent / "src" / "data" / "dbscan-points.json"
p.write_text(json.dumps(out, separators=(",", ":"))); print("wrote", p.stat().st_size, "bytes,", len(sel), "points")
