#!/usr/bin/env python3
"""Build the data bundle behind the thesis cluster's maps, charts and Data page.

Input : the unzipped `report_bengkalis_merged` folder (thesis v3 analysis outputs).
Output: public/thesis-data/**   (fetched at runtime by the map components + downloadable CSVs)
        src/data/thesis-report.json   (small tables imported by the chart components)
        src/data/thesis-datasets.json (manifest for the Data page)

Usage : python3 -I scripts/build_thesis_report_data.py <report_dir>

Nothing here is modelled or inferred: every number is read from a file in <report_dir>,
or computed by a plain spatial join / raster lookup on those files. Sanity checks against
the thesis text are asserted at the bottom, so a mismatch fails the build loudly.
"""
import json, sys, shutil
from pathlib import Path

import numpy as np
import pandas as pd
import geopandas as gpd
import rasterio
from rasterio.features import rasterize
from rasterio.transform import from_origin
from rasterio.warp import reproject, Resampling
from PIL import Image

SRC = Path(sys.argv[1]).resolve()
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "thesis-data"
CSV = OUT / "csv"
IMG = ROOT / "public" / "image" / "thesis"
for p in (OUT, CSV, IMG):
    p.mkdir(parents=True, exist_ok=True)

KEC_GEO = ROOT / "public/riau-peatland-fire/data/bengkalis_kecamatan_simplified.geojson"
DEPTH_LABEL = {1: "50–<100 cm", 2: "100–<200 cm", 3: "200–<300 cm", 4: "300–<500 cm", 5: "500–<700 cm", 6: ">700 cm"}
DEPTH_CODE = {"50-<100 cm": 1, "100-<200 cm": 2, "200-<300 cm": 3, "300-<500 cm": 4, "500-<700 cm": 5, ">700 cm": 6}
manifest = []


def title(s):
    return " ".join(w.capitalize() for w in str(s).split())


def save_csv(df, name, title_, desc, source, thesis_ref=None):
    path = CSV / name
    df.to_csv(path, index=False)
    manifest.append(dict(file=f"csv/{name}", title=title_, description=desc, rows=int(len(df)),
                         columns=[str(c) for c in df.columns], source=source, ref=thesis_ref,
                         bytes=path.stat().st_size))
    return df


# ───────────────────────── spatial layers ─────────────────────────
kec = gpd.read_file(KEC_GEO).to_crs(4326)
peat = gpd.read_file(SRC / "gambut_bengkalis_clean.gpkg").to_crs(4326)
peat["depth"] = peat["kelas_gbt"].map(DEPTH_CODE)
assert peat["depth"].notna().all()

hs = gpd.read_file(SRC / "hotspot_filtered_3402.geojson").to_crs(4326)
assert len(hs) == 3402, len(hs)
hs["date"] = pd.to_datetime(hs["acq_date"])

# kecamatan: point-in-polygon, nearest polygon for coastal points that fall just outside
j = gpd.sjoin(hs, kec[["kecamatan", "geometry"]], how="left", predicate="within")
j = j[~j.index.duplicated()]
miss = j["kecamatan"].isna()
if miss.any():
    utm = "EPSG:32748"
    near = gpd.sjoin_nearest(hs.loc[miss].to_crs(utm), kec[["kecamatan", "geometry"]].to_crs(utm),
                             how="left", distance_col="d")
    near = near[~near.index.duplicated()]
    j.loc[miss, "kecamatan"] = near["kecamatan"]
    print(f"{int(miss.sum())} hotspots outside polygons -> nearest kecamatan (max {near['d'].max():.0f} m)")
hs["kecamatan"] = j["kecamatan"]

# peat depth class per hotspot
jp = gpd.sjoin(hs[["geometry"]], peat[["depth", "geometry"]], how="left", predicate="within")
jp = jp[~jp.index.duplicated()]
hs["depth"] = jp["depth"].fillna(0).astype(int)
hs["on_peat"] = hs["depth"] > 0

# distance to nearest canal (30 m raster, EPSG:32748)
with rasterio.open(SRC / "dist_to_canal_m_30m_EPSG32748.tif") as r:
    d_arr = r.read(1)
    xy = hs.to_crs(r.crs)
    rows, cols = rasterio.transform.rowcol(r.transform, xy.geometry.x.values, xy.geometry.y.values)
    rows, cols = np.asarray(rows), np.asarray(cols)
    ok = (rows >= 0) & (rows < r.height) & (cols >= 0) & (cols < r.width)
    dist = np.full(len(hs), np.nan)
    dist[ok] = d_arr[rows[ok], cols[ok]]
    r_crs, r_tf, r_shape = r.crs, r.transform, r.shape
