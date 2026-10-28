// Methods glossary for the thesis posts.
// Formulas are the thesis's own equations (Chapter 3, Eq. 3.1–3.13) wherever the thesis writes them out.
// Where the thesis only cites a method (e.g. Wilson interval, VIF), the entry gives the standard textbook
// definition and says so in `note`, so nothing here is presented as the thesis's own derivation.
// `thesis` lines only restate what the thesis reports; `ref` points to where.
import katex from 'katex';

export interface Entry {
  id: string;
  name: string;
  group: string;
  aliases?: string[];
  what: string;
  math?: string[];
  where?: [string, string][];
  thesis?: string;
  ref?: string;
  note?: string;
}

export const GROUPS = ['Climate indices', 'Hotspot processing', 'Tests and inference', 'Count models', 'Space and time', 'Machine learning', 'Early warning and validation', 'Canals and peat'] as const;

export const GLOSSARY: Entry[] = [
  // ───────── Climate indices ─────────
  {
    id: 'oni-phases', name: 'ONI and ENSO phase classification', group: 'Climate indices', aliases: ['ONI'],
    what: 'The Oceanic Niño Index is the three-month running mean of sea-surface-temperature anomalies in the Niño 3.4 region. A month counts as El Niño (La Niña) only if it sits inside a run of at least five consecutive months at or beyond the threshold.',
    math: ['\\text{El Niño: run of }\\ge 5\\text{ months with ONI}\\ \\ge +0.5^{\\circ}\\mathrm{C}\\qquad \\text{La Niña: run of }\\ge 5\\text{ months with ONI}\\ \\le -0.5^{\\circ}\\mathrm{C}'],
    thesis: 'Following the NOAA CPC definition. Of the 120 months, 44 are El Niño, 30 La Niña and 46 Neutral. Only one month changes class compared with a simple month-by-month threshold.',
    ref: 'Section 3.4',
  },
  {
    id: 'spi-3', name: 'SPI-3 (Standardised Precipitation Index, 3 months)', group: 'Climate indices', aliases: ['SPI-3', 'SPI3'],
    what: 'Three-month rainfall totals are fitted with a gamma distribution separately for each calendar month, then converted to a standard-normal score. Negative values are drier than normal.',
    math: ['X_t=\\sum_{k=0}^{2}P_{t-k}', 'H(x)=q_m+(1-q_m)\\,G_m(x)\\qquad \\mathrm{SPI}_t=\\Phi^{-1}\\!\\left[H(X_t)\\right]'],
    where: [['P_t', 'monthly precipitation'], ['G_m', 'gamma distribution fitted for calendar month m'], ['q_m', 'probability of zero precipitation'], ['\\Phi', 'standard normal distribution function']],
    thesis: 'Computed on a 1991–2024 baseline (CHIRPS), because ten values per calendar month are too few to fit a distribution; the 2015–2024 segment is then extracted.',
    ref: 'Section 3.5.1, Eq. 3.1',
  },
  {
    id: 'spei-3', name: 'SPEI-3 (Standardised Precipitation Evapotranspiration Index, 3 months)', group: 'Climate indices', aliases: ['SPEI-3', 'SPEI3'],
    what: 'Like SPI, but the quantity standardised is the climatic water balance (rainfall minus potential evapotranspiration), so warm, high-demand months count as drier. PET follows Thornthwaite; sums are standardised per calendar month with a generalised extreme value distribution.',
    math: ['D_t=P_t-\\mathrm{PET}_t', '\\mathrm{PET}=16\\,K\\left(\\frac{10\\,T}{I}\\right)^{a}'],
    where: [['T', 'monthly mean temperature'], ['I', 'annual heat index'], ['a', 'empirical function of I'], ['K', 'day-length correction']],
    thesis: 'Thornthwaite was chosen over Hargreaves–Samani as more stable in humid equatorial climates. Three-month sums of D are standardised with a GEV fitted by L-moments. The long-baseline SPEI-3 correlates at r = 0.94 with the 10-year version.',
    ref: 'Section 3.5.2, Eq. 3.2',
  },

  // ───────── Hotspot processing ─────────
  {
    id: 'dbscan', name: 'DBSCAN and the confidence-anchored hotspot filter', group: 'Hotspot processing', aliases: ['DBSCAN'],
    what: 'DBSCAN groups points that have enough neighbours within a radius ε. Here it clusters high-confidence detections, and medium-confidence detections are kept only if they lie within ε of such an anchor.',
    math: ['\\varepsilon=\\frac{1.5\\ \\mathrm{km}}{6371\\ \\mathrm{km}}=2.35\\times10^{-4}\\ \\mathrm{rad}\\quad(\\text{haversine metric})'],
    thesis: 'Anchors are detections with confidence ≥ 70%. Detections of 50–69% within 1.5 km of an anchor are rescued as probable smouldering peat fires; everything else is discarded. This turns 5,386 detections inside the regency into 3,402.',
    ref: 'Section 3.6',
  },
  {
    id: 'st-dbscan', name: 'ST-DBSCAN (spatio-temporal DBSCAN)', group: 'Hotspot processing', aliases: ['ST-DBSCAN'],
    what: 'DBSCAN with a second radius in time: two detections are neighbours only if they are close in both space and date. Used to identify discrete fire events.',
    math: ['d_{\\text{space}}\\le\\varepsilon_s\\ \\text{ and }\\ |\\Delta t|\\le\\varepsilon_t'],
    where: [['\\varepsilon_s', '1.5 km'], ['\\varepsilon_t', '30 days'], ['\\mathrm{MinPts}', '3']],
    thesis: 'Applied to high-confidence detections to identify fire events.',
    ref: 'Section 3.9',
  },

  // ───────── Tests and inference ─────────
  {
    id: 'kruskal-wallis', name: 'Kruskal–Wallis test', group: 'Tests and inference', aliases: ['Kruskal–Wallis', 'Kruskal-Wallis'],
    what: 'A rank-based test of whether several groups (here the three ENSO phases) share one distribution. All observations are pooled and ranked; H grows when the groups’ average ranks differ. The tie correction matters because most monthly counts are zero.',
    math: ['H=\\frac{12}{N(N+1)}\\sum_{g=1}^{k}\\frac{R_g^{2}}{n_g}-3(N+1)', 'H_c=\\frac{H}{1-\\dfrac{\\sum_j\\left(u_j^{3}-u_j\\right)}{N^{3}-N}}\\ \\sim\\ \\chi^{2}_{k-1}', '\\eta_H^{2}=\\frac{H-k+1}{N-k}'],
    where: [['N', 'all sub-district-months pooled'], ['n_g,\\ R_g', 'observations and rank sum in phase g'], ['u_j', 'observations tied at the j-th distinct value'], ['\\eta_H^2', 'effect size: share of rank variance associated with phase']],
    thesis: 'Monthly hotspot counts differ between ENSO phases: H = 77.9, η²H = 0.058 (Table 4.9). For SPEI-3, H = 358.9 and η²H = 0.271. A significant result is followed by Dunn’s test.',
    ref: 'Section 3.8.2, Eq. 3.3; Section 4.5.1',
  },
  {
    id: 'dunn', name: 'Dunn’s post-hoc test', group: 'Tests and inference', aliases: ['Dunn’s post-hoc', 'Dunn’s test', 'Dunn\'s test', 'Dunn’s'],
    what: 'After a significant Kruskal–Wallis result, Dunn’s test compares the groups pair by pair using the same global ranks, so you can say which phases differ.',
    math: ['z_{ab}=\\frac{\\bar R_a-\\bar R_b}{\\sqrt{\\left[\\dfrac{N(N+1)}{12}-\\dfrac{\\sum_j\\left(u_j^{3}-u_j\\right)}{12(N-1)}\\right]\\left(\\dfrac{1}{n_a}+\\dfrac{1}{n_b}\\right)}}'],
    where: [['\\bar R_a,\\ \\bar R_b', 'mean ranks of phases a and b'], ['u_j', 'tie-group sizes, as in Kruskal–Wallis']],
    thesis: 'The three pairwise p-values are adjusted with the Benjamini–Hochberg procedure; pairs with adjusted p < 0.05 are declared different.',
    ref: 'Section 3.8.2, Eq. 3.4',
  },
  {
    id: 'benjamini-hochberg', name: 'Benjamini–Hochberg adjustment (false discovery rate)', group: 'Tests and inference', aliases: ['Benjamini–Hochberg', 'Benjamini-Hochberg', 'BH-adjusted', 'BH-corrected', 'BH'],
    what: 'When many tests are run together, some will look significant by chance. The BH procedure inflates each p-value to control the expected share of false discoveries among the results declared significant.',
    math: ['\\tilde p_{(j)}=\\min_{l\\ge j}\\ \\min\\left\\{1,\\ \\frac{m\\,p_{(l)}}{l}\\right\\}'],
    where: [['p_{(1)}\\le\\cdots\\le p_{(m)}', 'the m ordered p-values of one family of tests'], ['\\tilde p', 'adjusted p-value']],
    thesis: 'Applied within each family of tests (for example the eleven sub-district tests). Results are declared significant at adjusted p < 0.05.',
    ref: 'Section 3.8.2',
  },
  {
    id: 'spearman', name: 'Spearman rank correlation', group: 'Tests and inference', aliases: ['Spearman'],
    what: 'The Pearson correlation of the ranks of two series. It measures how consistently one rises with the other without assuming a straight-line relationship, and is robust to the long tail of hotspot counts.',
    math: ['r_s=\\frac{\\sum_t\\left(R^x_t-\\bar R^x\\right)\\left(R^Y_t-\\bar R^Y\\right)}{\\sqrt{\\sum_t\\left(R^x_t-\\bar R^x\\right)^{2}}\\ \\sqrt{\\sum_t\\left(R^Y_t-\\bar R^Y\\right)^{2}}}'],
    where: [['R^x_t,\\ R^Y_t', 'ranks of the climate index and of the hotspot series']],
    thesis: 'Computed on the n = 120 monthly values of the regency series. The pooled 1,320-row panel is reported only for comparison, because all sub-districts share one ONI series.',
    ref: 'Section 3.8.3, Eq. 3.5',
  },
  {
    id: 'effective-sample-size', name: 'Effective sample size (Bartlett)', group: 'Tests and inference', aliases: ['effective sample size', 'effective-N', 'Neff'],
    what: 'Monthly series are autocorrelated, so 120 months carry less independent information than 120 independent draws. The effective sample size shrinks n according to how strongly both series are correlated with their own previous month; the p-value then uses the smaller n.',
    math: ['N_{\\mathrm{eff}}=n\\,\\frac{1-\\rho_x\\rho_y}{1+\\rho_x\\rho_y},\\qquad \\rho_x=\\frac{\\sum_{t=1}^{n-1}\\left(R^x_t-\\bar R^x\\right)\\left(R^x_{t+1}-\\bar R^x\\right)}{\\sum_{t=1}^{n}\\left(R^x_t-\\bar R^x\\right)^{2}}', 't=r_s\\sqrt{\\frac{N_{\\mathrm{eff}}-2}{1-r_s^{2}}}\\ \\sim\\ t_{N_{\\mathrm{eff}}-2}'],
    where: [['\\rho_y', 'defined the same way from the hotspot ranks'], ['N_{\\mathrm{eff}}', 'bounded between 4 and n']],
    thesis: 'For ONI at lag 0, r_s = 0.356 with N_eff = 42.2: the naive p is below 0.001, but with N_eff it is 0.020 (Table 4.11).',
    ref: 'Section 3.8.3, Eq. 3.6',
  },
  {
    id: 'block-bootstrap', name: 'Moving-block bootstrap', group: 'Tests and inference', aliases: ['moving-block bootstrap', 'block bootstrap', 'block-bootstrap'],
    what: 'A way to get confidence intervals for autocorrelated series. Instead of resampling single months, it resamples overlapping runs of consecutive months, so the dependence between neighbouring months stays intact.',
    thesis: 'Overlapping blocks of 12 consecutive months, start months drawn uniformly with replacement, concatenated until n months are obtained (last block truncated). r_s is recomputed in each of B = 2000 replicates and the 2.5th and 97.5th percentiles are taken.',
    ref: 'Section 3.8.3',
  },
  {
    id: 'wilcoxon', name: 'Wilcoxon signed-rank test', group: 'Tests and inference', aliases: ['Wilcoxon signed-rank', 'Wilcoxon'],
    what: 'A rank-based test for paired differences. Here it compares two model configurations across the same sub-districts.',
    math: ['p_{\\min}=\\frac{2}{2^{11}}\\approx 0.001'],
    where: [['2^{11}', 'sign patterns possible with 11 untied pairs']],
    thesis: 'Used in the ablation across the 11 sub-districts. With 11 untied pairs the smallest attainable exact two-sided p-value is about 0.001.',
    ref: 'Section 3.11.2',
  },
  {
    id: 'mann-whitney', name: 'Mann–Whitney test and the probability P', group: 'Tests and inference', aliases: ['Mann–Whitney', 'Mann-Whitney'],
    what: 'A rank test of whether values from one group tend to be larger than from another. The statistic U also gives a simple effect size: the probability that a randomly chosen hotspot is closer to a canal than a randomly chosen null point.',
    math: ['P=\\Pr\\left(d_{\\text{hotspot}}<d_{\\text{null}}\\right)=\\frac{U}{n_1 n_2}\\quad(\\text{ties counted as }\\tfrac12)'],
    where: [['P=0.5', 'no difference between hotspots and null points'], ['n_1,\\ n_2', 'numbers of hotspots and null points']],
    note: 'The U/(n₁n₂) form is the standard identity; the thesis defines P in words and reports it with the Mann–Whitney test.',
    thesis: 'Across all peat, P = 0.568 for hotspot distance to the nearest canal against depth-matched random points.',
    ref: 'Section 3.15; Section 4.9',
  },
  {
    id: 'fisher-exact', name: 'Fisher’s exact test', group: 'Tests and inference', aliases: ['Fisher’s exact', 'Fisher exact', 'Fisher OR'],
    what: 'Tests a 2×2 table exactly. For each sub-district the months are cross-classified by El Niño vs other phases and by whether any hotspot occurred.',
    math: ['P(a)=\\frac{\\dbinom{a+b}{a}\\dbinom{c+d}{c}}{\\dbinom{n}{a+c}}'],
    where: [['a,\\ b', 'El Niño months with and without fire'], ['c,\\ d', 'other months with and without fire']],
    thesis: 'The two-sided p-value sums P over all tables with the same margins that are no more probable than the observed one. In every sub-district fire was more frequent in El Niño months (Fisher odds ratios 1.1 to 5.4).',
    ref: 'Section 3.8.5, Eq. 3.9; Table 4.17',
  },
  {
    id: 'wald-test', name: 'Wald test (common ONI slope)', group: 'Tests and inference', aliases: ['Wald test', 'Wald'],
    what: 'Tests whether several coefficients are jointly zero. Here the null is that ONI has the same effect in all 11 sub-districts, i.e. all ten sub-district interaction terms are zero.',
    math: ['W=(R\\hat\\beta)^{\\top}\\left(R\\hat V R^{\\top}\\right)^{-1}(R\\hat\\beta)\\ \\sim\\ \\chi^{2}_{10}'],
    where: [['R', 'matrix selecting the ten ONI × sub-district interaction coefficients'], ['\\hat V', 'cluster-robust covariance matrix']],
    thesis: 'W gives χ²₁₀ = 23.23, p = 0.010: the ENSO response differs significantly between sub-districts.',
    ref: 'Section 3.8.5, Eq. 3.10; Table 4.17',
  },
  {
    id: 'chi-square-peat', name: 'Chi-square, Cohen’s w and Cramér’s V (peat depth)', group: 'Tests and inference', aliases: ['Cramér’s V', 'Cramér\'s V', 'Cohen’s w', 'goodness-of-fit'],
    what: 'Compares observed hotspot counts per depth class with the counts expected if fire were proportional to peat area. Because hotspots are spatially autocorrelated, the p-value is not used; the effect sizes are.',
    math: ['E_j=N_p\\,\\frac{a_j}{A}\\qquad \\chi^{2}=\\sum_{j=1}^{k}\\frac{(O_j-E_j)^{2}}{E_j}', 'w=\\sqrt{\\frac{\\chi^{2}}{N_p}}\\qquad V=\\sqrt{\\frac{\\chi^{2}}{N_p\\,(k-1)}}=\\frac{w}{\\sqrt{k-1}}', 'q_j=\\frac{O_j/N_p}{a_j/A}'],
    where: [['O_j', 'hotspots on peat in depth class j'], ['a_j,\\ A', 'peat area of class j and of all peat'], ['q_j', 'ratio of hotspot share to area share']],
    thesis: 'A class is over-represented if q > 1.2 and under-represented if q < 0.8. Cohen’s w is the primary effect size. For the canal distance classes, Cramér’s V = 0.212 (Table 4.33).',
    ref: 'Section 3.8.7, Eq. 3.12',
  },
  {
    id: 'mann-kendall', name: 'Mann–Kendall trend test and Sen’s slope', group: 'Tests and inference', aliases: ['Mann–Kendall', 'Mann-Kendall', 'Sen’s slope', 'Sen\'s slope'],
    what: 'A rank-based test for a monotonic trend that makes no assumption about the shape of the data. Kendall’s τ expresses the strength; Sen’s slope is the median of all pairwise slopes and gives the trend magnitude.',
    math: ['S=\\sum_{j=1}^{n-1}\\sum_{k=j+1}^{n}\\operatorname{sgn}(x_k-x_j)', '\\mathrm{Var}(S)=\\frac{n(n-1)(2n+5)-\\sum_p u_p(u_p-1)(2u_p+5)}{18}\\qquad Z=\\frac{S-\\operatorname{sgn}(S)}{\\sqrt{\\mathrm{Var}(S)}}', '\\tau=\\frac{S}{n(n-1)/2}\\qquad \\beta_{\\mathrm{Sen}}=\\operatorname*{median}_{j<k}\\frac{x_k-x_j}{k-j}'],
    where: [['u_p', 'size of the p-th group of tied values']],
    thesis: 'Applied to annual totals (n = 10). The seasonal version (Hirsch et al.) treats months as independent, so it is liberal; the annual test is the more conservative one. Jackknife runs drop 2015, 2019 and 2023.',
    ref: 'Section 3.8.6, Eq. 3.11',
  },

  // ───────── Count models ─────────
  {
    id: 'poisson-qmle', name: 'Poisson quasi-maximum-likelihood count model', group: 'Count models', aliases: ['Poisson-QMLE', 'Poisson QMLE', 'Poisson count model', 'Poisson model'],
    what: 'A regression for counts with sub-district fixed effects and seasonal terms. The estimator stays consistent as long as the mean is correct, whatever the variance, and the standard errors are clustered by calendar month to allow for dependence among sub-districts in the same month.',
    math: ['\\log E[y_{it}]=\\alpha_i+\\beta_1\\mathrm{ONI}_t+\\beta_2\\mathrm{SPEI3}_{it}+\\beta_3\\mathrm{DMI}_t+\\sum_{k=1}^{2}\\left[\\gamma_k\\sin\\frac{2\\pi k m_t}{12}+\\delta_k\\cos\\frac{2\\pi k m_t}{12}\\right]', '\\hat V(\\hat\\beta)=\\Big(\\sum_{it}\\mu_{it}x_{it}x_{it}^{\\top}\\Big)^{-1}\\Big(\\sum_{\\ell}s_\\ell s_\\ell^{\\top}\\Big)\\Big(\\sum_{it}\\mu_{it}x_{it}x_{it}^{\\top}\\Big)^{-1},\\quad s_\\ell=\\sum_{(i,t)\\in\\ell}x_{it}\\,(y_{it}-\\hat\\mu_{it})'],
    where: [['y_{it}', 'hotspots in sub-district i, month t'], ['\\alpha_i', 'sub-district fixed effect'], ['\\ell', 'a cluster: one calendar month, all 11 sub-districts']],
    thesis: 'Three specifications: M1 (ONI only), M2 (ONI + SPEI-3), M3 (M2 + DMI). A negative binomial model was fitted as a robustness check and gave similar estimates.',
    ref: 'Section 3.8.4, Eq. 3.7–3.8',
  },
  {
    id: 'irr', name: 'Incidence rate ratio (IRR) and attenuation', group: 'Count models', aliases: ['IRR', 'incidence rate ratio'],
    what: 'The exponentiated coefficient of a count model: the multiplicative change in expected monthly hotspots for a one-unit increase in a predictor. For ONI, one unit is +1 °C. An IRR of 1 means no effect.',
    math: ['\\mathrm{IRR}=e^{\\beta},\\qquad \\text{95\\% CI}=\\exp\\!\\left(\\hat\\beta\\pm1.96\\,\\widehat{\\mathrm{se}}\\right)', '\\text{attenuation}=1-\\frac{\\hat\\beta_1^{M2}}{\\hat\\beta_1^{M1}}'],
    thesis: 'ONI IRR 1.95 in M1 falls to 1.29 once SPEI-3 is added; SPEI-3 itself has IRR 0.35 (about 65% fewer expected hotspots per wetter unit). The thesis calls the drop attenuation, not a formal mediation analysis.',
    ref: 'Section 3.8.4; Section 4.5.3, Table 4.12',
  },
  {
    id: 'wild-bootstrap', name: 'Year-level wild cluster bootstrap', group: 'Count models', aliases: ['wild bootstrap', 'wild cluster bootstrap'],
    what: 'An inference check suited to few clusters. With only ten years, standard cluster-robust errors are unreliable, so the score of each year is perturbed with random weights and the test statistic is rebuilt many times under the null.',
    thesis: 'Year-level score wild cluster bootstrap with restricted null, six-point Webb weights and B = 9,999 replicates, alongside year-clustered, Driscoll–Kraay and Newey–West errors.',
    ref: 'Section 3.8.4',
  },

  // ───────── Space and time ─────────
  {
    id: 'morans-i', name: 'Moran’s I (global spatial autocorrelation)', group: 'Space and time', aliases: ['Moran’s I', 'Moran\'s I', 'Moran’s'],
    what: 'Measures whether neighbouring sub-districts have similar values. Above its expected value means similar values cluster; below means neighbours differ.',
    math: ['I=\\frac{n_s}{S_0}\\,\\frac{\\sum_i\\sum_j w_{ij}\\,z_i z_j}{\\sum_i z_i^{2}},\\qquad E[I]=-\\frac{1}{n_s-1}'],
    where: [['z_i', 'value minus the mean'], ['w_{ij}', 'row-standardised Queen-contiguity weights'], ['S_0', 'sum of all weights'], ['n_s', '11 sub-districts']],
    thesis: 'Significance from 999 random permutations of the values across sub-districts.',
    ref: 'Section 3.9, Eq. 3.13',
  },
  {
    id: 'lisa', name: 'Local Moran’s I (LISA)', group: 'Space and time', aliases: ['LISA', 'Local Moran'],
    what: 'The local version of Moran’s I: one value per sub-district, telling whether it sits in a cluster of high values, a cluster of low values, or is an outlier among its neighbours.',
    math: ['I_i=\\frac{z_i}{m_2}\\sum_j w_{ij}z_j,\\qquad m_2=\\frac{\\sum_i z_i^{2}}{n_s}'],
    thesis: 'Significant sub-districts (999 permutations; 499 in the period-wise emerging-hotspot analysis) are labelled High–High, Low–Low, High–Low or Low–High from the signs of z_i and of its spatial lag.',
    ref: 'Section 3.9',
  },

  // ───────── Machine learning ─────────
  {
    id: 'random-forest', name: 'Random Forest', group: 'Machine learning', aliases: ['Random Forest'],
    what: 'An ensemble of decision trees, each trained on a random resample of the data and random subsets of features; the forest averages their predictions into a fire probability.',
    thesis: 'The reference model, predicting monthly fire occurrence from 14 candidate features. Hyperparameters were fixed and not tuned (for example 200 trees, depth 10 under spatial validation).',
    ref: 'Section 3.11.1, Table 3.4',
  },
  {
    id: 'loko-loyo', name: 'LOKO and LOYO cross-validation', group: 'Machine learning', aliases: ['LOKO', 'LOYO', 'leave-one-sub-district-out', 'leave-one-year-out'],
    what: 'Blocked validation: instead of random splits, a whole block is held out. Leave-one-sub-district-out (LOKO) tests whether a model transfers to a place it has never seen; leave-one-year-out (LOYO) tests whether it transfers to a year it has never seen.',
    thesis: 'LOKO uses 11 folds, each holding out one sub-district, and is a spatial diagnostic, not a forecast test. LOYO uses ten folds, each holding out one year, with lagged features. A double hold-out leaves out both.',
    ref: 'Section 3.11.2',
  },
  {
    id: 'auc', name: 'AUC (area under the ROC curve)', group: 'Machine learning', aliases: ['AUC'],
    what: 'The probability that a randomly chosen fire month receives a higher predicted probability than a randomly chosen non-fire month. 0.5 is no better than chance; 1 is perfect ranking.',
    math: ['\\mathrm{AUC}=\\Pr\\left(\\hat p_{\\text{fire month}}>\\hat p_{\\text{non-fire month}}\\right)'],
    thesis: 'Reported with year-block bootstrap confidence intervals. Random Forest reaches about 0.79–0.81 under spatial and temporal hold-out.',
    ref: 'Section 3.11.2',
  },
  {
    id: 'brier', name: 'Brier score and Brier skill score', group: 'Machine learning', aliases: ['Brier skill score', 'Brier score', 'BSS'],
    what: 'The Brier score is the mean squared error of predicted probabilities. The skill score compares it with a climatological reference: 0 is no better than climatology, 1 is perfect.',
    math: ['\\mathrm{BS}=\\frac{1}{N}\\sum_{i,t}\\left(\\hat p_{it}-\\mathrm{fire}_{it}\\right)^{2}', '\\mathrm{BSS}=1-\\frac{\\mathrm{BS}_{\\text{model}}}{\\mathrm{BS}_{\\text{clim}}}'],
    where: [['\\mathrm{BS}_{\\text{clim}}', 'Brier score of the climatological probability (sub-district × calendar-month fire frequency)']],
    thesis: 'The Random Forest beats climatology with Brier skill scores up to 0.21.',
    ref: 'Section 3.11.2',
  },
  {
    id: 'shap', name: 'SHAP values (Shapley additive explanations)', group: 'Machine learning', aliases: ['SHAP'],
    what: 'Splits a model’s prediction among its features by averaging each feature’s marginal contribution over all orders in which features could be added. The thesis aggregates absolute SHAP values by feature group.',
    math: ['\\phi_j(x)=\\sum_{S\\subseteq F\\setminus\\{j\\}}\\frac{|S|!\\,(|F|-|S|-1)!}{|F|!}\\left[f_{S\\cup\\{j\\}}(x)-f_S(x)\\right]', '\\text{share of group }G=\\frac{\\sum_{j\\in G}|\\phi_j|}{\\sum_{j\\in F}|\\phi_j|}'],
    where: [['F', 'full set of features'], ['|\\phi_j|', 'mean absolute SHAP value over hold-out observations']],
    thesis: 'Computed on hold-out data with the exact tree algorithm. SHAP is a second view of the same model, not an independent test.',
    ref: 'Section 3.11.3',
  },
  {
    id: 'vif', name: 'VIF (variance inflation factor)', group: 'Machine learning', aliases: ['VIF'],
    what: 'How much a predictor’s variance is inflated by its correlation with the other predictors. Large values flag multicollinearity.',
    math: ['\\mathrm{VIF}_j=\\frac{1}{1-R_j^{2}}'],
    where: [['R_j^2', 'R² from regressing feature j on all the other features']],
    note: 'Standard definition; the thesis cites O’Brien (2007) and does not write the formula out.',
    thesis: 'Used to check multicollinearity among the 14 candidate features before modelling.',
    ref: 'Section 3.11.1',
  },

  // ───────── Early warning and validation ─────────
  {
    id: 'pss', name: 'POD, FAR, POFD, CSI and the Peirce Skill Score', group: 'Early warning and validation', aliases: ['Peirce Skill Score', 'PSS', 'POD', 'FAR'],
    what: 'Yes/no forecast scores built from hits, false alarms, misses and correct negatives. The Peirce Skill Score rewards catching fires and penalises false alarms in one number; 0 means no skill over chance.',
    math: ['\\mathrm{POD}=\\frac{TP}{TP+FN}\\qquad \\mathrm{FAR}=\\frac{FP}{TP+FP}\\qquad \\mathrm{POFD}=\\frac{FP}{FP+TN}', '\\mathrm{CSI}=\\frac{TP}{TP+FN+FP}\\qquad \\mathrm{PSS}=\\mathrm{POD}-\\mathrm{POFD}'],
    where: [['TP,\\ FP', 'hits and false alarms'], ['FN,\\ TN', 'misses and correct negatives']],
    thesis: 'The nested ONI-plus-drought rule scores PSS 0.205 against 0.163 for alarming in every fire month; the difference (+0.034, 95% CI −0.039 to +0.102) is not significant.',
    ref: 'Section 3.13; Table 4.27',
  },
  {
    id: 'wilson', name: 'Wilson confidence interval', group: 'Early warning and validation', aliases: ['Wilson interval', 'Wilson confidence interval', 'Wilson'],
    what: 'A confidence interval for a proportion that behaves well with small samples. The alert level of a sub-district is set by the lower bound of this interval for the probability of a fire month in El Niño fire-season months.',
    math: ['\\frac{\\hat p+\\dfrac{z^{2}}{2n}\\ \\pm\\ z\\sqrt{\\dfrac{\\hat p(1-\\hat p)}{n}+\\dfrac{z^{2}}{4n^{2}}}}{1+\\dfrac{z^{2}}{n}}'],
    where: [['\\hat p', 'observed share of fire months'], ['n', 'number of months'], ['z', '1.96 for a 95% interval']],
    note: 'Standard formula; the thesis cites Wilson (1927) and does not write it out.',
    thesis: 'Alert levels: Alert 1 if the lower bound is 0.60 or more, Alert 2 for 0.40, Alert 3 for 0.25, Watch for 0.10, Normal below.',
    ref: 'Section 3.13; Table 4.25',
  },
  {
    id: 'agreement', name: 'Precision, recall, F1, Cohen’s κ and MCC', group: 'Early warning and validation', aliases: ['Cohen’s κ', 'Matthews', 'MCC'],
    what: 'Scores for how well two yes/no series agree, here months with a hotspot against months with MODIS burned area.',
    math: ['\\mathrm{precision}=\\frac{TP}{TP+FP}\\quad \\mathrm{recall}=\\frac{TP}{TP+FN}\\quad F_1=\\frac{2\\,\\mathrm{precision}\\cdot\\mathrm{recall}}{\\mathrm{precision}+\\mathrm{recall}}', '\\kappa=\\frac{p_o-p_e}{1-p_e}\\qquad \\mathrm{MCC}=\\frac{TP\\cdot TN-FP\\cdot FN}{\\sqrt{(TP+FP)(TP+FN)(TN+FP)(TN+FN)}}'],
    where: [['p_o', 'observed agreement'], ['p_e', 'agreement expected by chance']],
    note: 'Standard definitions; the thesis lists these metrics without writing the formulas.',
    thesis: 'Tier 1 validation, with a ±1-month tolerance. Because MCD64A1 partly uses MODIS active fires as input, this measures consistency rather than independent agreement.',
    ref: 'Section 3.14',
  },
  {
    id: 'cvi', name: 'Composite vulnerability index (CVI)', group: 'Early warning and validation', aliases: ['composite vulnerability index', 'CVI'],
    what: 'A weighted average of min–max scaled components, used to rank sub-districts. It is a relative screening measure, not a calibrated risk model.',
    math: ['\\mathrm{CVI}=\\frac{\\sum_k w_k\\,\\tilde x_k}{\\sum_k w_k}'],
    where: [['\\tilde x_k', 'component k scaled to 0–1 across the eleven sub-districts'], ['w_k', 'weight chosen by judgement']],
    thesis: 'Primary version: climate hazard 40% (|r| with ONI, SPEI-3, precipitation), peat condition 40% (area, mean depth), exposure 20% (population). Hotspot counts are left out to avoid circularity.',
    ref: 'Section 3.12',
  },

  // ───────── Canals and peat ─────────
  {
    id: 'canal-logit', name: 'Logistic regression for canal distance, and the odds ratio', group: 'Canals and peat', aliases: ['odds ratio per ten-fold'],
    what: 'Each hotspot (1) is compared with random null points on peat (0). The model asks how the odds of being a hotspot change with the logarithm of distance to the nearest canal, controlling for peat depth class.',
    math: ['\\operatorname{logit}\\Pr(\\text{hotspot})=\\alpha+\\beta\\,\\log_{10}(d+10)+\\sum_{c}\\gamma_c\\,\\mathbb 1[\\text{depth}=c]', '\\mathrm{OR}=e^{\\beta}\\ \\text{per ten-fold increase in distance}'],
    where: [['d', 'distance to the nearest canal in metres'], ['\\mathrm{OR}<1', 'odds fall with distance from canals']],
    thesis: 'OR = 0.74 per ten-fold increase in distance (95% CI 0.68–0.82). Standard errors are clustered by 1 km grid cell because neighbouring points are not independent.',
    ref: 'Section 3.15; Section 4.9',
  },
];

export const BY_ID: Record<string, Entry> = Object.fromEntries(GLOSSARY.map((e) => [e.id, e]));

const tex = (s: string, display = false) => katex.renderToString(s, { displayMode: display, throwOnError: true, output: 'html', strict: 'ignore' });
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** HTML for one entry (used by the popup, via /glossary.json, and by the glossary page). */
export function renderEntry(e: Entry, base: string): string {
  const parts: string[] = [];
  parts.push(`<p class="tc-what">${esc(e.what)}</p>`);
  if (e.math?.length) parts.push(`<div class="tc-math">${e.math.map((m) => `<div>${tex(m, true)}</div>`).join('')}</div>`);
  if (e.where?.length) parts.push(`<dl class="tc-where">${e.where.map(([s, d]) => `<div><dt>${tex(s)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>`);
  if (e.thesis) parts.push(`<p class="tc-thesis"><b>In the thesis.</b> ${esc(e.thesis)}</p>`);
  if (e.note) parts.push(`<p class="tc-note">${esc(e.note)}</p>`);
  if (e.ref) parts.push(`<p class="tc-ref">Thesis ${esc(e.ref)}</p>`);
  void base;
  return parts.join('');
}
