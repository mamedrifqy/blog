// Numbers transcribed from the thesis notebook outputs (Thesis_14102026_perbaikan_1.ipynb).
// Cell references in comments are 0-based notebook cell indices.
import { D } from '../paper/shared.js';
export { D };
export const KEC = Object.keys(D.kec); // title-case kecamatan names (same keys as the paper map)

// ---------- Post 1: hotspots vs burned area ----------
// Cell 111: Tier 1, hotspot month (fire_occurrence) vs MCD64A1 (>=1 burned pixel), per kecamatan, 2015-2024 monthly (120 months each)
export const TIER1 = {
  'ALL':             { hsMonths: 327, burnMonths: 155, precision: .324, recall: .684, f1: .440, kappa: .334, mcc: .369, precisionPm1: .535, recallPm1: .832, rho: .435 },
  'Bandar Laksamana':{ hsMonths: 69, burnMonths: 38, precision: .406, recall: .737, f1: .523, kappa: .194, mcc: .223, precisionPm1: .696, recallPm1: .921, rho: .404 },
  'Bantan':          { hsMonths: 23, burnMonths: 12, precision: .478, recall: .917, f1: .629, kappa: .572, mcc: .614, precisionPm1: .652, recallPm1: 1.0, rho: .688 },
  'Bathin Solapan':  { hsMonths: 23, burnMonths: 4,  precision: .130, recall: .750, f1: .222, kappa: .175, mcc: .263, precisionPm1: .217, recallPm1: 1.0, rho: .321 },
  'Bengkalis':       { hsMonths: 23, burnMonths: 11, precision: .391, recall: .818, f1: .529, kappa: .463, mcc: .506, precisionPm1: .565, recallPm1: 1.0, rho: .568 },
  'Bukit Batu':      { hsMonths: 20, burnMonths: 22, precision: .200, recall: .182, f1: .190, kappa: .019, mcc: .019, precisionPm1: .350, recallPm1: .273, rho: .053 },
  'Mandau':          { hsMonths: 8,  burnMonths: 2,  precision: .125, recall: .500, f1: .200, kappa: .178, mcc: .226, precisionPm1: .125, recallPm1: .500, rho: .244 },
  'Pinggir':         { hsMonths: 31, burnMonths: 11, precision: .323, recall: .909, f1: .476, kappa: .394, mcc: .472, precisionPm1: .516, recallPm1: 1.0, rho: .552 },
  'Rupat':           { hsMonths: 49, burnMonths: 28, precision: .429, recall: .750, f1: .545, kappa: .353, mcc: .383, precisionPm1: .673, recallPm1: .893, rho: .485 },
  'Rupat Utara':     { hsMonths: 19, burnMonths: 11, precision: .421, recall: .727, f1: .533, kappa: .472, mcc: .495, precisionPm1: .684, recallPm1: .909, rho: .536 },
  'Siak Kecil':      { hsMonths: 27, burnMonths: 7,  precision: .148, recall: .571, f1: .235, kappa: .157, mcc: .206, precisionPm1: .370, recallPm1: .857, rho: .239 },
  'Talang Muandau':  { hsMonths: 35, burnMonths: 9,  precision: .200, recall: .778, f1: .318, kappa: .226, mcc: .305, precisionPm1: .400, recallPm1: .889, rho: .374 },
};
// Cell 110/115: MCD64A1 annual burned area, whole regency (ha)
export const MCD_ANNUAL = { 2015: 8508, 2016: 8221, 2017: 199, 2018: 4080, 2019: 12831, 2020: 3879, 2021: 5064, 2022: 521, 2023: 2332, 2024: 223 };
// Cell 115: signal comparison, hotspots vs MCD64A1 burned area (Spearman rho)
export const SIGNALS = [
  { label: 'ONI · monthly, pooled',                       hs: .241,  bu: .089 },
  { label: 'SPI-3 · monthly, pooled',                     hs: -.326, bu: -.190 },
  { label: 'ONI (Jul–Oct) · annual total, n = 110',       hs: .273,  bu: .216 },
  { label: 'SPI-3 (Jul–Oct) · annual total, n = 110',     hs: -.424, bu: -.227 },
  { label: 'ONI (Jul–Oct) · annual total, n = 10 years',  hs: .382,  bu: .297 },
  { label: 'SPI-3 (Jul–Oct) · annual total, n = 10 years',hs: -.818, bu: -.552 },
];
// Cell 119: monthly MCD64A1 burned area (ha) and DBSCAN hotspots, key years
export const MONTHLY = {
  2015: { mcd: [323,1005,3077,978,124,819,2132,50,0,0,0,0],   hs: [16,257,278,128,14,61,365,34,49,20,2,8] },
  2019: { mcd: [199,6627,3133,82,347,223,372,1159,688,0,0,0], hs: [1,237,249,6,31,7,47,119,134,3,0,10] },
  2023: { mcd: [0,0,546,611,381,422,124,0,248,0,0,0],         hs: [0,1,9,32,12,17,4,2,5,1,0,0] },
};
// Cell 119: 2019 by kecamatan [hotspots, MCD64A1 ha, dATBI ha]
export const Y2019 = {
  'Rupat': [251,5975.10,1641.27], 'Bengkalis': [139,1689.17,132.42], 'Rupat Utara': [5,1488.41,37.65], 'Bantan': [67,1338.90,321.43],
  'Bandar Laksamana': [113,1154.58,620.67], 'Pinggir': [93,595.88,243.45], 'Bukit Batu': [0,571.00,9.65], 'Siak Kecil': [90,539.10,407.26],
  'Talang Muandau': [28,372.42,370.09], 'Bathin Solapan': [57,99.31,160.48], 'Mandau': [1,0.00,17.78],
};
// Cell 114 (parsed from the output): Tier 2. Keys are "year|pre-fire window|index". Values follow T_LIST.
// ha = burned area (ha, whole regency); d500/d1000 = hit-rate difference (hotspot minus matched peat control); l500/l1000 = lift
export const T_LIST = [0.20, 0.27, 0.44, 0.66];
export const TIER2 = {"ha":{"2015|basah_sama_tahun|ATBI":[4405.0,2273.0,718.0,165.0],"2015|basah_sama_tahun|NBR":[91395.0,60193.0,23207.0,6860.0],"2015|kering_tahun_lalu|ATBI":[6076.0,3780.0,1522.0,487.0],"2015|kering_tahun_lalu|NBR":[88354.0,59560.0,26694.0,6155.0],"2019|basah_sama_tahun|ATBI":[1714.0,915.0,279.0,52.0],"2019|basah_sama_tahun|NBR":[94319.0,55948.0,18946.0,5798.0],"2019|kering_tahun_lalu|ATBI":[3962.0,2323.0,679.0,68.0],"2019|kering_tahun_lalu|NBR":[132695.0,88084.0,42970.0,18004.0],"2023|basah_sama_tahun|ATBI":[369.0,179.0,41.0,11.0],"2023|basah_sama_tahun|NBR":[102425.0,61633.0,19731.0,5486.0],"2023|kering_tahun_lalu|ATBI":[774.0,430.0,105.0,17.0],"2023|kering_tahun_lalu|NBR":[188877.0,123204.0,52043.0,19014.0]},"d500":{"2015|basah_sama_tahun|ATBI":[0.578,0.536,0.359,0.213],"2015|basah_sama_tahun|NBR":[0.058,0.102,0.382,0.387],"2015|kering_tahun_lalu|ATBI":[0.581,0.57,0.41,0.259],"2015|kering_tahun_lalu|NBR":[0.132,0.218,0.419,0.322],"2019|basah_sama_tahun|ATBI":[0.562,0.517,0.403,0.178],"2019|basah_sama_tahun|NBR":[0.036,0.085,0.403,0.652],"2019|kering_tahun_lalu|ATBI":[0.561,0.498,0.348,0.119],"2019|kering_tahun_lalu|NBR":[0.092,0.154,0.468,0.614],"2023|basah_sama_tahun|ATBI":[0.63,0.515,0.353,0.088],"2023|basah_sama_tahun|NBR":[0.027,0.049,0.233,0.581],"2023|kering_tahun_lalu|ATBI":[0.582,0.518,0.41,0.193],"2023|kering_tahun_lalu|NBR":[0.048,0.068,0.245,0.675]},"l500":{"2015|basah_sama_tahun|ATBI":[5.46,6.82,8.78,9.77],"2015|basah_sama_tahun|NBR":[1.06,1.12,1.82,4.16],"2015|kering_tahun_lalu|ATBI":[5.2,7.43,10.02,10.4],"2015|kering_tahun_lalu|NBR":[1.16,1.32,2.38,4.35],"2019|basah_sama_tahun|ATBI":[8.2,9.74,12.68,7.57],"2019|basah_sama_tahun|NBR":[1.04,1.09,1.78,6.65],"2019|kering_tahun_lalu|ATBI":[8.35,10.42,13.73,8.69],"2019|kering_tahun_lalu|NBR":[1.1,1.19,2.05,5.88],"2023|basah_sama_tahun|ATBI":[37.71,null,null,null],"2023|basah_sama_tahun|NBR":[1.03,1.06,1.4,5.16],"2023|kering_tahun_lalu|ATBI":[30.0,null,null,null],"2023|kering_tahun_lalu|NBR":[1.05,1.07,1.35,4.5]},"d1000":{"2015|basah_sama_tahun|ATBI":[0.565,0.591,0.483,0.344],"2015|basah_sama_tahun|NBR":[0.002,0.018,0.2,0.443],"2015|kering_tahun_lalu|ATBI":[0.567,0.615,0.509,0.425],"2015|kering_tahun_lalu|NBR":[0.029,0.069,0.347,0.433],"2019|basah_sama_tahun|ATBI":[0.613,0.606,0.542,0.288],"2019|basah_sama_tahun|NBR":[-0.006,0.004,0.16,0.603],"2019|kering_tahun_lalu|ATBI":[0.638,0.614,0.507,0.225],"2019|kering_tahun_lalu|NBR":[0.027,0.045,0.245,0.643],"2023|basah_sama_tahun|ATBI":[0.731,0.644,0.525,0.21],"2023|basah_sama_tahun|NBR":[0.014,0.043,0.169,0.642],"2023|kering_tahun_lalu|ATBI":[0.719,0.614,0.53,0.361],"2023|kering_tahun_lalu|NBR":[0.008,0.012,0.06,0.659]},"l1000":{"2015|basah_sama_tahun|ATBI":[3.34,4.42,6.04,6.88],"2015|basah_sama_tahun|NBR":[1.0,1.02,1.28,2.73],"2015|kering_tahun_lalu|ATBI":[3.12,4.61,6.73,8.77],"2015|kering_tahun_lalu|NBR":[1.03,1.08,1.65,3.33],"2019|basah_sama_tahun|ATBI":[4.67,5.62,7.25,6.35],"2019|basah_sama_tahun|NBR":[0.99,1.0,1.21,3.59],"2019|kering_tahun_lalu|ATBI":[4.51,5.64,7.3,6.9],"2019|kering_tahun_lalu|NBR":[1.03,1.05,1.33,3.55],"2023|basah_sama_tahun|ATBI":[10.41,24.5,24.0,10.2],"2023|basah_sama_tahun|NBR":[1.01,1.05,1.21,3.73],"2023|kering_tahun_lalu|ATBI":[9.14,13.75,23.0,16.0],"2023|kering_tahun_lalu|NBR":[1.01,1.01,1.06,3.16]}};
// Cell 117: annual burned area (ha, whole regency)
export const ANNUAL_AREA = [
  { year: 2015, hs: 1232, mcd: 8508,  datbi: 6076, ratio: .74 },
  { year: 2019, hs: 844,  mcd: 12831, datbi: 3962, ratio: .29 },
  { year: 2023, hs: 83,   mcd: 2332,  datbi: 774,  ratio: .33 },
];
// Cell 117: Spearman across the 11 kecamatan (per year) between dATBI, MCD64A1 and hotspot totals
export const SPEAR = [
  { label: '2015', dm: .806, dh: .738, mh: .767 },
  { label: '2019', dm: .282, dh: .718, mh: .618 },
  { label: '2023', dm: .881, dh: .887, mh: .876 },
  { label: 'pooled, n = 33', dm: .697, dh: .850, mh: .684 },
];
// Cell 120: share of dATBI (T = 0.20, dry-year-before pre-fire window) burned area within R metres of a hotspot, plus the area baseline
export const SHARE = {
  dbscan: { n: {2015:1029,2019:725,2023:83},   share: {500:{2015:.736,2019:.548,2023:.416},1000:{2015:.815,2019:.731,2023:.456},2000:{2015:.855,2019:.807,2023:.469}}, base: {500:{2015:.048,2019:.033,2023:.005},1000:{2015:.100,2019:.069,2023:.012},2000:{2015:.209,2019:.151,2023:.034}} },
  raw:    { n: {2015:1500,2019:1082,2023:177}, share: {500:{2015:.778,2019:.678,2023:.452},1000:{2015:.854,2019:.820,2023:.490},2000:{2015:.918,2019:.863,2023:.523}}, base: {500:{2015:.065,2019:.046,2023:.010},1000:{2015:.139,2019:.099,2023:.028},2000:{2015:.295,2019:.212,2023:.078}} },
  conf50: { n: {2015:1067,2019:760,2023:96},   share: {500:{2015:.741,2019:.550,2023:.427},1000:{2015:.827,2019:.738,2023:.467},2000:{2015:.883,2019:.822,2023:.482}}, base: {500:{2015:.051,2019:.035,2023:.006},1000:{2015:.110,2019:.076,2023:.016},2000:{2015:.241,2019:.168,2023:.046}} },
};
// Cell 121: ESA WorldCover class under hotspots vs under matched peat control points (% of points) [control, hotspot]
export const LANDCOVER = [
  { cls: 'Trees',               y2015: [87.1,69.7], y2019: [81.8,60.8], y2023: [82.3,65.1] },
  { cls: 'Grass',               y2015: [10.2,24.7], y2019: [14.6,36.0], y2023: [13.3,24.1] },
  { cls: 'Shrub',               y2015: [1.6,2.5],   y2019: [2.6,2.8],   y2023: [2.4,10.8] },
  { cls: 'Cropland / oil palm', y2015: [0.6,2.5],   y2019: [0.7,0.3],   y2023: [1.6,0.0] },
];