hs["canal_m"] = dist
print("canal distance: median on peat %.0f m, share <=1 km on peat %.1f%%" % (
    np.nanmedian(hs.loc[hs.on_peat, "canal_m"]), 100 * (hs.loc[hs.on_peat, "canal_m"] <= 1000).mean()))

# compact hotspot payload: [lon, lat, year, month, kecIdx, depth, canal_m, frp]
kec_names = sorted(kec["kecamatan"].tolist())
kidx = {n: i for i, n in enumerate(kec_names)}
rows_out = []
for _, h in hs.iterrows():
    rows_out.append([round(h.geometry.x, 4), round(h.geometry.y, 4), int(h.date.year), int(h.date.month),
                     kidx[h.kecamatan], int(h.depth),
                     None if np.isnan(h.canal_m) else int(round(h.canal_m)),
                     None if pd.isna(h.frp) else round(float(h.frp), 1)])
(OUT / "hotspots.json").write_text(json.dumps(dict(
    fields=["lon", "lat", "year", "month", "kecamatan", "depth", "canal_m", "frp"],
    kecamatan=kec_names, depth_labels={str(k): v for k, v in DEPTH_LABEL.items()}, rows=rows_out),
    separators=(",", ":")))

# peat polygons (simplified) with depth class
pp = peat.copy()
pp["geometry"] = pp.geometry.simplify(0.0004, preserve_topology=True)
pp = pp[["gambut_id", "depth", "kelas_gbt", "geometry"]]
pp.to_file(OUT / "peat.geojson", driver="GeoJSON", COORDINATE_PRECISION=5)

# kecamatan outlines (simplified file already in repo; keep a copy with ids)
kk = kec[["kecamatan", "geometry"]].copy()
kk.to_file(OUT / "kecamatan.geojson", driver="GeoJSON", COORDINATE_PRECISION=5)

# ───────────────────────── canal rasters -> 4326 overlays ─────────────────────────
STEP = 0.0006  # ~66 m
minx, miny, maxx, maxy = peat.total_bounds
pad = 0.01
minx, miny, maxx, maxy = minx - pad, miny - pad, maxx + pad, maxy + pad
W = int(np.ceil((maxx - minx) / STEP)); H = int(np.ceil((maxy - miny) / STEP))
dst_tf = from_origin(minx, maxy, STEP, STEP)

dist_ll = np.full((H, W), np.nan, dtype="float32")
reproject(d_arr.astype("float32"), dist_ll, src_transform=r_tf, src_crs=r_crs,
          dst_transform=dst_tf, dst_crs="EPSG:4326", resampling=Resampling.min,
          src_nodata=None, dst_nodata=np.nan)
peat_mask = rasterize([(g, 1) for g in peat.geometry], out_shape=(H, W), transform=dst_tf, fill=0, dtype="uint8").astype(bool)

# classes follow the Table 4.33 bins: <0.5, 0.5-1, 1-2, 2-4, >4 km
bins = [500, 1000, 2000, 4000]
cls = np.digitize(dist_ll, bins)  # 0..4
palette = np.array([[28, 200, 170], [120, 210, 120], [240, 188, 46], [232, 130, 58], [232, 83, 58]], dtype="uint8")
rgba = np.zeros((H, W, 4), dtype="uint8")
valid = peat_mask & np.isfinite(dist_ll)
rgba[valid, :3] = palette[cls[valid]]
rgba[valid, 3] = 205
Image.fromarray(rgba, "RGBA").save(OUT / "canal_distance.png", optimize=True)

with rasterio.open(SRC / "canal_mask_30m_EPSG32748.tif") as r:
    m = r.read(1)
mask_ll = np.zeros((H, W), dtype="uint8")
reproject((m > 0).astype("uint8"), mask_ll, src_transform=r.transform, src_crs=r.crs,
          dst_transform=dst_tf, dst_crs="EPSG:4326", resampling=Resampling.max)
