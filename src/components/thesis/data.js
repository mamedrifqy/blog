// Numbers transcribed from the v3 thesis notebook run (Thesis_15102026_tersusun_3.ipynb, full re-run).
// Cell references in comments are 0-based cell indices of the v3 notebook (393 cells; two cells were inserted vs. v2).
// Hotspot pipeline v3: FIRMS MODIS, TYPE==0 only, DBSCAN-filtered => 3,402 hotspots in Bengkalis (3,100 on peat, 91.1%).
import { D } from '../paper/shared.js';
export { D };
export const KEC = Object.keys(D.kec); // title-case kecamatan names (same keys as the paper map)

// ---------- Post 1: hotspots vs burned area ----------
// Cell 210: Tier 1, hotspot month (fire_occurrence) vs MCD64A1 (>=1 burned pixel), per kecamatan, 2015-2024 monthly (120 months each)
export const TIER1 = {
  'ALL':             { hsMonths: 319, burnMonths: 155, precision: .326, recall: .671, f1: .439, kappa: .333, mcc: .366, precisionPm1: .539, recallPm1: .832, rho: .428 },
  'Bandar Laksamana':{ hsMonths: 69, burnMonths: 38, precision: .406, recall: .737, f1: .523, kappa: .194, mcc: .223, precisionPm1: .696, recallPm1: .921, rho: .404 },
  'Bantan':          { hsMonths: 22, burnMonths: 12, precision: .500, recall: .917, f1: .647, kappa: .595, mcc: .632, precisionPm1: .682, recallPm1: 1.0, rho: .699 },
  'Bathin Solapan':  { hsMonths: 23, burnMonths: 4,  precision: .130, recall: .750, f1: .222, kappa: .175, mcc: .263, precisionPm1: .217, recallPm1: 1.0, rho: .321 },
  'Bengkalis':       { hsMonths: 20, burnMonths: 11, precision: .450, recall: .818, f1: .581, kappa: .524, mcc: .555, precisionPm1: .650, recallPm1: 1.0, rho: .601 },
  'Bukit Batu':      { hsMonths: 20, burnMonths: 22, precision: .200, recall: .182, f1: .190, kappa: .019, mcc: .019, precisionPm1: .350, recallPm1: .273, rho: .053 },
  'Mandau':          { hsMonths: 7,  burnMonths: 2,  precision: .143, recall: .500, f1: .222, kappa: .202, mcc: .245, precisionPm1: .143, recallPm1: .500, rho: .262 },
  'Pinggir':         { hsMonths: 31, burnMonths: 11, precision: .323, recall: .909, f1: .476, kappa: .394, mcc: .472, precisionPm1: .516, recallPm1: 1.0, rho: .552 },
  'Rupat':           { hsMonths: 49, burnMonths: 28, precision: .429, recall: .750, f1: .545, kappa: .353, mcc: .383, precisionPm1: .673, recallPm1: .893, rho: .485 },
  'Rupat Utara':     { hsMonths: 16, burnMonths: 11, precision: .375, recall: .545, f1: .444, kappa: .377, mcc: .385, precisionPm1: .625, recallPm1: .909, rho: .416 },
  'Siak Kecil':      { hsMonths: 27, burnMonths: 7,  precision: .148, recall: .571, f1: .235, kappa: .157, mcc: .206, precisionPm1: .370, recallPm1: .857, rho: .239 },
  'Talang Muandau':  { hsMonths: 35, burnMonths: 9,  precision: .200, recall: .778, f1: .318, kappa: .226, mcc: .305, precisionPm1: .400, recallPm1: .889, rho: .374 },
};
// Cell 110/115: MCD64A1 annual burned area, whole regency (ha) - satellite product, unchanged by the hotspot re-run
export const MCD_ANNUAL = { 2015: 8508, 2016: 8221, 2017: 199, 2018: 4080, 2019: 12831, 2020: 3879, 2021: 5064, 2022: 521, 2023: 2332, 2024: 223 };
// Cell 210/218: signal comparison, hotspots vs MCD64A1 burned area (Spearman rho)
export const SIGNALS = [
  { label: 'ONI · monthly, pooled',                       hs: .231,  bu: .087 },
  { label: 'SPI-3 · monthly, pooled',                     hs: -.293, bu: -.165 },
  { label: 'ONI (Jul–Oct) · annual total, n = 110',       hs: .254,  bu: .216 },
  { label: 'SPI-3 (Jul–Oct) · annual total, n = 110',     hs: -.391, bu: -.212 },
  { label: 'ONI (Jul–Oct) · annual total, n = 10 years',  hs: .382,  bu: .297 },
  { label: 'SPI-3 (Jul–Oct) · annual total, n = 10 years',hs: -.770, bu: -.527 },
];
// Cell 224: monthly MCD64A1 burned area (ha) and DBSCAN hotspots, key years
export const MONTHLY = {
  2015: { mcd: [323,1005,3077,978,124,819,2132,50,0,0,0,0],   hs: [8,231,190,123,14,61,364,34,49,20,1,6] },
  2019: { mcd: [199,6627,3133,82,347,223,372,1159,688,0,0,0], hs: [1,237,249,6,31,7,46,119,134,3,0,10] },
  2023: { mcd: [0,0,546,611,381,422,124,0,248,0,0,0],         hs: [0,1,9,32,12,17,4,2,5,1,0,0] },
};
// Cell 224: 2019 by kecamatan [hotspots, MCD64A1 ha, dATBI ha]
export const Y2019 = {
  'Rupat': [251,5975.10,1641.27], 'Bengkalis': [139,1689.17,132.42], 'Rupat Utara': [4,1488.41,37.65], 'Bantan': [67,1338.90,321.43],
  'Bandar Laksamana': [113,1154.58,620.67], 'Pinggir': [93,595.88,243.45], 'Bukit Batu': [0,571.00,9.65], 'Siak Kecil': [90,539.10,407.26],
  'Talang Muandau': [28,372.42,370.09], 'Bathin Solapan': [57,99.31,160.48], 'Mandau': [1,0.00,17.78],
};
// Cell 214: Tier 2 (cached output, identical to v2: it depends on Sentinel-2 indices, not on the hotspot list). Keys are "year|pre-fire window|index". Values follow T_LIST.
export const T_LIST = [0.20, 0.27, 0.44, 0.66];
export const TIER2 = {"ha":{"2015|basah_sama_tahun|ATBI":[4405.0,2273.0,718.0,165.0],"2015|basah_sama_tahun|NBR":[91395.0,60193.0,23207.0,6860.0],"2015|kering_tahun_lalu|ATBI":[6076.0,3780.0,1522.0,487.0],"2015|kering_tahun_lalu|NBR":[88354.0,59560.0,26694.0,6155.0],"2019|basah_sama_tahun|ATBI":[1714.0,915.0,279.0,52.0],"2019|basah_sama_tahun|NBR":[94319.0,55948.0,18946.0,5798.0],"2019|kering_tahun_lalu|ATBI":[3962.0,2323.0,679.0,68.0],"2019|kering_tahun_lalu|NBR":[132695.0,88084.0,42970.0,18004.0],"2023|basah_sama_tahun|ATBI":[369.0,179.0,41.0,11.0],"2023|basah_sama_tahun|NBR":[102425.0,61633.0,19731.0,5486.0],"2023|kering_tahun_lalu|ATBI":[774.0,430.0,105.0,17.0],"2023|kering_tahun_lalu|NBR":[188877.0,123204.0,52043.0,19014.0]},"d500":{"2015|basah_sama_tahun|ATBI":[0.578,0.536,0.359,0.213],"2015|basah_sama_tahun|NBR":[0.058,0.102,0.382,0.387],"2015|kering_tahun_lalu|ATBI":[0.581,0.57,0.41,0.259],"2015|kering_tahun_lalu|NBR":[0.132,0.218,0.419,0.322],"2019|basah_sama_tahun|ATBI":[0.562,0.517,0.403,0.178],"2019|basah_sama_tahun|NBR":[0.036,0.085,0.403,0.652],"2019|kering_tahun_lalu|ATBI":[0.561,0.498,0.348,0.119],"2019|kering_tahun_lalu|NBR":[0.092,0.154,0.468,0.614],"2023|basah_sama_tahun|ATBI":[0.63,0.515,0.353,0.088],"2023|basah_sama_tahun|NBR":[0.027,0.049,0.233,0.581],"2023|kering_tahun_lalu|ATBI":[0.582,0.518,0.41,0.193],"2023|kering_tahun_lalu|NBR":[0.048,0.068,0.245,0.675]},"l500":{"2015|basah_sama_tahun|ATBI":[5.46,6.82,8.78,9.77],"2015|basah_sama_tahun|NBR":[1.06,1.12,1.82,4.16],"2015|kering_tahun_lalu|ATBI":[5.2,7.43,10.02,10.4],"2015|kering_tahun_lalu|NBR":[1.16,1.32,2.38,4.35],"2019|basah_sama_tahun|ATBI":[8.2,9.74,12.68,7.57],"2019|basah_sama_tahun|NBR":[1.04,1.09,1.78,6.65],"2019|kering_tahun_lalu|ATBI":[8.35,10.42,13.73,8.69],"2019|kering_tahun_lalu|NBR":[1.1,1.19,2.05,5.88],"2023|basah_sama_tahun|ATBI":[37.71,null,null,null],"2023|basah_sama_tahun|NBR":[1.03,1.06,1.4,5.16],"2023|kering_tahun_lalu|ATBI":[30.0,null,null,null],"2023|kering_tahun_lalu|NBR":[1.05,1.07,1.35,4.5]},"d1000":{"2015|basah_sama_tahun|ATBI":[0.565,0.591,0.483,0.344],"2015|basah_sama_tahun|NBR":[0.002,0.018,0.2,0.443],"2015|kering_tahun_lalu|ATBI":[0.567,0.615,0.509,0.425],"2015|kering_tahun_lalu|NBR":[0.029,0.069,0.347,0.433],"2019|basah_sama_tahun|ATBI":[0.613,0.606,0.542,0.288],"2019|basah_sama_tahun|NBR":[-0.006,0.004,0.16,0.603],"2019|kering_tahun_lalu|ATBI":[0.638,0.614,0.507,0.225],"2019|kering_tahun_lalu|NBR":[0.027,0.045,0.245,0.643],"2023|basah_sama_tahun|ATBI":[0.731,0.644,0.525,0.21],"2023|basah_sama_tahun|NBR":[0.014,0.043,0.169,0.642],"2023|kering_tahun_lalu|ATBI":[0.719,0.614,0.53,0.361],"2023|kering_tahun_lalu|NBR":[0.008,0.012,0.06,0.659]},"l1000":{"2015|basah_sama_tahun|ATBI":[3.34,4.42,6.04,6.88],"2015|basah_sama_tahun|NBR":[1.0,1.02,1.28,2.73],"2015|kering_tahun_lalu|ATBI":[3.12,4.61,6.73,8.77],"2015|kering_tahun_lalu|NBR":[1.03,1.08,1.65,3.33],"2019|basah_sama_tahun|ATBI":[4.67,5.62,7.25,6.35],"2019|basah_sama_tahun|NBR":[0.99,1.0,1.21,3.59],"2019|kering_tahun_lalu|ATBI":[4.51,5.64,7.3,6.9],"2019|kering_tahun_lalu|NBR":[1.03,1.05,1.33,3.55],"2023|basah_sama_tahun|ATBI":[10.41,24.5,24.0,10.2],"2023|basah_sama_tahun|NBR":[1.01,1.05,1.21,3.73],"2023|kering_tahun_lalu|ATBI":[9.14,13.75,23.0,16.0],"2023|kering_tahun_lalu|NBR":[1.01,1.01,1.06,3.16]}};
// ha = burned area (ha, whole regency); d500/d1000 = hit-rate difference (hotspot minus matched peat control); l500/l1000 = lift
// Cell 221: annual burned area (ha, whole regency); hotspots = DBSCAN-filtered, calendar year
export const ANNUAL_AREA = [
  { year: 2015, hs: 1101, mcd: 8508,  datbi: 6076, ratio: .74 },
  { year: 2019, hs: 843,  mcd: 12831, datbi: 3962, ratio: .29 },
  { year: 2023, hs: 83,   mcd: 2332,  datbi: 774,  ratio: .33 },
];
// Cell 221: Spearman across the 11 kecamatan (per year) between dATBI, MCD64A1 and calendar-year hotspot totals (cell 234 gives a window-aligned variant: 2019 dh/mh .673, pooled .808/.696)
export const SPEAR = [
  { label: '2015', dm: .806, dh: .600, mh: .547 },
  { label: '2019', dm: .282, dh: .718, mh: .618 },
  { label: '2023', dm: .881, dh: .887, mh: .876 },
  { label: 'pooled, n = 33', dm: .697, dh: .827, mh: .664 },
];
// Cell 226: share of dATBI (T = 0.20, dry-year-before pre-fire window) burned area within R metres of a hotspot, plus the area baseline (cached output)
export const SHARE = {
  dbscan: { n: {2015:1029,2019:725,2023:83},   share: {500:{2015:.736,2019:.548,2023:.416},1000:{2015:.815,2019:.731,2023:.456},2000:{2015:.855,2019:.807,2023:.469}}, base: {500:{2015:.048,2019:.033,2023:.005},1000:{2015:.100,2019:.069,2023:.012},2000:{2015:.209,2019:.151,2023:.034}} },
  raw:    { n: {2015:1500,2019:1082,2023:177}, share: {500:{2015:.778,2019:.678,2023:.452},1000:{2015:.854,2019:.820,2023:.490},2000:{2015:.918,2019:.863,2023:.523}}, base: {500:{2015:.065,2019:.046,2023:.010},1000:{2015:.139,2019:.099,2023:.028},2000:{2015:.295,2019:.212,2023:.078}} },
  conf50: { n: {2015:1067,2019:760,2023:96},   share: {500:{2015:.741,2019:.550,2023:.427},1000:{2015:.827,2019:.738,2023:.467},2000:{2015:.883,2019:.822,2023:.482}}, base: {500:{2015:.051,2019:.035,2023:.006},1000:{2015:.110,2019:.076,2023:.016},2000:{2015:.241,2019:.168,2023:.046}} },
};
// Cell 228: ESA WorldCover class under hotspots vs under matched peat control points (% of points) [control, hotspot]
export const LANDCOVER = [
  { cls: 'Trees',               y2015: [87.1,69.7], y2019: [81.8,60.9], y2023: [82.3,65.1] },
  { cls: 'Grass',               y2015: [10.3,24.5], y2019: [14.6,35.9], y2023: [13.3,24.1] },
  { cls: 'Shrub',               y2015: [1.5,2.5],   y2019: [2.6,2.8],   y2023: [2.4,10.8] },
  { cls: 'Cropland / oil palm', y2015: [0.5,2.7],   y2019: [0.7,0.3],   y2023: [1.6,0.0] },
];