// ---------- Post 2: ablation ----------
// Cells 104-105: leave-one-kecamatan-out (11 folds); pooled AUC with 95% bootstrap CI across kecamatan, mean per-fold AUC, average precision
export const ABL = [
  { id: 'full',     label: 'Random forest · all 14 features', n: 14, auc: .7965, lo: .7651, hi: .8338, fold: .8185, ap: .5884, group: 'ref' },
  { id: 'seas',     label: 'Seasonality only (month, dry-season flag)', n: 2, auc: .5860, lo: .5542, hi: .6286, fold: .6480, ap: .2739, group: 'only' },
  { id: 'clim',     label: 'Climate only (ONI, SPEI-3, SPI-3, rain, temperature)', n: 5, auc: .7346, lo: .6957, hi: .7862, fold: .7926, ap: .5218, group: 'only' },
  { id: 'static',   label: 'Static only (peat, water, oil palm, deforestation, population, NDVI trend)', n: 7, auc: .5898, lo: .4920, hi: .6866, fold: .5000, ap: .3035, group: 'only' },
  { id: 'climseas', label: 'Climate + seasonality', n: 7, auc: .7439, lo: .7050, hi: .7975, fold: .8031, ap: .5335, group: 'only' },
  { id: 'noONI',    label: 'All features minus ONI', n: 13, auc: .7838, lo: .7493, hi: .8215, fold: .8038, ap: .5655, group: 'drop' },
  { id: 'noClim',   label: 'All features minus climate', n: 9, auc: .6839, lo: .6364, hi: .7281, fold: .6676, ap: .3722, group: 'drop' },
  { id: 'noSeas',   label: 'All features minus seasonality', n: 12, auc: .7873, lo: .7564, hi: .8240, fold: .8154, ap: .5700, group: 'drop' },
  { id: 'noBio',    label: 'All features minus biophysical-static', n: 11, auc: .8010, lo: .7731, hi: .8337, fold: .8202, ap: .5929, group: 'drop' },
  { id: 'noAnthro', label: 'All features minus anthropogenic', n: 10, auc: .7728, lo: .7327, hi: .8193, fold: .8141, ap: .5490, group: 'drop' },
  { id: 'logfull',  label: 'Logistic regression · all features', n: 14, auc: .7809, lo: .7201, hi: .8284, fold: .7840, ap: .5747, group: 'lr' },
  { id: 'logclim',  label: 'Logistic regression · climate + seasonality', n: 7, auc: .7453, lo: .7131, hi: .7900, fold: .7778, ap: .4975, group: 'lr' },
];
export const FIRE_PREVALENCE = 0.248;
// Cell 105: paired differences (A minus B)
export const PAIRED = [
  { a: 'All features', b: 'all minus climate',          pooled: '+0.113', ci: '[+0.060, +0.166]', fold: '+0.151', better: '11/11', p: '0.001' },
  { a: 'All features', b: 'all minus ONI',              pooled: '+0.013', ci: '[+0.006, +0.020]', fold: '+0.015', better: '10/11', p: '0.002' },
  { a: 'Climate + seasonality', b: 'seasonality only',  pooled: '+0.158', ci: '[+0.124, +0.191]', fold: '+0.155', better: '11/11', p: '0.001' },
  { a: 'All features', b: 'climate + seasonality',      pooled: '+0.053', ci: '[+0.002, +0.084]', fold: '+0.015', better: '7/11',  p: '0.206' },
  { a: 'Random forest', b: 'logistic regression',       pooled: '+0.016', ci: '[−0.024, +0.065]', fold: '+0.034', better: '11/11', p: '0.001' },
];
// Cell 107: share of mean |SHAP| by feature group on held-out predictions (%)
export const SHAP_SHARE = {
  'All kecamatan': { Climate: 61.9, Seasonal: 8.3, 'Biophysical-static': 11.6, Anthropogenic: 18.2 },
  'Mandau':        { Climate: 63.9, Seasonal: 11.0, 'Biophysical-static': 8.3, Anthropogenic: 16.7 },
  'Pinggir':       { Climate: 62.0, Seasonal: 8.1, 'Biophysical-static': 15.6, Anthropogenic: 14.3 },
};
// Cell 96: leave-one-kecamatan-out [AUC, F1], 14 features, each kecamatan held out in turn
export const LOKO = {
  'Talang Muandau': [.8094,.6071], 'Siak Kecil': [.8773,.5957], 'Rupat Utara': [.8515,.5000], 'Rupat': [.8327,.5000], 'Pinggir': [.7474,.2162],
  'Mandau': [.8917,.3158], 'Bukit Batu': [.7475,.4762], 'Bengkalis': [.8476,.5294], 'Bathin Solapan': [.8409,.3871], 'Bantan': [.7696,.4865], 'Bandar Laksamana': [.7874,.5102],
};
// Cells 127, 129: hotspots, peat area (ha), fire-weighted peat depth class, mean fire probability
export const KECSTAT = {
  'Bandar Laksamana': { hs: 641, peat: 119136.6, depth: 4.03, prob: .570 }, 'Bantan': { hs: 230, peat: 29702.2, depth: 4.80, prob: .190 },
  'Bathin Solapan': { hs: 182, peat: 36483.8, depth: 4.20, prob: .187 }, 'Bengkalis': { hs: 402, peat: 34864.6, depth: 4.65, prob: .197 },
  'Bukit Batu': { hs: 116, peat: 49343.9, depth: 5.00, prob: .181 }, 'Mandau': { hs: 23, peat: 5654.8, depth: 4.40, prob: .082 },
  'Pinggir': { hs: 353, peat: 29492.2, depth: 4.84, prob: .246 }, 'Rupat': { hs: 976, peat: 78083.8, depth: 2.56, prob: .398 },
  'Rupat Utara': { hs: 152, peat: 10295.7, depth: 3.24, prob: .169 }, 'Siak Kecil': { hs: 281, peat: 79957.6, depth: 4.18, prob: .223 },
  'Talang Muandau': { hs: 180, peat: 38249.7, depth: 2.83, prob: .279 },
};