# keep only canals inside the regency (the source raster covers a wider area)
kec_mask = rasterize([(g, 1) for g in kec.geometry.buffer(0.004)], out_shape=(H, W), transform=dst_tf, fill=0, dtype="uint8").astype(bool)
mask_ll = mask_ll * kec_mask
rgba2 = np.zeros((H, W, 4), dtype="uint8")
rgba2[mask_ll > 0] = [90, 190, 255, 255]
Image.fromarray(rgba2, "RGBA").save(OUT / "canal_lines.png", optimize=True)
bounds = dict(west=minx, south=miny, east=maxx, north=maxy)
print("overlay", W, "x", H, "bounds", bounds)

# canal-distance legend share by class (peat only) for the legend
share = [float(((cls == c) & valid).sum() / valid.sum()) for c in range(5)]

# ───────────────────────── tables ─────────────────────────
panel = pd.read_csv(SRC / "dataset_kecamatan_bengkalis_v3.csv")
assert len(panel) == 1320
panel["kecamatan"] = panel["kecamatan_clean"].map(title)

# 1 hotspots
hcsv = pd.DataFrame(dict(
    date=hs["date"].dt.strftime("%Y-%m-%d"), year=hs["date"].dt.year, month=hs["date"].dt.month,
    latitude=hs.geometry.y.round(5), longitude=hs.geometry.x.round(5), kecamatan=hs["kecamatan"],
    on_peat=hs["on_peat"].astype(int), peat_depth_class=hs["depth"].map(lambda v: DEPTH_LABEL.get(v, "non-peat")),
    canal_distance_m=hs["canal_m"].round(0), frp_mw=hs["frp"], confidence=hs["confidence"],
    satellite=hs["satellite"], day_night=hs["daynight"]))
save_csv(hcsv, "hotspots_filtered_3402.csv", "Quality-filtered hotspots, 2015–2024",
         "All 3,402 MODIS hotspots kept after the confidence and DBSCAN filters, with sub-district, peat depth class and distance to the nearest canal attached by spatial join.",
         "hotspot_filtered_3402.geojson + gambut_bengkalis_clean.gpkg + dist_to_canal_m_30m_EPSG32748.tif", "Sections 3.6, 4.1")

# 2 monthly panel
pcsv = panel[["year", "month", "kecamatan", "oni", "phase", "precip_mm", "t2m_mean", "spi3", "spei3", "hotspot_count",
              "fire_occurrence", "is_fire_season", "dmi", "total_gambut_ha", "oilpalm_frac", "defor_frac_2015_2024", "pop_density_km2"]].copy()
pcsv = pcsv.rename(columns={"oni": "oni_c", "phase": "enso_phase", "precip_mm": "precip_mm", "t2m_mean": "t2m_mean_c",
                            "total_gambut_ha": "peat_area_ha", "oilpalm_frac": "oil_palm_fraction",
                            "defor_frac_2015_2024": "deforestation_fraction_2015_2024", "pop_density_km2": "population_density_km2"})
save_csv(pcsv, "monthly_panel_11x120.csv", "Sub-district × month panel (1,320 rows)",
         "The analysis panel: 11 sub-districts × 120 months with ONI, DMI, CHIRPS rainfall, ERA5-Land temperature, SPI-3, SPEI-3, hotspot counts, fire occurrence and static covariates.",
         "dataset_kecamatan_bengkalis_v3.csv", "Section 3.7")

# 3 annual
ann = pd.read_csv(SRC / "ringkasan_tahunan_oni_dmi_hotspot.csv").rename(columns={"ONI_JunNov": "oni_jun_nov_c", "DMI_JunNov": "dmi_jun_nov", "hotspot_total": "hotspots"})
save_csv(ann, "annual_oni_dmi_hotspots.csv", "Annual ONI, DMI and hotspot totals",
         "June–November mean ONI and DMI against the yearly filtered hotspot count.", "ringkasan_tahunan_oni_dmi_hotspot.csv", "Section 4.2.1")

# 4 seasonal profile
sea = pd.read_csv(SRC / "profil_musim_api_empiris.csv")
sea = sea.rename(columns={sea.columns[0]: "month", "porsi_hotspot_%": "hotspot_share_pct", "porsi_median_per_thn_%": "median_yearly_share_pct",
                          "frek_tahun_berapi": "share_of_years_with_fire", "stabilitas_LOYO": "leave_one_year_out_stability", "bulan_api": "is_fire_month"})
