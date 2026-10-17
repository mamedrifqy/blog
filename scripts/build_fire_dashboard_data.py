"""Build src/data/fire-dashboard.json for the Riau fire dashboard post.

Reads only files already in the repo:
  public/riau-peatland-fire/data/riau_monthly_panel.csv   (12 regencies x 120 months: hotspot_count, enso_phase)
  public/riau-peatland-fire/data/peat_depth_classes.csv   (mapped peat area by depth class, per regency)

The Bengkalis series (thesis v3, DBSCAN-filtered) are NOT rebuilt here: the dashboard imports
src/data/bengkalis-paper.json and src/components/thesis/data.js directly, so those numbers stay
identical to the ones in the other posts.

Run from the repo root:  python3 -I scripts/build_fire_dashboard_data.py
"""
import csv
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'public' / 'riau-peatland-fire' / 'data'
OUT = ROOT / 'src' / 'data' / 'fire-dashboard.json'

PHASE_KEY = {'El Nino': 'E', 'Netral': 'N', 'La Nina': 'L'}
YEARS = list(range(2015, 2025))

panel = list(csv.DictReader(open(DATA / 'riau_monthly_panel.csv', encoding='utf-8')))
months = sorted({r['month'] for r in panel})
assert len(months) == 120 and months[0] == '2015-01' and months[-1] == '2024-12'

# regency x year
by_reg_year = defaultdict(lambda: defaultdict(int))
monthly_total = defaultdict(int)
phase_by_month = {}
oni_by_month = {}
for r in panel:
    n = int(float(r['hotspot_count']))
    by_reg_year[r['regency']][int(r['month'][:4])] += n
    monthly_total[r['month']] += n
    ph, oni = PHASE_KEY[r['enso_phase']], float(r['oni_c'])
    # ENSO phase / ONI are regional, so they must agree across regencies
    assert phase_by_month.setdefault(r['month'], ph) == ph
    assert oni_by_month.setdefault(r['month'], oni) == oni

regencies = sorted(by_reg_year, key=lambda k: -sum(by_reg_year[k].values()))

# peat area by depth class
CLASSES = ['50 <100 cm', '100 <200 cm', '200 <300 cm', '300 <500 cm', '500 <700 cm', '>700 cm']
peat = defaultdict(lambda: [0.0] * len(CLASSES))
for r in csv.DictReader(open(DATA / 'peat_depth_classes.csv', encoding='utf-8')):
    peat[r['regency']][CLASSES.index(r['depth_class_cm'])] += float(r['area_ha'])

out = {
    'note': 'Riau-wide MODIS hotspots (confidence >= 30%), 12 regencies, 2015-2024, from riau_monthly_panel.csv. '
            'A different filter from the Bengkalis thesis series (DBSCAN-filtered, 3,402 points).',
    'years': YEARS,
    'regencies': regencies,
    'hs': {k: [by_reg_year[k][y] for y in YEARS] for k in regencies},
    'monthly': [monthly_total[m] for m in months],
    'phase': [phase_by_month[m] for m in months],
    'oni': [oni_by_month[m] for m in months],
    'depthClasses': CLASSES,
    'peatHa': {k: [round(v) for v in peat[k]] for k in regencies},
}

assert sum(out['monthly']) == sum(sum(v) for v in out['hs'].values())
OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print('wrote', OUT.relative_to(ROOT), OUT.stat().st_size, 'bytes; total hotspots', sum(out['monthly']))