// ---------- Post 3: space and time ----------
// Cell 39: seasonal Mann-Kendall on monthly hotspot counts, per kecamatan [tau, p]
export const MK = {
  'Bandar Laksamana': [-.174,.0078], 'Bantan': [-.161,.0006], 'Bathin Solapan': [-.131,.0052], 'Bengkalis': [-.217,.0000], 'Bukit Batu': [-.183,.0000],
  'Mandau': [-.030,.3491], 'Pinggir': [-.161,.0017], 'Rupat': [-.146,.0163], 'Rupat Utara': [-.144,.0007], 'Siak Kecil': [-.267,.0000], 'Talang Muandau': [-.124,.0263],
};
// Cell 63: optimal lag (months) and Spearman r, ONI and SPEI-3 -> hotspots (lags 0-6)
export const LAGS = {
  'Bandar Laksamana': { oni: [2,.347], spei: [0,-.411] }, 'Bantan': { oni: [5,.323], spei: [4,-.351] }, 'Bathin Solapan': { oni: [5,.351], spei: [0,-.321] },
  'Bengkalis': { oni: [3,.353], spei: [3,-.420] }, 'Bukit Batu': { oni: [1,.309], spei: [0,-.283] }, 'Mandau': { oni: [6,.245], spei: [6,-.240] },
  'Pinggir': { oni: [5,.221], spei: [0,-.191] }, 'Rupat': { oni: [0,.340], spei: [0,-.307] }, 'Rupat Utara': { oni: [0,.212], spei: [4,-.362] },
  'Siak Kecil': { oni: [3,.424], spei: [0,-.479] }, 'Talang Muandau': { oni: [6,.305], spei: [0,-.424] },
};
// Cell 53: Local Moran's I class of each kecamatan in five two-year periods (NS = not significant)
export const EMERGING = {
  'Bandar Laksamana': ['NS','NS','NS','NS','NS'], 'Bantan': ['NS','NS','NS','NS','NS'], 'Bathin Solapan': ['NS','HH','NS','NS','NS'],
  'Bengkalis': ['NS','NS','NS','NS','NS'], 'Bukit Batu': ['NS','NS','NS','NS','NS'], 'Mandau': ['NS','LH','NS','NS','NS'],
  'Pinggir': ['LL','NS','NS','NS','NS'], 'Rupat': ['NS','NS','NS','NS','HL'], 'Rupat Utara': ['NS','NS','LH','NS','NS'],
  'Siak Kecil': ['NS','NS','NS','NS','NS'], 'Talang Muandau': ['NS','LH','NS','NS','NS'],
};
export const PERIODS = ['2015–16','2017–18','2019–20','2021–22','2023–24'];
// Cell 45: whole-period LISA on mean monthly hotspots: only Rupat Utara (low-high, p = 0.001) was significant. Cell 43: global Moran's I
export const MORAN_GLOBAL = { I: -.3766, p: .096 };
// Cell 48: Moran's I by ENSO phase
export const MORAN_PHASE = [
  { phase: 'El Niño', n: 43, I: -.1287, p: .476 }, { phase: 'La Niña', n: 32, I: .0432, p: .303 }, { phase: 'Neutral', n: 45, I: -.1228, p: .497 },
];
// Cell 57: Spearman r between rainfall and hotspots, pooled and per kecamatan
export const SIMPSON = { global: -.3252, kec: { 'Bandar Laksamana': -.3524, 'Bantan': -.2684, 'Bathin Solapan': -.3259, 'Bengkalis': -.2613, 'Bukit Batu': -.2040, 'Mandau': -.1413, 'Pinggir': -.3166, 'Rupat': -.4605, 'Rupat Utara': -.4174, 'Siak Kecil': -.4482, 'Talang Muandau': -.4369 } };
// Cell 50: ST-DBSCAN (anchors >= 70%, eps 1.5 km, 30 days, min 3 points): the ten largest events
export const ST_EVENTS = [
  { id: 27,  n: 115, start: '2015-06-25', end: '2015-08-01', days: 37 }, { id: 88,  n: 102, start: '2019-02-14', end: '2019-03-18', days: 32 },
  { id: 85,  n: 78,  start: '2018-07-16', end: '2018-08-26', days: 41 }, { id: 10,  n: 71,  start: '2015-02-21', end: '2015-04-17', days: 55 },
  { id: 5,   n: 67,  start: '2015-02-07', end: '2015-02-12', days: 5 },  { id: 13,  n: 65,  start: '2015-03-01', end: '2015-04-06', days: 36 },
  { id: 126, n: 65,  start: '2021-03-04', end: '2021-03-14', days: 10 }, { id: 92,  n: 60,  start: '2019-03-14', end: '2019-03-19', days: 5 },
  { id: 116, n: 58,  start: '2020-02-29', end: '2020-03-20', days: 20 }, { id: 87,  n: 57,  start: '2019-01-31', end: '2019-02-28', days: 28 },
];