assert sea["month"].tolist() == list(range(1, 13))
save_csv(sea, "seasonal_profile.csv", "Seasonal profile of hotspots",
         "Monthly share of all hotspots, median yearly share, how often the month had fire, and whether it counts as a fire month (Feb, Mar, Apr, Jul, Aug).",
         "profil_musim_api_empiris.csv", "Section 4.2.2")

# 5 per kecamatan summary
rs = pd.read_csv(SRC / "ringkasan_per_kecamatan_v3.csv")
vi = pd.read_csv(SRC / "vulnerability_index_extended.csv")
ews = pd.read_csv(SRC / "tabel_ews_operasional_v3.csv")
sm = rs.merge(vi[["Kecamatan", "avg_depth_ordinal", "oilpalm_frac", "defor_frac_2015_2024", "pop_density_km2", "VI_extended"]], on="Kecamatan", how="left")
sm = sm.merge(ews[["Kecamatan", "Level Siaga", "Lag ONI (bln)"]], on="Kecamatan", how="left")
sm_out = sm.rename(columns={"Kecamatan": "kecamatan", "r_Hotspot_vs_ONI": "spearman_r_hotspots_oni", "p_Hotspot_vs_ONI": "p_hotspots_oni",
                            "r_Precip": "spearman_r_precip", "r_Drought": "spearman_r_drought", "r_T2m": "spearman_r_t2m",
                            "Total_Hotspot": "hotspots_total_panel", "Gambut_ha": "peat_area_ha", "Fire_Prob_Mean": "mean_fire_probability",
                            "Level Siaga": "alert_level", "Lag ONI (bln)": "oni_lag_months", "VI_extended": "vulnerability_index",
                            "oilpalm_frac": "oil_palm_fraction", "defor_frac_2015_2024": "deforestation_fraction", "pop_density_km2": "population_density_km2"})
sm_out = sm_out.drop(columns=["p_T2m", "p_Precip", "p_Drought", "Fire_Weighted_Depth"])
save_csv(sm_out, "subdistrict_summary.csv", "Sub-district summary",
         "Correlations of monthly hotspots with ONI, rainfall and drought; peat area, land cover, population, vulnerability index and operational alert level for each of the 11 sub-districts.",
         "ringkasan_per_kecamatan_v3.csv + vulnerability_index_extended.csv + tabel_ews_operasional_v3.csv")

# 6 EWS table (keep Indonesian action text only as in source; add English headers)
ews_o = ews.rename(columns={"Kecamatan": "kecamatan", "Level Siaga": "alert_level", "Lag ONI (bln)": "oni_lag_months",
                            "r ONI optimal": "spearman_r_oni_best_lag", "Threshold ONI": "oni_threshold",
                            "Threshold SPEI": "spei_threshold", "P(kebakaran) tahunan": "p_fire_annual",
                            "P(kebakaran) El Niño": "p_fire_el_nino", "P(kebakaran) El Niño+Kemarau": "p_fire_el_nino_dry",
                            "CI95 El Niño+bulan api": "ci95_el_nino_fire_month", "n bulan El Niño+bulan api": "n_months_el_nino_fire_month",
                            "P(api) bulan api fase lain": "p_fire_fire_month_other_phase", "P model OOF El Niño+bulan api": "p_model_oof_el_nino_fire_month",
                            "Tren MK": "mann_kendall_trend", "Tau MK": "mann_kendall_tau", "p MK tahunan (BH)": "mann_kendall_p_bh",
                            "Window EWS": "ews_window", "Trigger Utama": "main_trigger", "Aksi Rekomendasi": "recommended_action"})
save_csv(ews_o, "early_warning_alert_table.csv", "Operational early-warning table",
         "Alert level, ONI lag, thresholds, conditional fire probabilities and recommended actions per sub-district. Text columns are in Indonesian, as in the source analysis.",
         "tabel_ews_operasional_v3.csv", "Section 4.7.6, Table 4.25")