// ---------- Post 2: ablation ----------
// Cells 196-198: leave-one-kecamatan-out (11 folds); pooled AUC with 95% bootstrap CI across kecamatan, mean per-fold AUC, average precision
export const ABL = [
  { id: 'full',     label: 'Random forest · all 14 features', n: 14, auc: .7947, lo: .7636, hi: .8259, fold: .8109, ap: .5849, group: 'ref' },
  { id: 'seas',     label: 'Seasonality only (month, dry-season flag)', n: 2, auc: .5861, lo: .5520, hi: .6336, fold: .6550, ap: .2662, group: 'only' },
  { id: 'clim',     label: 'Climate only (ONI, SPEI-3, SPI-3, rain, temperature)', n: 5, auc: .7267, lo: .6865, hi: .7793, fold: .7928, ap: .4966, group: 'only' },
  { id: 'static',   label: 'Static only (peat, water, oil palm, deforestation, population, NDVI trend)', n: 7, auc: .6236, lo: .4964, hi: .7247, fold: .5000, ap: .3653, group: 'only' },
  { id: 'climseas', label: 'Climate + seasonality', n: 7, auc: .7410, lo: .7020, hi: .7960, fold: .8070, ap: .5128, group: 'only' },
  { id: 'noONI',    label: 'All features minus ONI', n: 13, auc: .7856, lo: .7563, hi: .8130, fold: .8007, ap: .5563, group: 'drop' },
  { id: 'noClim',   label: 'All features minus climate', n: 9, auc: .7029, lo: .6379, hi: .7603, fold: .6758, ap: .4109, group: 'drop' },
  { id: 'noSeas',   label: 'All features minus seasonality', n: 12, auc: .7923, lo: .7610, hi: .8247, fold: .8100, ap: .5781, group: 'drop' },
  { id: 'noBio',    label: 'All features minus biophysical-static', n: 11, auc: .7988, lo: .7708, hi: .8265, fold: .8119, ap: .5904, group: 'drop' },
  { id: 'noAnthro', label: 'All features minus anthropogenic', n: 10, auc: .7499, lo: .7228, hi: .7921, fold: .8086, ap: .5117, group: 'drop' },
  { id: 'logfull',  label: 'Logistic regression · all features', n: 14, auc: .8063, lo: .7423, hi: .8514, fold: .7875, ap: .6190, group: 'lr' },
  { id: 'logclim',  label: 'Logistic regression · climate + seasonality', n: 7, auc: .7405, lo: .7085, hi: .7853, fold: .7795, ap: .4735, group: 'lr' },
];
export const FIRE_PREVALENCE = 0.242;
// Cell 198: paired differences (A minus B)
export const PAIRED = [
  { a: 'All features', b: 'all minus climate',          pooled: '+0.092', ci: '[+0.038, +0.151]', fold: '+0.135', better: '11/11', p: '0.001' },
  { a: 'All features', b: 'all minus ONI',              pooled: '+0.009', ci: '[+0.001, +0.017]', fold: '+0.010', better: '8/11',  p: '0.054' },
  { a: 'Climate + seasonality', b: 'seasonality only',  pooled: '+0.155', ci: '[+0.118, +0.191]', fold: '+0.152', better: '11/11', p: '0.001' },
  { a: 'All features', b: 'climate + seasonality',      pooled: '+0.054', ci: '[+0.002, +0.090]', fold: '+0.004', better: '6/11',  p: '0.465' },
  { a: 'Random forest', b: 'logistic regression',       pooled: '−0.012', ci: '[−0.054, +0.050]', fold: '+0.023', better: '10/11', p: '0.005' },
];
// Cell 202: share of mean |SHAP| by feature group on held-out predictions (%)
export const SHAP_SHARE = {
  'All kecamatan': { Climate: 59.1, Seasonal: 9.3, 'Biophysical-static': 9.7, Anthropogenic: 21.8 },
  'Mandau':        { Climate: 61.3, Seasonal: 12.1, 'Biophysical-static': 7.2, Anthropogenic: 19.5 },
  'Pinggir':       { Climate: 61.6, Seasonal: 8.4, 'Biophysical-static': 13.5, Anthropogenic: 16.5 },
};
// Cell 177: leave-one-kecamatan-out [AUC, F1], 14 features, each kecamatan held out in turn
export const LOKO = {
  'Talang Muandau': [.8182,.5185], 'Siak Kecil': [.8750,.5957], 'Rupat Utara': [.8365,.5185], 'Rupat': [.7962,.5217], 'Pinggir': [.7524,.1667],
  'Mandau': [.8938,.4211], 'Bukit Batu': [.7200,.4545], 'Bengkalis': [.8395,.5294], 'Bathin Solapan': [.8377,.2308], 'Bantan': [.7718,.4865], 'Bandar Laksamana': [.7792,.5000],
};
// Cells 240: hotspots, peat area (ha), fire-weighted peat depth class, mean out-of-fold fire probability
export const KECSTAT = {
  'Bandar Laksamana': { hs: 641, peat: 119136.6, depth: 4.36, prob: .515 }, 'Bantan': { hs: 198, peat: 29702.2, depth: 3.23, prob: .186 },
  'Bathin Solapan': { hs: 181, peat: 36483.8, depth: 3.24, prob: .182 }, 'Bengkalis': { hs: 356, peat: 34864.6, depth: 3.76, prob: .188 },
  'Bukit Batu': { hs: 116, peat: 49343.9, depth: 5.22, prob: .187 }, 'Mandau': { hs: 22, peat: 5654.8, depth: 2.87, prob: .114 },
  'Pinggir': { hs: 353, peat: 29492.2, depth: 4.52, prob: .230 }, 'Rupat': { hs: 976, peat: 78083.8, depth: 2.92, prob: .379 },
  'Rupat Utara': { hs: 98, peat: 10295.7, depth: 2.30, prob: .157 }, 'Siak Kecil': { hs: 281, peat: 79957.6, depth: 4.72, prob: .219 },
  'Talang Muandau': { hs: 180, peat: 38249.7, depth: 3.39, prob: .273 },
};