# 7 peat depth distribution
pd_ = pd.read_csv(SRC / "hotspot_peat_depth_distribution.csv")
pd_o = pd.DataFrame(dict(depth_class=pd_["depth_label"].str.replace("–", "–"), hotspots=pd_["n_hotspots"],
                         hotspot_share_pct=pd_["fire_pct"].round(2), peat_area_ha=pd_["area_ha"].round(0),
                         peat_area_share_pct=pd_["area_pct"].round(2), hotspot_density_per_ha=pd_["fire_density"].round(6),
                         ratio=pd_["ratio"].round(2), status=pd_["status"]))
save_csv(pd_o, "hotspots_by_peat_depth.csv", "Hotspots by peat depth class",
         "Share of hotspots against share of peat area in each depth class; ratio > 1 means over-represented.",
         "hotspot_peat_depth_distribution.csv", "Section 4.3")

# 8 canal distance bins
cb = pd.read_csv(SRC / "hotspot_canal_dist_bins.csv")
cb_o = pd.DataFrame(dict(distance_to_canal=cb.iloc[:, 0].str.replace(",", "."), hotspots=cb["n_hotspot"], hotspot_share_pct=cb["hotspot_pct"],
                         peat_area_share_pct=cb["area_pct(null)"], ratio=cb["ratio"]))
save_csv(cb_o, "hotspots_by_canal_distance.csv", "Hotspots by distance to nearest canal",
         "Hotspot share against peat-area share in five distance bands.", "hotspot_canal_dist_bins.csv", "Table 4.33")

cd = pd.read_csv(SRC / "hotspot_canal_dist_by_depth_burnable.csv")
cd_o = cd.rename(columns={"kedalaman": "depth_class", "n_hs": "n_hotspots", "n_null": "n_null_points", "median_hs_m": "median_hotspot_distance_m",
                          "median_null_m": "median_null_distance_m", "P": "prob_hotspot_closer_than_null", "p_MW": "p_mann_whitney", "p_BH": "p_bh_adjusted"})
for c in ("median_hotspot_distance_m", "median_null_distance_m"):
    cd_o[c] = cd_o[c].round(1)
save_csv(cd_o, "canal_distance_by_depth.csv", "Distance to canal by peat depth (burnable land)",
         "Median hotspot distance against random burnable-peat points, with Mann–Whitney tests and Benjamini–Hochberg adjustment.",
         "hotspot_canal_dist_by_depth_burnable.csv", "Table 4.34")

lg = pd.read_csv(SRC / "hotspot_canal_logit.csv").rename(columns={"Unnamed: 0": "term", "OR": "odds_ratio", "ci_lo": "ci95_low", "ci_hi": "ci95_high", "p": "p_value"})
save_csv(lg.round(6), "canal_logit.csv", "Canal-distance logistic regression",
         "Odds ratios for hotspot vs. random burnable-peat point; log_d is log10 distance to the nearest canal, depth classes are relative to class 1.",
         "hotspot_canal_logit.csv", "Section 4.9")

lc = pd.read_csv(SRC / "hotspot_canal_landcover_composition.csv").rename(columns={"lc": "land_cover", "hotspot_%": "hotspot_pct", "null_%": "null_pct", "rasio": "ratio"})
save_csv(lc, "canal_landcover_composition.csv", "Land cover of hotspots within canal-proximate peat",
         "Land-cover composition under hotspots against random points.", "hotspot_canal_landcover_composition.csv", "Table 4.35")

# 9 skill
sk = pd.read_csv(SRC / "ews_skill_nested_loyo.csv").rename(columns={"Unnamed: 0": "rule"})
sk["rule"] = sk["rule"].map({"Aturan ONI+kekeringan (nested)": "ONI + drought rule (nested leave-one-year-out)",
                             "Pembanding: alarm tiap bulan api": "Seasonal calendar (alarm every fire month)"}).fillna(sk["rule"])
save_csv(sk.round(4), "early_warning_skill.csv", "Early-warning skill: ONI + drought rule vs seasonal calendar",
         "POD, FAR, POFD, CSI and Peirce skill score for the nested rule and the calendar baseline.", "ews_skill_nested_loyo.csv", "Section 4.8, Table 4.27")

# 10 retention sensitivity
rt = pd.read_csv(SRC / "sensitivitas_retensi_tahunan.csv").rename(columns={"Unnamed: 0": "year"})
rt.columns = ["year", "all_points", "confidence_ge_30", "confidence_ge_50", "confidence_ge_70", "dbscan_filtered", "dbscan_filtered_on_peat", "dbscan_filtered_off_peat"]
save_csv(rt, "hotspot_retention_by_year.csv", "Hotspot counts under alternative filters, by year",
         "How the annual hotspot count changes with the confidence cut-off and the DBSCAN filter.", "sensitivitas_retensi_tahunan.csv", "Section 4.5.4, Table 4.15")

# 11 per-sub-district peat/hotspot table
sp = pd.read_csv(SRC / "hotspot_depth_per_kecamatan.csv")
sp_o = pd.DataFrame(dict(kecamatan=sp["kecamatan_clean"].map(title), hotspots_total=sp["N_hotspot_total"], hotspots_on_peat=sp["N_dalam_gambut"],
                         hotspots_off_peat=sp["N_luar_gambut"], pct_on_peat=sp["pct_dalam_gambut"],
                         mean_depth_class_at_fire=sp["fire_mean_depth"], mean_depth_class_of_landscape=sp["avg_depth_ordinal"]))
save_csv(sp_o, "hotspots_by_subdistrict_peat.csv", "Hotspots and peat depth by sub-district",
         "Hotspot totals, share on peat, mean depth class where fires occurred, and area-weighted mean depth class of the sub-district's peat.",
         "hotspot_depth_per_kecamatan.csv", "Section 4.3")

# oil palm by depth class (polygon level, Descals 2024)
op = pd.read_csv(SRC / "oilpalm_frac_descals_summary_per_depth.csv")
op_o = pd.DataFrame(dict(depth_class=op["depth_label"], polygons=op["n_polygons"], mean_oil_palm_fraction=op["mean_oilpalm_frac"].round(4),
                         median_oil_palm_fraction=op["median_oilpalm_frac"].round(4), pct_polygons_zero=op["pct_zero"].round(1)))
save_csv(op_o, "oil_palm_by_depth.csv", "Oil palm fraction by peat depth class",
         "Mean and median oil palm fraction (Descals et al. 2024 map) across the 208 peat polygons, by depth class.",
         "oilpalm_frac_descals_summary_per_depth.csv", "Section 4.6")

# ENSO heterogeneity per sub-district (Fisher 2x2 and Poisson IRR per ONI unit)
eh = pd.read_csv(SRC / "uji_heterogenitas_enso_per_kecamatan.csv")
eh_o = pd.DataFrame(dict(kecamatan=eh["kecamatan"].map(title), fire_months_el_nino=eh["bulan_api_ElNino"], fire_months_other=eh["bulan_api_lain"],
                         odds_ratio_fisher=eh["OR_fisher"].round(2), p_fisher=eh["p_fisher"].round(4), irr_per_oni_c=eh["IRR_ONI"].round(2),
                         irr_ci95_low=eh["IRR_lo"].round(2), irr_ci95_high=eh["IRR_hi"].round(2), p_irr=eh["p_IRR"].round(4),
                         hotspots_total=eh["total_hotspot"], n_fire_months=eh["n_bulan_api"], p_irr_bh=eh["p_IRR_BH"].round(4), p_fisher_bh=eh["p_fisher_BH"].round(4)))
save_csv(eh_o, "enso_response_by_subdistrict.csv", "ENSO response by sub-district",
         "Share of fire months in El Niño vs other phases (Fisher test) and Poisson incidence rate ratio per +1 °C ONI, per sub-district, with Benjamini–Hochberg-adjusted p-values.",
         "uji_heterogenitas_enso_per_kecamatan.csv", "Section 4.5.5, Table 4.17")

# ───────────────────────── small JSON for charts ─────────────────────────
mon = panel.groupby(["year", "month"]).agg(oni=("oni", "first"), hotspots=("hotspot_count", "sum"), phase=("phase", "first")).reset_index()
assert len(mon) == 120
assert int(mon.hotspots.sum()) == int(panel.hotspot_count.sum())
sea_cols = list(sea.columns)