// ---------- Post 3: space and time ----------
// Cell 77: seasonal Mann-Kendall on monthly hotspot counts, per kecamatan [tau, p]
export const MK = {
  'Bandar Laksamana': [-.174,.0078], 'Bantan': [-.130,.0047], 'Bathin Solapan': [-.130,.0060], 'Bengkalis': [-.165,.0002], 'Bukit Batu': [-.183,.0000],
  'Mandau': [-.017,.5927], 'Pinggir': [-.161,.0017], 'Rupat': [-.146,.0163], 'Rupat Utara': [-.106,.0083], 'Siak Kecil': [-.267,.0000], 'Talang Muandau': [-.124,.0263],
};
// Cell 130: optimal lag (months) and Spearman r, ONI and SPEI-3 (GEV, 1991-2024 baseline) -> hotspots (lags 0-6)
export const LAGS = {
  'Bandar Laksamana': { oni: [2,.340], spei: [0,-.378] }, 'Bantan': { oni: [5,.302], spei: [5,-.354] }, 'Bathin Solapan': { oni: [5,.360], spei: [0,-.242] },
  'Bengkalis': { oni: [4,.298], spei: [0,-.336] }, 'Bukit Batu': { oni: [0,.299], spei: [0,-.234] }, 'Mandau': { oni: [6,.194], spei: [0,-.249] },
  'Pinggir': { oni: [4,.220], spei: [0,-.171] }, 'Rupat': { oni: [0,.337], spei: [0,-.402] }, 'Rupat Utara': { oni: [1,.182], spei: [4,-.361] },
  'Siak Kecil': { oni: [3,.435], spei: [0,-.426] }, 'Talang Muandau': { oni: [6,.303], spei: [0,-.404] },
};
// Cell 108: Local Moran's I class of each kecamatan in five two-year periods (NS = not significant)
export const EMERGING = {
  'Bandar Laksamana': ['NS','NS','NS','NS','NS'], 'Bantan': ['NS','NS','NS','NS','NS'], 'Bathin Solapan': ['NS','HH','NS','NS','NS'],
  'Bengkalis': ['NS','NS','NS','NS','NS'], 'Bukit Batu': ['NS','NS','NS','NS','NS'], 'Mandau': ['NS','LH','NS','NS','NS'],
  'Pinggir': ['NS','NS','NS','NS','NS'], 'Rupat': ['NS','NS','NS','NS','HL'], 'Rupat Utara': ['LH','NS','LH','NS','NS'],
  'Siak Kecil': ['NS','NS','NS','NS','NS'], 'Talang Muandau': ['NS','LH','NS','NS','NS'],
};
export const PERIODS = ['2015–16','2017–18','2019–20','2021–22','2023–24'];
// Cell 94/97: global Moran's I on mean monthly hotspots (p = 0.037, 999 permutations). Whole-period LISA (cell 97): no kecamatan significant.
export const MORAN_GLOBAL = { I: -.4492, p: .037 };
// Cell 102: Moran's I by ENSO phase
export const MORAN_PHASE = [
  { phase: 'El Niño', n: 44, I: -.2456, p: .255 }, { phase: 'La Niña', n: 30, I: .0941, p: .246 }, { phase: 'Neutral', n: 46, I: -.1433, p: .490 },
];
// Cell 115: Spearman r between rainfall and hotspots, pooled and per kecamatan
export const SIMPSON = { global: -.3216, kec: { 'Bandar Laksamana': -.3524, 'Bantan': -.2707, 'Bathin Solapan': -.3262, 'Bengkalis': -.2829, 'Bukit Batu': -.2040, 'Mandau': -.1512, 'Pinggir': -.3166, 'Rupat': -.4605, 'Rupat Utara': -.3871, 'Siak Kecil': -.4482, 'Talang Muandau': -.4369 } };
// Cell 105: ST-DBSCAN (anchors >= 70%, eps 1.5 km, 30 days, min 3 points): 136 events, the ten largest
export const ST_EVENTS = [
  { id: 25,  n: 115, start: '2015-06-25', end: '2015-08-01', days: 37 }, { id: 86,  n: 102, start: '2019-02-14', end: '2019-03-18', days: 32 },
  { id: 83,  n: 78,  start: '2018-07-16', end: '2018-08-26', days: 41 }, { id: 9,   n: 71,  start: '2015-02-21', end: '2015-04-17', days: 55 },
  { id: 4,   n: 67,  start: '2015-02-07', end: '2015-02-12', days: 5 },  { id: 124, n: 65,  start: '2021-03-04', end: '2021-03-14', days: 10 },
  { id: 90,  n: 60,  start: '2019-03-14', end: '2019-03-19', days: 5 },  { id: 114, n: 58,  start: '2020-02-29', end: '2020-03-20', days: 20 },
  { id: 85,  n: 57,  start: '2019-01-31', end: '2019-02-28', days: 28 }, { id: 61,  n: 52,  start: '2016-03-29', end: '2016-05-01', days: 33 },
];