report = dict(
    monthly=[dict(y=int(r.year), m=int(r.month), oni=round(float(r.oni), 2), n=int(r.hotspots), ph={"El Nino": "E", "La Nina": "L"}.get(r.phase, "N")) for r in mon.itertuples()],
    annual=ann.to_dict("records"),
    seasonal=sea.to_dict("records"),
    seasonal_cols=sea_cols,
    kecamatan=sm_out.round(4).to_dict("records"),
    ews=ews_o[["kecamatan", "alert_level", "oni_lag_months", "spearman_r_oni_best_lag", "oni_threshold", "spei_threshold",
               "p_fire_annual", "p_fire_el_nino", "p_fire_el_nino_dry", "ews_window", "main_trigger"]].round(3).where(lambda d: d.notna(), None).to_dict("records"),
    depth=pd_o.to_dict("records"),
    canal_bins=cb_o.to_dict("records"),
    canal_by_depth=cd_o.to_dict("records"),
    canal_logit=lg.round(4).to_dict("records"),
    landcover=lc.where(lc.notna(), None).to_dict("records"),
    skill=sk.round(4).to_dict("records"),
    retention=rt.to_dict("records"),
    subdistrict_peat=sp_o.to_dict("records"),
    oil_palm=op_o.to_dict("records"),
    enso_het=eh_o.to_dict("records"),
    overlay=dict(bounds=bounds, legend_share_peat=share),
)
def clean(o):
    """Recursively turn NaN/inf and numpy scalars into JSON-safe values (NaN is not valid JSON)."""
    if isinstance(o, dict):
        return {k: clean(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [clean(v) for v in o]
    if isinstance(o, (np.floating, float)):
        return None if not np.isfinite(o) else float(o)
    if isinstance(o, np.integer):
        return int(o)
    if isinstance(o, np.bool_):
        return bool(o)
    return o


(ROOT / "src/data/thesis-report.json").write_text(json.dumps(clean(report), ensure_ascii=False, allow_nan=False))

# ───────────────────────── figures ─────────────────────────
FIGS = {
    "map_peat_canal_hotspot.png": "map-peat-canal-hotspot",
    "hotspot_vs_canal_distance.png": "hotspot-vs-canal-distance",
    "hotspot_peat_depth_analysis.png": "hotspot-peat-depth-analysis",
    "cropland_frac_per_depth_class.png": "cropland-by-depth",
    "oilpalm_frac_descals_per_depth_class.png": "oilpalm-by-depth",
    "fig_ews_operasional.png": "ews-operational",
    "profil_musim_api_empiris.png": "seasonal-profile",
    "gambar_oni_timeseries.png": "oni-timeseries",
    "hotspots_by_year_peat_vs_nonpeat_2015_2024.png": "hotspots-by-year-peat",
    "fig_lag_heatmap_oni.png": "lag-heatmap-oni",
    "composite_vulnerability_index_v3.png": "vulnerability-index",
    "ablasi_kelompok_fitur.png": "ablation-feature-groups",
    "fig_model_evaluation_loko.png": "model-evaluation-loko",
    "shap_summary.png": "shap-summary",
    "fig_emerging_hotspot.png": "emerging-hotspot",
    "fig_mannkendall_trend.png": "mannkendall-trend",
}
for src_name, slug in FIGS.items():
    p = SRC / src_name
    if not p.exists():
        print("missing figure", src_name); continue
    im = Image.open(p).convert("RGB")
    if im.width > 1800:
        im = im.resize((1800, round(im.height * 1800 / im.width)), Image.LANCZOS)
    im.save(IMG / f"{slug}.webp", quality=82, method=6)
    manifest.append(dict(file=f"../image/thesis/{slug}.webp", kind="figure", title=slug, source=src_name, bytes=(IMG / f"{slug}.webp").stat().st_size))

(ROOT / "src/data/thesis-datasets.json").write_text(json.dumps(
    [m for m in manifest if m.get("kind") != "figure"], ensure_ascii=False, indent=1))

# ───────────────────────── sanity checks vs thesis text ─────────────────────────
on_peat = int(hs.on_peat.sum())
print("on peat:", on_peat, f"{100*on_peat/len(hs):.1f}%")
cnt = hs.groupby("kecamatan").size().sort_values(ascending=False)
print(cnt.to_string())
ref = pd.read_csv(SRC / "hotspot_depth_per_kecamatan.csv")
ref["k"] = ref["kecamatan_clean"].map(title)
cmp_ = ref.set_index("k")["N_hotspot_total"]
diff = (cnt - cmp_.reindex(cnt.index)).abs()
print("max diff vs source per-kecamatan totals:", int(diff.max()))
assert abs(100 * on_peat / len(hs) - 91.1) < 0.2, "peat share differs from thesis 91.1%"
print("OK")
